"""Matrix helper utilities for CTM decomposition and composition.

This module provides functions to:
- Decompose a PDF CTM into translation, rotation, scale, and shear
- Compose a CTM back from translation, rotation, scale, and shear

All comments and docstrings are in English per project guidelines.
"""

from __future__ import annotations

import math

from babeldoc.format.pdf.document_il.il_version_1 import PdfAffineTransform
from babeldoc.format.pdf.document_il.il_version_1 import PdfMatrix

# Local type aliases to avoid importing from pdfminer
Point = tuple[float, float]
Matrix = tuple[float, float, float, float, float, float]


def decompose_ctm(m: Matrix | PdfMatrix) -> PdfAffineTransform:
    """Decompose a PDF CTM into a PdfAffineTransform.

    The PDF current transformation matrix (CTM) is represented as
    ``(a, b, c, d, e, f)`` corresponding to the affine matrix:
    ``[[a, c, e], [b, d, f], [0, 0, 1]]``.

    This function decomposes it into:
    - translation: (tx, ty)
    - rotation: angle in radians (counter-clockwise)
    - scale: (sx, sy)
    - shear: x-shear factor (dimensionless, equals tan(shear_angle))

    The decomposition is based on a QR-like approach commonly used for 2D
    affine matrices. If the linear part is degenerate, sensible fallbacks are
    applied.

    Args:
        m: CTM as ``(a, b, c, d, e, f)``.

    Returns:
        A ``PdfAffineTransform`` instance with fields populated.
    """
    if isinstance(m, PdfMatrix):
        a = m.a
        b = m.b
        c = m.c
        d = m.d
        e = m.e
        f = m.f
        assert a is not None
        assert b is not None
        assert c is not None
        assert d is not None
        assert e is not None
        assert f is not None
    else:
        (a, b, c, d, e, f) = m

    tx, ty = e, f

    # Linear part
    m00, m01 = a, c
    m10, m11 = b, d

    # Scale X is the length of the first column
    sx = math.hypot(m00, m10)

    eps = 1e-12
    if sx < eps:
        # Degenerate first column. Choose rotation = 0, shear = 0, sx = 0.
        rotation = 0.0
        shear = 0.0
        # Then sy is the length of the second column
        sy = math.hypot(m01, m11)
        # Handle reflection
        det = m00 * m11 - m01 * m10
        if det < 0:
            sy = -sy if sy != 0 else -0.0
        return PdfAffineTransform(
            translation_x=tx,
            translation_y=ty,
            rotation=rotation,
            scale_x=sx,
            scale_y=sy,
            shear=shear,
        )

    # Normalize first column to get rotation axis
    r0x = m00 / sx
    r0y = m10 / sx

    # Shear is the projection of the second column onto the first column
    shear = r0x * m01 + r0y * m11

    # Remove the shear component from the second column
    m01_ortho = m01 - shear * r0x
    m11_ortho = m11 - shear * r0y

    # Scale Y is the length of the orthogonalized second column
    sy = math.hypot(m01_ortho, m11_ortho)

    # Determine reflection by determinant sign
    det = m00 * m11 - m01 * m10
    if det < 0:
        sy = -sy if sy != 0 else -0.0
        shear = -shear
        m01_ortho = -m01_ortho
        m11_ortho = -m11_ortho

    # Rotation is the angle of the first column
    rotation = math.atan2(m10, m00)

    return PdfAffineTransform(
        translation_x=tx,
        translation_y=ty,
        rotation=rotation,
        scale_x=sx,
        scale_y=sy,
        shear=shear,
    )


def compose_ctm(transform: PdfAffineTransform) -> Matrix:
    """Compose a PDF CTM from a PdfAffineTransform.

    This composes the 2x2 linear part using the following model:
    - First column: ``sx * r0`` where ``r0 = (cos(theta), sin(theta))``
    - Second column: ``shear * r0 + sy * r1`` where ``r1`` is the unit vector
      orthogonal to ``r0``: ``r1 = (-sin(theta), cos(theta))``
    - Translation is appended as (e, f) = (tx, ty)

    Args:
        transform: A ``PdfAffineTransform`` with translation, rotation,
            scale, and shear populated.

    Returns:
        The CTM matrix ``(a, b, c, d, e, f)``.
    """
    # Extract and validate required values from the dataclass
    tx = float(transform.translation_x if transform.translation_x is not None else 0.0)
    ty = float(transform.translation_y if transform.translation_y is not None else 0.0)
    theta = float(transform.rotation if transform.rotation is not None else 0.0)
    sx = float(transform.scale_x if transform.scale_x is not None else 1.0)
    sy = float(transform.scale_y if transform.scale_y is not None else 1.0)
    shear = float(transform.shear if transform.shear is not None else 0.0)

    cos_t = math.cos(theta)
    sin_t = math.sin(theta)

    # Unit basis aligned with rotation
    r0x, r0y = cos_t, sin_t
    r1x, r1y = -sin_t, cos_t

    # Columns of the linear matrix
    col0x = sx * r0x
    col0y = sx * r0y
    col1x = shear * r0x + sy * r1x
    col1y = shear * r0y + sy * r1y

    a = col0x
    b = col0y
    c = col1x
    d = col1y
    e = tx
    f = ty

    return a, b, c, d, e, f


def scale_and_set_translation(
    m: Matrix | PdfMatrix, scale_factor: float, tx: float, ty: float
) -> Matrix | PdfMatrix:
    """Uniformly scale CTM by percentage and set translation to a position.

    This function performs an isotropic scale in X and Y by ``percent`` and
    then sets the translation components to ``(tx, ty)``. It preserves the
    input type: if a ``PdfMatrix`` is provided, a ``PdfMatrix`` is returned;
    if a tuple is provided, a tuple is returned.

    Args:
        m: Input CTM as ``(a, b, c, d, e, f)`` or ``PdfMatrix``.
        scale_factor: Scale factor. ``1.0`` keeps size unchanged, ``0.5``
            halves it, ``2.0`` doubles it.
        tx: New translation X.
        ty: New translation Y.

    Returns:
        A CTM of the same type as the input, scaled and with translation set.
    """

    if isinstance(m, PdfMatrix):
        a = m.a
        b = m.b
        c = m.c
        d = m.d
        # e, f will be overridden by tx, ty
        assert a is not None
        assert b is not None
        assert c is not None
        assert d is not None

        return PdfMatrix(
            a=a * scale_factor,
            b=b * scale_factor,
            c=c * scale_factor,
            d=d * scale_factor,
            e=float(tx),
            f=float(ty),
        )

    a, b, c, d, _, _ = m
    return (
        a * scale_factor,
        b * scale_factor,
        c * scale_factor,
        d * scale_factor,
        float(tx),
        float(ty),
    )


def create_translation_and_scale_matrix(
    translation_x: float, translation_y: float, scale_factor: float
) -> Matrix:
    """Create a transformation matrix for translation and uniform scaling.

    This creates a CTM that first scales uniformly by scale_factor, then translates
    by (translation_x, translation_y).

    Args:
        translation_x: Translation in X direction
        translation_y: Translation in Y direction
        scale_factor: Uniform scale factor for both X and Y

    Returns:
        The CTM matrix (a, b, c, d, e, f)
    """
    # Matrix for uniform scaling and translation:
    # [scale  0      tx]
    # [0      scale  ty]
    # [0      0      1 ]
    # Which maps to CTM (scale, 0, 0, scale, tx, ty)
    return (scale_factor, 0.0, 0.0, scale_factor, translation_x, translation_y)


def multiply_matrices(m1: Matrix | PdfMatrix, m2: Matrix | PdfMatrix) -> Matrix:
    """Multiply two transformation matrices (m1 * m2).

    Args:
        m1: Left matrix in multiplication
        m2: Right matrix in multiplication

    Returns:
        Result matrix as tuple (a, b, c, d, e, f)
    """
    # Extract components from first matrix
    if isinstance(m1, PdfMatrix):
        a1, b1, c1, d1, e1, f1 = m1.a, m1.b, m1.c, m1.d, m1.e, m1.f
        assert all(x is not None for x in [a1, b1, c1, d1, e1, f1])
    else:
        a1, b1, c1, d1, e1, f1 = m1

    # Extract components from second matrix
    if isinstance(m2, PdfMatrix):
        a2, b2, c2, d2, e2, f2 = m2.a, m2.b, m2.c, m2.d, m2.e, m2.f
        assert all(x is not None for x in [a2, b2, c2, d2, e2, f2])
    else:
        a2, b2, c2, d2, e2, f2 = m2

    # Matrix multiplication for 2D affine transformations:
    # [a1 c1 e1]   [a2 c2 e2]   [a1*a2+c1*b2  a1*c2+c1*d2  a1*e2+c1*f2+e1]
    # [b1 d1 f1] * [b2 d2 f2] = [b1*a2+d1*b2  b1*c2+d1*d2  b1*e2+d1*f2+f1]
    # [0  0  1 ]   [0  0  1 ]   [0            0            1              ]

    a = a1 * a2 + c1 * b2
    b = b1 * a2 + d1 * b2
    c = a1 * c2 + c1 * d2
    d = b1 * c2 + d1 * d2
    e = a1 * e2 + c1 * f2 + e1
    f = b1 * e2 + d1 * f2 + f1

    return (a, b, c, d, e, f)


def apply_transform_to_ctm(
    existing_ctm: list[object],
    translation_x: float,
    translation_y: float,
    scale_factor: float,
) -> list[object]:
    """Apply translation and scale transformation to an existing CTM.

    Args:
        existing_ctm: Existing CTM as list of 6 floats
        translation_x: Translation in X direction
        translation_y: Translation in Y direction
        scale_factor: Uniform scale factor

    Returns:
        New CTM as list of objects
    """
    if len(existing_ctm) != 6:
        # If CTM is invalid, create a new identity matrix with the transform
        transform_matrix = create_translation_and_scale_matrix(
            translation_x, translation_y, scale_factor
        )
        return list(transform_matrix)

    # Convert existing CTM to Matrix format
    try:
        existing_matrix = tuple(float(x) for x in existing_ctm)
    except (ValueError, TypeError):
        # If conversion fails, use identity matrix
        existing_matrix = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)

    # Create the transform matrix
    transform_matrix = create_translation_and_scale_matrix(
        translation_x, translation_y, scale_factor
    )

    # Left-multiply: new_ctm = transform_matrix * existing_matrix
    result_matrix = multiply_matrices(transform_matrix, existing_matrix)

    return list(result_matrix)


def matrix_to_bytes(m: Matrix | PdfMatrix) -> bytes:
    if isinstance(m, PdfMatrix):
        return (
            f" {m.a:.6f} {m.b:.6f} {m.c:.6f} {m.d:.6f} {m.e:.6f} {m.f:.6f} cm ".encode()
        )
    else:
        return f" {m[0]:.6f} {m[1]:.6f} {m[2]:.6f} {m[3]:.6f} {m[4]:.6f} {m[5]:.6f} cm ".encode()
