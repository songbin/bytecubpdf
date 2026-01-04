from babeldoc.pdfminer.pdftypes import PDFObjRef


def guarded_bbox(bbox):
    bbox_guarded = []
    for v in bbox:
        u = v
        if isinstance(v, PDFObjRef):
            u = v.resolve()
        if isinstance(u, int) or isinstance(u, float):
            bbox_guarded.append(u)
        else:
            bbox_guarded.append(u)
    return bbox_guarded
