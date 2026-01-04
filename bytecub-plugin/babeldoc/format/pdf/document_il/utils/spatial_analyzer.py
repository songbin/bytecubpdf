"""Spatial relationship analyzer for PDF elements.

This module provides functions to analyze spatial relationships between PDF elements,
particularly for detecting containment relationships between formulas and other elements
like curves and forms.

All comments and docstrings are in English per project guidelines.
"""

from __future__ import annotations

from babeldoc.format.pdf.document_il.il_version_1 import Box
from babeldoc.format.pdf.document_il.il_version_1 import Page
from babeldoc.format.pdf.document_il.il_version_1 import PdfCurve
from babeldoc.format.pdf.document_il.il_version_1 import PdfForm
from babeldoc.format.pdf.document_il.il_version_1 import PdfFormula
from babeldoc.format.pdf.document_il.utils.layout_helper import calculate_iou_for_boxes


def is_element_contained_in_formula(
    element_box: Box,
    formula_box: Box,
    containment_threshold: float = 0.95,
    tolerance: float = 2.0,
) -> bool:
    """Check if an element is completely contained within a formula with tolerance.

    Args:
        element_box: The bounding box of the element to check
        formula_box: The bounding box of the formula
        containment_threshold: Minimum IoU ratio to consider as contained (default: 0.95)
        tolerance: Tolerance in units to expand formula box for containment check (default: 2.0)

    Returns:
        True if the element is considered contained within the formula
    """
    if element_box is None or formula_box is None:
        return False

    # Expand formula box by tolerance for more lenient containment check
    expanded_formula_box = Box(
        x=formula_box.x - tolerance,
        y=formula_box.y - tolerance,
        x2=formula_box.x2 + tolerance,
        y2=formula_box.y2 + tolerance,
    )

    # Calculate IoU of element box with respect to expanded formula box
    iou = calculate_iou_for_boxes(element_box, expanded_formula_box)
    return iou >= containment_threshold


def find_contained_curves(
    formula: PdfFormula, page: Page, paragraph_xobj_id: int | None = None
) -> list[PdfCurve]:
    """Find all curves that are contained within the given formula.

    Args:
        formula: The formula to check for contained curves
        page: The page containing the curves
        paragraph_xobj_id: The xobj_id of the paragraph containing the formula.
                          If provided, only curves with matching xobj_id will be returned.

    Returns:
        List of curves that are contained within the formula
    """
    if not formula.box or not page.pdf_curve:
        return []

    contained_curves = []
    for curve in page.pdf_curve:
        if curve.box and is_element_contained_in_formula(curve.box, formula.box):
            # If paragraph_xobj_id is specified, only include curves with matching xobj_id
            if paragraph_xobj_id is not None and curve.xobj_id != paragraph_xobj_id:
                continue
            contained_curves.append(curve)

    return contained_curves


def find_contained_forms(
    formula: PdfFormula, page: Page, paragraph_xobj_id: int | None = None
) -> list[PdfForm]:
    """Find all forms that are contained within the given formula.

    Args:
        formula: The formula to check for contained forms
        page: The page containing the forms
        paragraph_xobj_id: The xobj_id of the paragraph containing the formula.
                          If provided, only forms with matching xobj_id will be returned.

    Returns:
        List of forms that are contained within the formula
    """
    if not formula.box or not page.pdf_form:
        return []

    contained_forms = []
    for form in page.pdf_form:
        if form.box and is_element_contained_in_formula(form.box, formula.box):
            # If paragraph_xobj_id is specified, only include forms with matching xobj_id
            if paragraph_xobj_id is not None and form.xobj_id != paragraph_xobj_id:
                continue
            contained_forms.append(form)

    return contained_forms


def find_all_contained_elements(
    formula: PdfFormula, page: Page, paragraph_xobj_id: int | None = None
) -> tuple[list[PdfCurve], list[PdfForm]]:
    """Find all curves and forms that are contained within the given formula.

    Args:
        formula: The formula to check for contained elements
        page: The page containing the elements
        paragraph_xobj_id: The xobj_id of the paragraph containing the formula.
                          If provided, only elements with matching xobj_id will be returned.

    Returns:
        Tuple of (contained_curves, contained_forms)
    """
    contained_curves = find_contained_curves(formula, page, paragraph_xobj_id)
    contained_forms = find_contained_forms(formula, page, paragraph_xobj_id)
    return contained_curves, contained_forms


def calculate_translation_and_scale(
    old_box: Box, new_box: Box
) -> tuple[float, float, float]:
    """Calculate translation and scale factors between two boxes.

    Args:
        old_box: The original bounding box
        new_box: The new bounding box

    Returns:
        Tuple of (translation_x, translation_y, scale_factor)
    """
    if old_box is None or new_box is None:
        return 0.0, 0.0, 1.0

    # Calculate translation (difference in top-left corners)
    translation_x = new_box.x - old_box.x
    translation_y = new_box.y - old_box.y

    # Calculate scale factor (using width ratio, fallback to height if needed)
    old_width = old_box.x2 - old_box.x
    new_width = new_box.x2 - new_box.x

    if old_width > 0:
        scale_factor = new_width / old_width
    else:
        old_height = old_box.y2 - old_box.y
        new_height = new_box.y2 - new_box.y
        scale_factor = new_height / old_height if old_height > 0 else 1.0

    return translation_x, translation_y, scale_factor
