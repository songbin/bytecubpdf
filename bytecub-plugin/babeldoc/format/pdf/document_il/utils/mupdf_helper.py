import pymupdf


def get_no_rotation_img(page: pymupdf.Page, dpi: int = 72) -> pymupdf.Pixmap:
    # return page.get_pixmap(dpi=72)
    original_rotation = page.rotation
    page.set_rotation(0)
    pix = page.get_pixmap(dpi=dpi)
    page.set_rotation(original_rotation)
    return pix
