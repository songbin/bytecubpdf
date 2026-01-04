import base64
import json
import logging
import threading
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import cv2
import httpx
import msgpack
import numpy as np
import pymupdf
from tenacity import retry
from tenacity import retry_if_exception_type
from tenacity import stop_after_attempt
from tenacity import wait_exponential

import babeldoc
from babeldoc.docvision.base_doclayout import DocLayoutModel
from babeldoc.docvision.base_doclayout import YoloBox
from babeldoc.docvision.base_doclayout import YoloResult
from babeldoc.format.pdf.document_il.utils.extract_char import (
    convert_page_to_char_boxes,
)
from babeldoc.format.pdf.document_il.utils.extract_char import (
    process_page_chars_to_lines,
)
from babeldoc.format.pdf.document_il.utils.fontmap import FontMapper
from babeldoc.format.pdf.document_il.utils.layout_helper import SPACE_REGEX
from babeldoc.format.pdf.document_il.utils.mupdf_helper import (
    get_no_rotation_img_multiprocess,
)

logger = logging.getLogger(__name__)
DPI = 150


def encode_image(image) -> bytes:
    """Read and encode image to bytes

    Args:
        image: Can be either a file path (str) or numpy array
    """
    if isinstance(image, str):
        if not Path(image).exists():
            raise FileNotFoundError(f"Image file not found: {image}")
        img = cv2.imread(image)
        if img is None:
            raise ValueError(f"Failed to read image: {image}")
    else:
        img = image

    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    # logger.debug(f"Image shape: {img.shape}")
    encoded = cv2.imencode(".jpg", img)[1].tobytes()
    # logger.debug(f"Encoded image size: {len(encoded)} bytes")
    return encoded


def clip_num(num: float, min_value: float, max_value: float) -> float:
    """Clip a number to a specified range."""
    if num < min_value:
        return min_value
    elif num > max_value:
        return max_value
    return num


@retry(
    stop=stop_after_attempt(5),  # 最多重试 3 次
    wait=wait_exponential(
        multiplier=1, min=1, max=10
    ),  # 指数退避策略，初始 1 秒，最大 10 秒
    retry=retry_if_exception_type((httpx.HTTPError, Exception)),  # 针对哪些异常重试
    before_sleep=lambda retry_state: logger.warning(
        f"Request failed VLM, retrying in {getattr(retry_state.next_action, 'sleep', 'unknown')} seconds... "
        f"(Attempt {retry_state.attempt_number}/5)"
    ),
)
def predict_layout(
    image,
    host: str = "http://localhost:8000",
    _imgsz: int = 1024,
    lines=None,
    font_mapper: FontMapper | None = None,
):
    """Predict document layout using OCR line information (RPC service)."""

    if lines is None:
        lines = []

    image_data = encode_image(image)

    def convert_line(line):
        if not line.text:
            return None
        boxes = [c[0] for c in line.chars]
        min_x = min(b.x for b in boxes)
        max_x = max(b.x2 for b in boxes)
        min_y = min(b.y for b in boxes)
        max_y = max(b.y2 for b in boxes)

        image_height, image_width = image.shape[:2]

        # Transform to image pixel coordinates
        min_x = min_x / 72 * DPI
        max_x = max_x / 72 * DPI
        min_y = min_y / 72 * DPI
        max_y = max_y / 72 * DPI

        min_y, max_y = image_height - max_y, image_height - min_y

        box_volume = (max_x - min_x) * (max_y - min_y)
        if box_volume < 1:
            return None

        min_x = clip_num(min_x, 0, image_width - 1)
        max_x = clip_num(max_x, 0, image_width - 1)
        min_y = clip_num(min_y, 0, image_height - 1)
        max_y = clip_num(max_y, 0, image_height - 1)

        filtered_text = filter_text(line.text, font_mapper)
        if not filtered_text:
            return None

        return {"box": [min_x, min_y, max_x, max_y], "text": filtered_text}

    formatted_results = [convert_line(l) for l in lines]
    formatted_results = [r for r in formatted_results if r is not None]
    if not formatted_results:
        return None

    image_b64 = base64.b64encode(image_data).decode("utf-8")

    request_data = {
        "image": image_b64,
        "ocr_results": formatted_results,
        "image_size": list(image.shape[:2])[::-1],  # (height, width)
    }

    response = httpx.post(
        f"{host}/inference",
        json=request_data,
        headers={"Accept": "application/json", "Content-Type": "application/json"},
        timeout=30,
        follow_redirects=True,
    )

    idx = 0
    id_lookup = {}
    if response.status_code == 200:
        try:
            result = json.loads(response.text)
            useful_result = []
            if isinstance(result, dict):
                names = {}
                clusters = result["clusters"]
                for box in clusters:
                    box["xyxy"] = box["box"]
                    box["conf"] = 1
                    if box["label"] not in names:
                        idx += 1
                        names[idx] = box["label"]
                        box["cls_id"] = idx
                        id_lookup[box["label"]] = idx
                    else:
                        box["cls_id"] = id_lookup[box["label"]]
                    names[box["cls_id"]] = box["label"]
                    box["cls"] = box["cls_id"]
                    useful_result.append(box)
                if "names" not in result:
                    result["names"] = names
                result["boxes"] = useful_result
                result = [result]
            return result
        except Exception as e:
            logger.exception(f"Failed to unpack response: {e!s}")
            raise
    else:
        logger.error(f"Request failed with status {response.status_code}")
        logger.error(f"Response content: {response.text}")
        raise Exception(
            f"Request failed with status {response.status_code}: {response.text}",
        )


@retry(
    stop=stop_after_attempt(5),  # 最多重试 3 次
    wait=wait_exponential(
        multiplier=1, min=1, max=10
    ),  # 指数退避策略，初始 1 秒，最大 10 秒
    retry=retry_if_exception_type((httpx.HTTPError, Exception)),  # 针对哪些异常重试
    before_sleep=lambda retry_state: logger.warning(
        f"Request failed PADDLE, retrying in {getattr(retry_state.next_action, 'sleep', 'unknown')} seconds... "
        f"(Attempt {retry_state.attempt_number}/5)"
    ),
)
def predict_layout2(
    image,
    host: str = "http://localhost:8000",
    _imgsz: int = 1024,
):
    """
    Predict document layout using the MOSEC service

    Args:
        image: Can be either a file path (str) or numpy array
        host: Service host URL
        imgsz: Image size for model input

    Returns:
        List of predictions containing bounding boxes and classes
    """
    # Prepare request data

    if not isinstance(image, list):
        image = [image]
    image_data = [encode_image(image) for image in image]
    data = {
        "image": image_data,
    }

    # Pack data using msgpack
    packed_data = msgpack.packb(data, use_bin_type=True)
    # logger.debug(f"Packed data size: {len(packed_data)} bytes")

    # Send request
    # logger.debug(f"Sending request to {host}/inference")
    response = httpx.post(
        # f"{host}/analyze?min_sim=0.7&early_stop=0.99&timeout=480",
        f"{host}/inference",
        data=packed_data,
        headers={
            "Content-Type": "application/msgpack",
            "Accept": "application/msgpack",
        },
        timeout=30,
        follow_redirects=True,
    )

    # logger.debug(f"Response status: {response.status_code}")
    # logger.debug(f"Response headers: {response.headers}")
    idx = 0
    id_lookup = {}
    if response.status_code == 200:
        try:
            result = msgpack.unpackb(response.content, raw=False)
            useful_result = []
            if isinstance(result, dict):
                names = {}
                for box in result["boxes"]:
                    if box["score"] < 0.7:
                        continue

                    box["xyxy"] = box["coordinate"]
                    box["conf"] = box["score"]
                    if box["label"] not in names:
                        idx += 1
                        names[idx] = box["label"]
                        box["cls_id"] = idx
                        id_lookup[box["label"]] = idx
                    else:
                        box["cls_id"] = id_lookup[box["label"]]
                    names[box["cls_id"]] = box["label"]
                    box["cls"] = box["cls_id"]
                    useful_result.append(box)
                if "names" not in result:
                    result["names"] = names
                result["boxes"] = useful_result
                result = [result]
            return result
        except Exception as e:
            logger.exception(f"Failed to unpack response: {e!s}")
            raise
    else:
        logger.error(f"Request failed with status {response.status_code}")
        logger.error(f"Response content: {response.content}")
        raise Exception(
            f"Request failed with status {response.status_code}: {response.text}",
        )


class ResultContainer:
    def __init__(self):
        self.result = YoloResult(boxes_data=np.array([]), names=[])


def filter_text(txt: str, font_mapper: FontMapper):
    normalize = unicodedata.normalize("NFKC", txt)
    unicodes = []
    for c in normalize:
        if font_mapper.has_char(c):
            unicodes.append(c)
    normalize = "".join(unicodes)
    result = SPACE_REGEX.sub(" ", normalize).strip()
    return result


class RpcDocLayoutModel(DocLayoutModel):
    """DocLayoutModel implementation that uses RPC service."""

    def __init__(self, host: str = "http://localhost:8000;http://localhost:8001"):
        """Initialize RPC model with host address.

        Args:
            host: Two RPC service hosts separated by ';', e.g. "host1;host2".
        """
        if ";" not in host:
            raise ValueError(
                "RpcDocLayoutModel host must be two hosts separated by ';' (e.g. 'http://h1;http://h2')"
            )

        self.host1, self.host2 = [h.strip() for h in host.split(";", 1)]

        # keep the raw host string for logging/debugging purposes
        self.host = host

        self._stride = 32  # Default stride value
        self._names = ["text", "title", "list", "table", "figure"]
        self.lock = threading.Lock()
        self.font_mapper = None

    def init_font_mapper(self, translation_config):
        self.font_mapper = FontMapper(translation_config)

    @property
    def stride(self) -> int:
        """Stride of the model input."""
        return self._stride

    def resize_and_pad_image(self, image, new_shape):
        """
        Resize and pad the image to the specified size,
        ensuring dimensions are multiples of stride.

        Parameters:
        - image: Input image
        - new_shape: Target size (integer or (height, width) tuple)
        - stride: Padding alignment stride, default 32

        Returns:
        - Processed image
        """
        if isinstance(new_shape, int):
            new_shape = (new_shape, new_shape)

        h, w = image.shape[:2]
        new_h, new_w = new_shape

        # Calculate scaling ratio
        r = min(new_h / h, new_w / w)
        resized_h, resized_w = int(round(h * r)), int(round(w * r))

        # Resize image
        image = cv2.resize(
            image, (resized_w, resized_h), interpolation=cv2.INTER_LINEAR
        )

        # Calculate padding size
        pad_h = new_h - resized_h
        pad_w = new_w - resized_w
        top, bottom = pad_h // 2, pad_h - pad_h // 2
        left, right = pad_w // 2, pad_w - pad_w // 2

        # Add padding
        image = cv2.copyMakeBorder(
            image, top, bottom, left, right, cv2.BORDER_CONSTANT, value=(114, 114, 114)
        )

        return image

    def scale_boxes(self, img1_shape, boxes, img0_shape):
        """
        Rescales bounding boxes (in the format of xyxy by default) from the shape of the image they were originally
        specified in (img1_shape) to the shape of a different image (img0_shape).

        Args:
            img1_shape (tuple): The shape of the image that the bounding boxes are for,
                in the format of (height, width).
            boxes (torch.Tensor): the bounding boxes of the objects in the image, in the format of (x1, y1, x2, y2)
            img0_shape (tuple): the shape of the target image, in the format of (height, width).

        Returns:
            boxes (torch.Tensor): The scaled bounding boxes, in the format of (x1, y1, x2, y2)
        """

        # Calculate scaling ratio
        gain = min(img1_shape[0] / img0_shape[0], img1_shape[1] / img0_shape[1])

        # Calculate padding size
        pad_x = round((img1_shape[1] - img0_shape[1] * gain) / 2 - 0.1)
        pad_y = round((img1_shape[0] - img0_shape[0] * gain) / 2 - 0.1)

        # Remove padding and scale boxes
        boxes = (boxes - [pad_x, pad_y, pad_x, pad_y]) / gain
        return boxes

    def calculate_iou(self, box1, box2):
        """Calculate IoU between two boxes in xyxy format."""
        x1_1, y1_1, x2_1, y2_1 = box1
        x1_2, y1_2, x2_2, y2_2 = box2

        # Calculate intersection area
        x1_inter = max(x1_1, x1_2)
        y1_inter = max(y1_1, y1_2)
        x2_inter = min(x2_1, x2_2)
        y2_inter = min(y2_1, y2_2)

        if x2_inter <= x1_inter or y2_inter <= y1_inter:
            return 0.0

        intersection = (x2_inter - x1_inter) * (y2_inter - y1_inter)

        # Calculate union area
        area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
        area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
        union = area1 + area2 - intersection

        return intersection / union if union > 0 else 0.0

    def is_subset(self, inner_box, outer_box):
        """Check if inner_box is a subset of outer_box."""
        x1_inner, y1_inner, x2_inner, y2_inner = inner_box
        x1_outer, y1_outer, x2_outer, y2_outer = outer_box

        return (
            x1_inner >= x1_outer
            and y1_inner >= y1_outer
            and x2_inner <= x2_outer
            and y2_inner <= y2_outer
        )

    def expand_box_to_contain(self, box_to_expand, box_to_contain):
        """Expand box_to_expand to fully contain box_to_contain."""
        x1_expand, y1_expand, x2_expand, y2_expand = box_to_expand
        x1_contain, y1_contain, x2_contain, y2_contain = box_to_contain

        return [
            min(x1_expand, x1_contain),
            min(y1_expand, y1_contain),
            max(x2_expand, x2_contain),
            max(y2_expand, y2_contain),
        ]

    def post_process_boxes(self, merged_boxes: list[YoloBox], names: dict[int, str]):
        """Post-process merged boxes to handle text and paragraph_hybrid overlaps."""
        for i, text_box in enumerate(merged_boxes):
            text_label = names.get(text_box.cls, "")
            if "text" not in text_label:
                continue

            for j, para_box in enumerate(merged_boxes):
                if i == j:
                    continue

                para_label = names.get(para_box.cls, "")
                if "paragraph_hybrid" not in para_label:
                    continue

                # Calculate IoU
                iou = self.calculate_iou(text_box.xyxy, para_box.xyxy)

                # Check if IoU > 0.95 and paragraph is not subset of text
                if iou > 0.95 and not self.is_subset(para_box.xyxy, text_box.xyxy):
                    # Expand text box to contain paragraph_hybrid
                    expanded_box = self.expand_box_to_contain(
                        text_box.xyxy, para_box.xyxy
                    )
                    merged_boxes[i] = YoloBox(
                        None,
                        np.array(expanded_box),
                        text_box.conf,
                        text_box.cls,
                    )

    def predict_image(
        self,
        image,
        imgsz: int = 1024,
        lines=None,
    ) -> YoloResult:
        """Predict the layout of a single page and fuse results from two RPC services."""

        # Resize/pad image if needed – use original size to avoid extra scaling artefacts
        orig_h, orig_w = image.shape[:2]
        target_imgsz = (orig_h, orig_w)
        if image.shape[0] != target_imgsz[0] or image.shape[1] != target_imgsz[1]:
            image_proc = self.resize_and_pad_image(image, new_shape=target_imgsz)
        else:
            image_proc = image

        # Parallel calls to both services; exceptions propagate if either fails
        with ThreadPoolExecutor(max_workers=2) as ex:
            if lines:
                future1 = ex.submit(
                    predict_layout,
                    image_proc,
                    self.host1,
                    imgsz,
                    lines,
                    self.font_mapper,
                )
            future2 = ex.submit(predict_layout2, image_proc, self.host2, imgsz)

            # .result() will re-raise any exception occurred in worker thread.
            if lines:
                preds1 = future1.result()
            else:
                preds1 = None
            preds2 = future2.result()

        # Convert DPI to PDF points (72 dpi)
        pdf_h, pdf_w = orig_h / DPI * 72, orig_w / DPI * 72

        merged_boxes: list[YoloBox] = []
        names: dict[int, str] = {}

        def _process_preds(preds, id_offset: int, label_suffix: str | None):
            for pred in preds or []:
                for box in pred["boxes"]:
                    # scale coords back to PDF space
                    scaled_xyxy = self.scale_boxes(
                        target_imgsz, np.array(box["xyxy"]), (pdf_h, pdf_w)
                    )

                    new_cls_id = box["cls"] + id_offset

                    # derive label – fall back gracefully if missing
                    label = pred["names"].get(box["cls"], str(box["cls"]))
                    if label_suffix:
                        label = f"{label}{label_suffix}"

                    names[new_cls_id] = label

                    merged_boxes.append(
                        YoloBox(
                            None,
                            scaled_xyxy,
                            np.array(box.get("conf", box.get("score", 1.0))),
                            new_cls_id,
                        )
                    )

        # service-1: +1000 id, add "_hybrid" suffix
        if preds1:
            _process_preds(preds1, 1000, "_hybrid")

        # service-2: +2000 id, label unchanged
        _process_preds(preds2, 2000, None)

        # Sort boxes by confidence desc (YoloResult expects sorted list)
        merged_boxes.sort(key=lambda b: b.conf, reverse=True)

        # Post-process boxes to handle text and paragraph_hybrid overlaps
        self.post_process_boxes(merged_boxes, names)

        return YoloResult(boxes=merged_boxes, names=names)

    def predict(self, image, imgsz=1024, **kwargs) -> list[YoloResult]:  # type: ignore[override]
        """Predict the layout for one or multiple images."""

        # Normalize to list
        if isinstance(image, np.ndarray) and len(image.shape) == 3:
            image = [image]

        # Sequential processing is sufficient; keep simple
        results: list[YoloResult] = []
        for img in image:
            results.append(self.predict_image(img, imgsz))

        return results

    def predict_page(self, page, pdf_bytes: Path, translate_config, save_debug_image):
        translate_config.raise_if_cancelled()
        # doc = pymupdf.open(io.BytesIO(pdf_bytes))
        # with self.lock:
        # pix = mupdf_doc[page.page_number].get_pixmap(dpi=72)
        image = get_no_rotation_img_multiprocess(
            pdf_bytes.as_posix(), page.page_number, dpi=DPI
        )
        # image = np.frombuffer(pix.samples, np.uint8).reshape(
        #     pix.height,
        #     pix.width,
        #     3,
        # )[:, :, ::-1]
        char_boxes = convert_page_to_char_boxes(page)
        lines = process_page_chars_to_lines(char_boxes)
        predict_result = self.predict_image(image, 800, lines)
        save_debug_image(image, predict_result, page.page_number + 1)
        return page, predict_result

    def handle_document(  # type: ignore[override]
        self,
        pages: list["babeldoc.format.pdf.document_il.il_version_1.Page"],
        mupdf_doc: pymupdf.Document,
        translate_config,
        save_debug_image,
    ):
        layout_temp_path = translate_config.get_working_file_path("layout.temp.pdf")
        mupdf_doc.save(layout_temp_path.as_posix())
        with ThreadPoolExecutor(max_workers=32) as executor:
            yield from executor.map(
                self.predict_page,
                pages,
                (layout_temp_path for _ in range(len(pages))),
                (translate_config for _ in range(len(pages))),
                (save_debug_image for _ in range(len(pages))),
            )

    @staticmethod
    def from_host(host: str) -> "RpcDocLayoutModel":
        """Create RpcDocLayoutModel from host address."""
        return RpcDocLayoutModel(host=host)


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    # Test the service
    try:
        # Use a default test image if example/1.png doesn't exist
        image_path = "example/1.png"
        if not Path(image_path).exists():
            print(f"Warning: {image_path} not found.")
            print("Please provide the path to a test image:")
            image_path = input("> ")

        logger.info(f"Processing image: {image_path}")
        result = predict_layout(image_path)
        print("Prediction results:")
        print(result)
    except Exception as e:
        print(f"Error: {e!s}")
