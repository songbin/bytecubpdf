import numpy as np
import pymupdf

from babeldoc.const import get_process_pool


def get_no_rotation_img(page: pymupdf.Page, dpi: int = 72) -> pymupdf.Pixmap:
    # return page.get_pixmap(dpi=72)
    original_rotation = page.rotation
    page.set_rotation(0)
    pix = page.get_pixmap(dpi=dpi)
    page.set_rotation(original_rotation)
    return pix


def get_no_rotation_img_multiprocess_internal(
    pdf_bytes: str, pagenum: int, dpi: int = 72
) -> np.ndarray:
    # return page.get_pixmap(dpi=72)
    doc = pymupdf.open(pdf_bytes)
    try:
        page = doc[pagenum]
        original_rotation = page.rotation
        page.set_rotation(0)
        pix = page.get_pixmap(dpi=dpi)
        page.set_rotation(original_rotation)
        return np.frombuffer(pix.samples, np.uint8).reshape(
            pix.height,
            pix.width,
            3,
        )[:, :, ::-1]
    finally:
        doc.close()


def get_no_rotation_img_multiprocess(pdf_bytes: str, pagenum: int, dpi: int = 72):
    pool = get_process_pool()
    if pool is None:
        return get_no_rotation_img_multiprocess_internal(pdf_bytes, pagenum, dpi)
    return pool.apply(
        get_no_rotation_img_multiprocess_internal, (pdf_bytes, pagenum, dpi)
    )
