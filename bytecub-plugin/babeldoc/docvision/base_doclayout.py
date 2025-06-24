import abc
import logging
from collections.abc import Generator

import pymupdf

from babeldoc.format.pdf.document_il.il_version_1 import Page

logger = logging.getLogger(__name__)


class YoloResult:
    """Helper class to store detection results from ONNX model."""

    def __init__(self, names, boxes=None, boxes_data=None):
        if boxes is not None:
            self.boxes = boxes
        else:
            assert boxes_data is not None
            self.boxes = [YoloBox(data=d) for d in boxes_data]
        self.boxes.sort(key=lambda x: x.conf, reverse=True)
        self.names = names


class YoloBox:
    """Helper class to store detection results from ONNX model."""

    def __init__(self, data=None, xyxy=None, conf=None, cls=None):
        if data is not None:
            self.xyxy = data[:4]
            self.conf = data[-2]
            self.cls = data[-1]
            return
        assert xyxy is not None and conf is not None and cls is not None
        self.xyxy = xyxy
        self.conf = conf
        self.cls = cls


class DocLayoutModel(abc.ABC):
    @staticmethod
    def load_onnx():
        logger.info("Loading ONNX model...")
        from babeldoc.docvision.doclayout import OnnxModel

        model = OnnxModel.from_pretrained()
        return model

    @staticmethod
    def load_available():
        return DocLayoutModel.load_onnx()

    @property
    @abc.abstractmethod
    def stride(self) -> int:
        """Stride of the model input."""

    @abc.abstractmethod
    def predict(self, image: bytes, imgsz: int = 1024, **kwargs) -> list[int]:
        """
        Predict the layout of a document page.

        Args:
            image: The image of the document page.
            imgsz: Resize the image to this size. Must be a multiple of the stride.
            **kwargs: Additional arguments.
        """

    @abc.abstractmethod
    def handle_document(
        self,
        pages: list[Page],
        mupdf_doc: pymupdf.Document,
        translate_config,
        save_debug_image,
    ) -> Generator[tuple[Page, YoloResult], None, None]:
        """
        Handle a document.
        """
