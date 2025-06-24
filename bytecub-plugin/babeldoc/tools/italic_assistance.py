import argparse
import json
import re
from pathlib import Path

import orjson
from babeldoc.const import CACHE_FOLDER
from babeldoc.format.pdf.document_il.utils.formular_helper import is_formulas_font
from babeldoc.format.pdf.translation_config import TranslationConfig
from rich.console import Console
from rich.table import Table

WORKING_FOLDER = Path(CACHE_FOLDER) / "working"


def find_latest_il_json() -> Path | None:
    """
    Find the latest il_translated.json file in ~/.cache/babeldoc/ subdirectories.

    Returns:
        Path to the most recently modified il_translated.json file, or None if not found.
    """
    base_dir = Path(WORKING_FOLDER)
    json_files = list(base_dir.glob("*/il_translated.json"))

    if not json_files:
        return None

    # Sort by modification time (newest first)
    json_files.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return json_files[0]


def extract_fonts_from_paragraph(
    paragraph: dict, page_font_map: dict[str, tuple[str, str]]
) -> set[tuple[str, str]]:
    """
    Extract all font_ids and names used in a paragraph.

    Args:
        paragraph: The paragraph dictionary
        page_font_map: Dictionary mapping font_id to (font_id, name) tuples

    Returns:
        Set of (font_id, name) tuples
    """
    fonts = set()

    # Check if paragraph has a pdfStyle with font_id
    if (
        "pdf_style" in paragraph
        and paragraph["pdf_style"]
        and "font_id" in paragraph["pdf_style"]
    ):
        font_id = paragraph["pdf_style"]["font_id"]
        if font_id in page_font_map:
            fonts.add(page_font_map[font_id])

    # Process paragraph compositions if present
    if "pdf_paragraph_composition" in paragraph:
        for comp in paragraph["pdf_paragraph_composition"]:
            # Check different composition types that might contain font information

            # Direct pdfCharacter in composition
            if "pdf_character" in comp and comp["pdf_character"]:
                char = comp["pdf_character"]
                if "pdf_style" in char and "font_id" in char["pdf_style"]:
                    font_id = char["pdf_style"]["font_id"]
                    if font_id in page_font_map:
                        fonts.add(page_font_map[font_id])

            # PdfLine in composition
            elif "pdf_line" in comp and comp["pdf_line"]:
                line = comp["pdf_line"]
                if "pdf_character" in line:
                    for char in line["pdf_character"]:
                        if "pdf_style" in char and "font_id" in char["pdf_style"]:
                            font_id = char["pdf_style"]["font_id"]
                            if font_id in page_font_map:
                                fonts.add(page_font_map[font_id])

            # PdfFormula in composition
            elif "pdf_formula" in comp and comp["pdf_formula"]:
                formula = comp["pdf_formula"]
                if "pdf_character" in formula:
                    for char in formula["pdf_character"]:
                        if "pdf_style" in char and "font_id" in char["pdf_style"]:
                            font_id = char["pdf_style"]["font_id"]
                            if font_id in page_font_map:
                                fonts.add(page_font_map[font_id])

            # PdfSameStyleCharacters in composition
            elif (
                "pdf_same_style_characters" in comp
                and comp["pdf_same_style_characters"]
            ):
                same_style = comp["pdf_same_style_characters"]
                if "pdf_style" in same_style and "font_id" in same_style["pdf_style"]:
                    font_id = same_style["pdf_style"]["font_id"]
                    if font_id in page_font_map:
                        fonts.add(page_font_map[font_id])

            # PdfSameStyleUnicodeCharacters in composition
            elif (
                "pdf_same_style_unicode_characters" in comp
                and comp["pdf_same_style_unicode_characters"]
            ):
                same_style_unicode = comp["pdf_same_style_unicode_characters"]
                if (
                    "pdf_style" in same_style_unicode
                    and same_style_unicode["pdf_style"] is not None
                    and "font_id" in same_style_unicode["pdf_style"]
                ):
                    font_id = same_style_unicode["pdf_style"]["font_id"]
                    if font_id in page_font_map:
                        fonts.add(page_font_map[font_id])

    return fonts


def find_fonts_by_debug_id(json_path: Path, debug_id_regex: str) -> dict[str, str]:
    """
    Find all fonts used in paragraphs with matching debug_id.

    Args:
        json_path: Path to the il_translated.json file
        debug_id_regex: Regular expression to match debug_id values

    Returns:
        Dictionary mapping font_ids to font names
    """
    # Load and parse JSON
    with json_path.open("rb") as f:
        doc_data = orjson.loads(f.read())

    # Compile regex pattern (case insensitive)
    pattern = re.compile(debug_id_regex.strip(" \"'"), re.IGNORECASE)

    # Set to collect all found font information
    found_fonts = set()

    # Process each page
    for page in doc_data.get("page", []):
        # Create a mapping of font_id to (font_id, name) tuples for this page
        page_font_map = {}
        for font in page.get("pdf_font", []):
            if "font_id" in font and "name" in font:
                page_font_map[font["font_id"]] = (font["font_id"], font["name"])

        # Check each paragraph
        for paragraph in page.get("pdf_paragraph", []):
            # Check if paragraph has debug_id and if it matches the pattern
            debug_id = paragraph.get("debug_id")
            if debug_id and pattern.search(debug_id):
                # Get all fonts used in this paragraph
                paragraph_fonts = extract_fonts_from_paragraph(paragraph, page_font_map)
                found_fonts.update(paragraph_fonts)

    # Convert set of tuples to dictionary
    return dict(found_fonts)


def main():
    parser = argparse.ArgumentParser(
        description="Extract fonts from paragraphs with matching debug_id"
    )
    parser.add_argument(
        "debug_id_regex", nargs="+", help="Regular expression to match debug_id values"
    )
    parser.add_argument(
        "--json-path",
        help="Path to il_translated.json (if not provided, will use the latest file)",
    )
    parser.add_argument(
        "--working-folder",
        help="Path to the working folder containing il_translated.json files",
    )

    args = parser.parse_args()

    if args.working_folder:
        global WORKING_FOLDER
        WORKING_FOLDER = Path(args.working_folder)
        if not WORKING_FOLDER.exists():
            print(f"Error: Working folder does not exist: {WORKING_FOLDER}")
            return 1

    # Determine JSON file path
    json_path = None
    if args.json_path:
        json_path = Path(args.json_path)
        if not json_path.exists():
            print(f"Error: File not found: {json_path}")
            return 1
    else:
        json_path = find_latest_il_json()
        if not json_path:
            print("Error: Could not find any il_translated.json file")
            return 1

    print(f"Using JSON file: {json_path}")

    # Find fonts matching the debug_id pattern
    fonts = find_fonts_by_debug_id(json_path, "|".join(args.debug_id_regex))

    # Output the results
    if fonts:
        print(
            f"Found {len(fonts)} fonts in paragraphs matching debug_id pattern: {args.debug_id_regex}"
        )
        print(json.dumps(fonts, indent=2, ensure_ascii=False))
    else:
        print(
            f"No fonts found for paragraphs matching debug_id pattern: {args.debug_id_regex}"
        )

    fonts = []

    # Read intermediate representation
    with json_path.open(encoding="utf-8") as f:
        pdf_data = json.load(f)

    for page_index, page in enumerate(pdf_data["page"]):
        for paragraph_index, paragraph_content in enumerate(page["pdf_paragraph"]):
            font_debug_id = paragraph_content["debug_id"]
            if font_debug_id:
                # Create page font mapping
                page_font_map = {}
                for font in page["pdf_font"]:
                    if "font_id" in font and "name" in font:
                        page_font_map[font["font_id"]] = (font["font_id"], font["name"])

                # Extract fonts from paragraph
                name_list = []
                paragraph_fonts = extract_fonts_from_paragraph(
                    paragraph_content, page_font_map
                )
                for _font_id, font_name in paragraph_fonts:
                    name_list.append(font_name)

                font_list = []
                for each in fonts:
                    font_list.append(each[1])

                for each_name in name_list:
                    if each_name not in font_list:
                        fonts.append(
                            (page_index, each_name, paragraph_index, font_debug_id)
                        )

    # Initialize checker
    translation_config = TranslationConfig(
        *[None for _ in range(3)], lang_out="zh_cn", doc_layout_model=1
    )

    # Create table
    table = Table(title="Font Recognition Results")
    table.add_column("Page #", justify="center", style="cyan")
    table.add_column("Paragraph #", justify="center", style="cyan")
    table.add_column("DEBUG_ID", justify="center", style="cyan")
    table.add_column("Font Name", style="magenta")
    table.add_column("Recognition Result", justify="center")

    # Output results
    for each_font in fonts:
        page_index, font_name, paragraph_index, font_debug_id = each_font

        if is_formulas_font(font_name, None):
            table.add_row(
                str(page_index),
                str(paragraph_index),
                str(font_debug_id),
                font_name,
                "[bold red]Formula Font[/bold red]",
            )
        else:
            table.add_row(
                str(page_index),
                str(paragraph_index),
                str(font_debug_id),
                font_name,
                "[bold blue]Non-Formula Font[/bold blue]",
            )

    # Print table
    console = Console()

    console.print(table)

    return 0


if __name__ == "__main__":
    exit(main())
