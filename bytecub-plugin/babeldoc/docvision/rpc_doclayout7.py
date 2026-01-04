import base64
import json
import logging
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import cv2
import httpx
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
from babeldoc.format.pdf.document_il import il_version_1
from babeldoc.format.pdf.document_il.utils.extract_char import (
    convert_page_to_char_boxes,
)
from babeldoc.format.pdf.document_il.utils.extract_char import (
    process_page_chars_to_lines,
)
from babeldoc.format.pdf.document_il.utils.mupdf_helper import get_no_rotation_img

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
    return encoded


@retry(
    stop=stop_after_attempt(3),  # 最多重试 3 次
    wait=wait_exponential(
        multiplier=1, min=1, max=10
    ),  # 指数退避策略，初始 1 秒，最大 10 秒
    retry=retry_if_exception_type((httpx.HTTPError, Exception)),  # 针对哪些异常重试
    before_sleep=lambda retry_state: logger.warning(
        f"Request failed, retrying in {getattr(retry_state.next_action, 'sleep', 'unknown')} seconds... "
        f"(Attempt {retry_state.attempt_number}/3)"
    ),
)
def predict_layout(
    image,
    host: str = "http://localhost:8000",
    _imgsz: int = 1024,
    lines: list[babeldoc.format.pdf.document_il.utils.extract_char.Line] | None = None,
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

    image_data = encode_image(image)

    def convert_line(line: babeldoc.format.pdf.document_il.utils.extract_char.Line):
        """Extract bounding box from a line object."""
        boxes = [c[0] for c in line.chars]
        min_x = min([b.x for b in boxes])
        max_x = max([b.x2 for b in boxes])
        min_y = min([b.y for b in boxes])
        max_y = max([b.y2 for b in boxes])
        # min_y, max_y = max_y, min_y

        min_x = min_x / 72 * DPI
        max_x = max_x / 72 * DPI
        min_y = min_y / 72 * DPI
        max_y = max_y / 72 * DPI

        image_height = image.shape[0]
        min_y, max_y = image_height - max_y, image_height - min_y

        return {"box": [min_x, min_y, max_x, max_y], "text": line.text}

    formatted_results = [convert_line(l) for l in lines]

    image_b64 = base64.b64encode(image_data).decode("utf-8")

    request_data = {
        "image": image_b64,
        "ocr_results": formatted_results,
        "image_size": list(image.shape[:2])[::-1],  # (height, width)
    }

    # Pack data using msgpack
    # packed_data = msgpack.packb(data, use_bin_type=True)
    # logger.debug(f"Packed data size: {len(packed_data)} bytes")

    # Send request
    # logger.debug(f"Sending request to {host}/inference")
    response = httpx.post(
        f"{host}/inference",
        json=request_data,
        headers={"Accept": "application/json", "Content-Type": "application/json"},
        timeout=1800,
        follow_redirects=True,
    )

    # logger.debug(f"Response status: {response.status_code}")
    # logger.debug(f"Response headers: {response.headers}")
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


class ResultContainer:
    def __init__(self):
        self.result = YoloResult(boxes_data=np.array([]), names=[])


class RpcDocLayoutModel(DocLayoutModel):
    """DocLayoutModel implementation that uses RPC service."""

    def __init__(self, host: str = "http://localhost:8000"):
        """Initialize RPC model with host address."""
        self.host = host
        self._stride = 32  # Default stride value
        self._names = ["text", "title", "list", "table", "figure"]
        self.lock = threading.Lock()

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

    def predict_image(
        self,
        image,
        host: str | None = None,
        result_container: ResultContainer | None = None,
        imgsz: int = 1024,
        page: il_version_1.Page | None = None,
    ) -> YoloResult:
        """Predict the layout of document pages using RPC service."""
        if result_container is None:
            result_container = ResultContainer()
        target_imgsz = (800, 800)
        orig_h, orig_w = image.shape[:2]
        target_imgsz = (orig_h, orig_w)
        if image.shape[0] != target_imgsz[0] or image.shape[1] != target_imgsz[1]:
            image = self.resize_and_pad_image(image, new_shape=target_imgsz)

        char_boxes = convert_page_to_char_boxes(page)
        lines = process_page_chars_to_lines(char_boxes)

        preds = predict_layout(image, host=self.host, lines=lines)
        orig_h, orig_w = orig_h / DPI * 72, orig_w / DPI * 72
        if len(preds) > 0:
            for pred in preds:
                boxes = [
                    YoloBox(
                        None,
                        self.scale_boxes(
                            target_imgsz, np.array(x["xyxy"]), (orig_h, orig_w)
                        ),
                        np.array(x["conf"]),
                        x["cls"],
                    )
                    for x in pred["boxes"]
                ]
                result_container.result = YoloResult(
                    boxes=boxes,
                    names={int(k): v for k, v in pred["names"].items()},
                )
        return result_container.result

    def predict_page(
        self, page, mupdf_doc: pymupdf.Document, translate_config, save_debug_image
    ):
        translate_config.raise_if_cancelled()
        with self.lock:
            # pix = mupdf_doc[page.page_number].get_pixmap(dpi=72)
            pix = get_no_rotation_img(mupdf_doc[page.page_number], dpi=DPI)
        image = np.frombuffer(pix.samples, np.uint8).reshape(
            pix.height,
            pix.width,
            3,
        )[:, :, ::-1]
        predict_result = self.predict_image(image, self.host, None, 800, page)
        save_debug_image(image, predict_result, page.page_number + 1)
        return page, predict_result

    def handle_document(
        self,
        pages: list[il_version_1.Page],
        mupdf_doc: pymupdf.Document,
        translate_config,
        save_debug_image,
    ):
        with ThreadPoolExecutor(max_workers=1) as executor:
            yield from executor.map(
                self.predict_page,
                pages,
                (mupdf_doc for _ in range(len(pages))),
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
