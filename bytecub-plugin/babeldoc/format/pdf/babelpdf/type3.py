import io
import re

import pymupdf


def merge_bbox(bbox_list, factor=1):
    if bbox_list:
        base = bbox_list[0]
        for bbox in bbox_list[1:]:
            base.include_rect(bbox)
        x0, y0, x1, y1 = [v / factor for v in tuple(base)]
        return x0, -y1, x1, -y0


def get_type3_bbox(doc, obj):
    bbox_list = [(0, 0, 0, 0)] * 256
    first = int(doc.xref_get_key(obj, "FirstChar")[1])
    last = int(doc.xref_get_key(obj, "LastChar")[1])
    factor_text = doc.xref_get_key(obj, "FontMatrix")[1]
    factor = 1
    if factor_m := re.search(r"(\d+)?\.\d+", factor_text):
        factor = float(factor_m.group(0))
    page = doc.new_page(width=10, height=10)
    doc.xref_set_key(page.xref, "Resources", "<<>>")
    doc.xref_set_key(page.xref, "Resources/Font", f"<</T0 {obj} 0 R>>")
    text = doc.get_new_xref()
    doc.update_object(text, "<<>>")
    for x in range(first, last + 1):
        doc.update_stream(text, b"1 0 0 1 0 10 cm BT /T0 1 Tf <%02X> Tj ET" % x)
        doc.xref_set_key(page.xref, "Contents", f"{text} 0 R")
        char_data = page.get_svg_image(text_as_path=True)
        char_doc = pymupdf.Document(stream=io.BytesIO(char_data.encode("U8")))
        char_bbox = []
        for element in char_doc:
            for item in element.get_drawings():
                char_bbox.append(item["rect"])
        if char_bbox_merged := merge_bbox(char_bbox, factor):
            bbox_list[x] = char_bbox_merged
    doc.delete_page(-1)
    return bbox_list