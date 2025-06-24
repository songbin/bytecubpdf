from __future__ import annotations

import copy
import json
import logging
import re
from pathlib import Path

import tiktoken
from tqdm import tqdm

from babeldoc.format.pdf.document_il import Document
from babeldoc.format.pdf.document_il import Page
from babeldoc.format.pdf.document_il import PdfFont
from babeldoc.format.pdf.document_il import PdfFormula
from babeldoc.format.pdf.document_il import PdfParagraph
from babeldoc.format.pdf.document_il import PdfParagraphComposition
from babeldoc.format.pdf.document_il import PdfSameStyleCharacters
from babeldoc.format.pdf.document_il import PdfSameStyleUnicodeCharacters
from babeldoc.format.pdf.document_il import PdfStyle
from babeldoc.format.pdf.document_il.utils.fontmap import FontMapper
from babeldoc.format.pdf.document_il.utils.layout_helper import get_char_unicode_string
from babeldoc.format.pdf.document_il.utils.layout_helper import get_paragraph_unicode
from babeldoc.format.pdf.document_il.utils.layout_helper import is_same_style
from babeldoc.format.pdf.document_il.utils.layout_helper import (
    is_same_style_except_font,
)
from babeldoc.format.pdf.document_il.utils.layout_helper import (
    is_same_style_except_size,
)
from babeldoc.format.pdf.translation_config import TranslationConfig
from babeldoc.translator.translator import BaseTranslator
from babeldoc.utils.priority_thread_pool_executor import PriorityThreadPoolExecutor

logger = logging.getLogger(__name__)


class RichTextPlaceholder:
    def __init__(
        self,
        placeholder_id: int,
        composition: PdfSameStyleCharacters,
        left_placeholder: str,
        right_placeholder: str,
        left_regex_pattern: str = None,
        right_regex_pattern: str = None,
    ):
        self.id = placeholder_id
        self.composition = composition
        self.left_placeholder = left_placeholder
        self.right_placeholder = right_placeholder
        self.left_regex_pattern = left_regex_pattern
        self.right_regex_pattern = right_regex_pattern


class FormulaPlaceholder:
    def __init__(
        self,
        placeholder_id: int,
        formula: PdfFormula,
        placeholder: str,
        regex_pattern: str,
    ):
        self.id = placeholder_id
        self.formula = formula
        self.placeholder = placeholder
        self.regex_pattern = regex_pattern


class PbarContext:
    def __init__(self, pbar):
        self.pbar = pbar

    def __enter__(self):
        return self.pbar

    def __exit__(self, exc_type, exc_value, traceback):
        self.pbar.advance()


class DocumentTranslateTracker:
    def __init__(self):
        self.page = []

    def new_page(self):
        page = PageTranslateTracker()
        self.page.append(page)
        return page

    def to_json(self):
        pages = []
        for page in self.page:
            paragraphs = []
            for para in page.paragraph:
                i_str = getattr(para, "input", None)
                o_str = getattr(para, "output", None)
                pdf_unicode = getattr(para, "pdf_unicode", None)
                llm_translate_trackers = getattr(para, "llm_translate_trackers", None)
                llm_translate_trackers_json = []
                for tracker in llm_translate_trackers:
                    llm_translate_trackers_json.append(tracker.to_dict())
                if pdf_unicode is None or i_str is None:
                    continue
                paragraphs.append(
                    {
                        "input": i_str,
                        "output": o_str,
                        "pdf_unicode": pdf_unicode,
                        "llm_translate_trackers": llm_translate_trackers_json,
                    },
                )
            pages.append({"paragraph": paragraphs})
        return json.dumps({"page": pages}, ensure_ascii=False, indent=2)


class PageTranslateTracker:
    def __init__(self):
        self.paragraph = []

    def new_paragraph(self):
        paragraph = ParagraphTranslateTracker()
        self.paragraph.append(paragraph)
        return paragraph


class ParagraphTranslateTracker:
    def __init__(self):
        self.llm_translate_trackers = []

    def set_pdf_unicode(self, unicode: str):
        self.pdf_unicode = unicode

    def set_input(self, input_text: str):
        self.input = input_text

    def set_output(self, output: str):
        self.output = output

    def new_llm_translate_tracker(self) -> LLMTranslateTracker:
        tracker = LLMTranslateTracker()
        self.llm_translate_trackers.append(tracker)
        return tracker

    def last_llm_translate_tracker(self) -> LLMTranslateTracker | None:
        if self.llm_translate_trackers:
            return self.llm_translate_trackers[-1]
        return None


class LLMTranslateTracker:
    def __init__(self):
        self.input = ""
        self.output = ""
        self.has_error = False
        self.error_message = ""
        self.placeholder_full_match = False
        self.fallback_to_translate = False

    def set_input(self, input_text: str):
        self.input = input_text

    def set_output(self, output_text: str):
        self.output = output_text

    def set_error_message(self, error_message: str):
        self.has_error = True
        self.error_message = error_message

    def set_placeholder_full_match(self):
        self.placeholder_full_match = True

    def set_fallback_to_translate(self):
        self.fallback_to_translate = True

    def to_dict(self):
        return {
            "input": self.input,
            "output": self.output,
            "has_error": self.has_error,
            "error_message": self.error_message,
            "placeholder_full_match": self.placeholder_full_match,
            "fallback_to_translate": self.fallback_to_translate,
        }


class ILTranslator:
    stage_name = "Translate Paragraphs"

    def __init__(
        self,
        translate_engine: BaseTranslator,
        translation_config: TranslationConfig,
        tokenizer=None,
    ):
        self.translate_engine = translate_engine
        self.translation_config = translation_config
        self.font_mapper = FontMapper(translation_config)
        self.shared_context_cross_split_part = (
            translation_config.shared_context_cross_split_part
        )
        if tokenizer is None:
            self.tokenizer = tiktoken.encoding_for_model("gpt-4o")
        else:
            self.tokenizer = tokenizer

        # Cache glossaries at initialization
        self._cached_glossaries = self.shared_context_cross_split_part.get_glossaries()

        self.support_llm_translate = False
        try:
            if translate_engine and hasattr(translate_engine, "do_llm_translate"):
                translate_engine.do_llm_translate(None)
                self.support_llm_translate = True
        except NotImplementedError:
            self.support_llm_translate = False

        self.use_as_fallback = False

    def calc_token_count(self, text: str) -> int:
        try:
            return len(self.tokenizer.encode(text, disallowed_special=()))
        except Exception:
            return 0

    def translate(self, docs: Document):
        tracker = DocumentTranslateTracker()

        if not self.translation_config.shared_context_cross_split_part.first_paragraph:
            # Try to find the first title paragraph
            title_paragraph = self.find_title_paragraph(docs)
            self.translation_config.shared_context_cross_split_part.first_paragraph = (
                copy.deepcopy(title_paragraph)
            )
            self.translation_config.shared_context_cross_split_part.recent_title_paragraph = copy.deepcopy(
                title_paragraph
            )
            if title_paragraph:
                logger.info(f"Found first title paragraph: {title_paragraph.unicode}")

        # count total paragraph
        total = sum(len(page.pdf_paragraph) for page in docs.page)
        with self.translation_config.progress_monitor.stage_start(
            self.stage_name,
            total,
        ) as pbar:
            with PriorityThreadPoolExecutor(
                max_workers=self.translation_config.pool_max_workers,
            ) as executor:
                for page in docs.page:
                    self.process_page(page, executor, pbar, tracker.new_page())

        path = self.translation_config.get_working_file_path("translate_tracking.json")

        if self.translation_config.debug:
            logger.debug(f"save translate tracking to {path}")
            with Path(path).open("w", encoding="utf-8") as f:
                f.write(tracker.to_json())

    def find_title_paragraph(self, docs: Document) -> PdfParagraph | None:
        """Find the first paragraph with layout_label 'title' in the document.

        Args:
            docs: The document to search in

        Returns:
            The first title paragraph found, or None if no title paragraph exists
        """
        for page in docs.page:
            for paragraph in page.pdf_paragraph:
                if paragraph.layout_label == "title":
                    logger.info(f"Found title paragraph: {paragraph.unicode}")
                    return paragraph
        return None

    def process_page(
        self,
        page: Page,
        executor: PriorityThreadPoolExecutor,
        pbar: tqdm | None = None,
        tracker: PageTranslateTracker = None,
    ):
        self.translation_config.raise_if_cancelled()
        for paragraph in page.pdf_paragraph:
            page_font_map = {}
            for font in page.pdf_font:
                page_font_map[font.font_id] = font
            page_xobj_font_map = {}
            for xobj in page.pdf_xobject:
                page_xobj_font_map[xobj.xobj_id] = page_font_map.copy()
                for font in xobj.pdf_font:
                    page_xobj_font_map[xobj.xobj_id][font.font_id] = font
            # self.translate_paragraph(paragraph, pbar,tracker.new_paragraph(), page_font_map, page_xobj_font_map)
            paragraph_token_count = self.calc_token_count(paragraph.unicode)
            if paragraph.layout_label == "title":
                self.shared_context_cross_split_part.recent_title_paragraph = (
                    copy.deepcopy(paragraph)
                )
            executor.submit(
                self.translate_paragraph,
                paragraph,
                pbar,
                tracker.new_paragraph(),
                page_font_map,
                page_xobj_font_map,
                priority=1048576 - paragraph_token_count,
                paragraph_token_count=paragraph_token_count,
                title_paragraph=self.translation_config.shared_context_cross_split_part.first_paragraph,
                local_title_paragraph=self.translation_config.shared_context_cross_split_part.recent_title_paragraph,
            )

    class TranslateInput:
        def __init__(
            self,
            unicode: str,
            placeholders: list[RichTextPlaceholder | FormulaPlaceholder],
            base_style: PdfStyle = None,
        ):
            self.unicode = unicode
            self.placeholders = placeholders
            self.base_style = base_style

        def get_placeholders_hint(self) -> dict[str, str] | None:
            hint = {}
            for placeholder in self.placeholders:
                if isinstance(placeholder, FormulaPlaceholder):
                    cid_count = 0
                    for char in placeholder.formula.pdf_character:
                        if re.match(r"^\(cid:\d+\)$", char.char_unicode):
                            cid_count += 1
                    if cid_count > len(placeholder.formula.pdf_character) * 0.8:
                        continue

                    hint[placeholder.placeholder] = get_char_unicode_string(
                        placeholder.formula.pdf_character
                    )
            if hint:
                return hint
            return None

    def create_formula_placeholder(
        self,
        formula: PdfFormula,
        formula_id: int,
        paragraph: PdfParagraph,
    ):
        placeholder = self.translate_engine.get_formular_placeholder(formula_id)
        if isinstance(placeholder, tuple):
            placeholder, regex_pattern = placeholder
        else:
            regex_pattern = re.escape(placeholder)
        if re.match(regex_pattern, paragraph.unicode, re.IGNORECASE):
            return self.create_formula_placeholder(formula, formula_id + 1, paragraph)

        return FormulaPlaceholder(formula_id, formula, placeholder, regex_pattern)

    def create_rich_text_placeholder(
        self,
        composition: PdfSameStyleCharacters,
        composition_id: int,
        paragraph: PdfParagraph,
    ):
        left_placeholder = self.translate_engine.get_rich_text_left_placeholder(
            composition_id,
        )
        right_placeholder = self.translate_engine.get_rich_text_right_placeholder(
            composition_id,
        )
        if isinstance(left_placeholder, tuple):
            left_placeholder, left_placeholder_regex_pattern = left_placeholder
        else:
            left_placeholder_regex_pattern = re.escape(left_placeholder)
        if isinstance(right_placeholder, tuple):
            right_placeholder, right_placeholder_regex_pattern = right_placeholder
        else:
            right_placeholder_regex_pattern = re.escape(right_placeholder)
        if re.match(
            f"{left_placeholder_regex_pattern}|{right_placeholder_regex_pattern}",
            paragraph.unicode,
            re.IGNORECASE,
        ):
            return self.create_rich_text_placeholder(
                composition,
                composition_id + 1,
                paragraph,
            )

        return RichTextPlaceholder(
            composition_id,
            composition,
            left_placeholder,
            right_placeholder,
            left_placeholder_regex_pattern,
            right_placeholder_regex_pattern,
        )

    def get_translate_input(
        self,
        paragraph: PdfParagraph,
        page_font_map: dict[str, PdfFont] = None,
        disable_rich_text_translate: bool | None = None,
    ):
        if not paragraph.pdf_paragraph_composition:
            return
        if len(paragraph.pdf_paragraph_composition) == 1:
            # 如果整个段落只有一个组成部分，那么直接返回，不需要套占位符等
            composition = paragraph.pdf_paragraph_composition[0]
            if (
                composition.pdf_line
                or composition.pdf_same_style_characters
                or composition.pdf_character
            ):
                return self.TranslateInput(paragraph.unicode, [], paragraph.pdf_style)
            elif composition.pdf_formula:
                # 不需要翻译纯公式
                return None
            elif composition.pdf_same_style_unicode_characters:
                # DEBUG INSERT CHAR, NOT TRANSLATE
                return None
            else:
                logger.error(
                    f"Unknown composition type. "
                    f"Composition: {composition}. "
                    f"Paragraph: {paragraph}. ",
                )
                return None

        # 如果没有指定 disable_rich_text_translate，使用配置中的值
        if disable_rich_text_translate is None:
            disable_rich_text_translate = (
                self.translation_config.disable_rich_text_translate
            )

        placeholder_id = 1
        placeholders = []
        chars = []
        for composition in paragraph.pdf_paragraph_composition:
            if composition.pdf_line:
                chars.extend(composition.pdf_line.pdf_character)
            elif composition.pdf_formula:
                formula_placeholder = self.create_formula_placeholder(
                    composition.pdf_formula,
                    placeholder_id,
                    paragraph,
                )
                placeholders.append(formula_placeholder)
                # 公式只需要一个占位符，所以 id+1
                placeholder_id = formula_placeholder.id + 1
                chars.extend(formula_placeholder.placeholder)
            elif composition.pdf_character:
                chars.append(composition.pdf_character)
            elif composition.pdf_same_style_characters:
                if disable_rich_text_translate:
                    # 如果禁用富文本翻译，直接添加字符
                    chars.extend(composition.pdf_same_style_characters.pdf_character)
                    continue

                fonta = self.font_mapper.map(
                    page_font_map[
                        composition.pdf_same_style_characters.pdf_style.font_id
                    ],
                    "1",
                )
                fontb = self.font_mapper.map(
                    page_font_map[paragraph.pdf_style.font_id],
                    "1",
                )
                if (
                    # 样式和段落基准样式一致，无需占位符
                    is_same_style(
                        composition.pdf_same_style_characters.pdf_style,
                        paragraph.pdf_style,
                    )
                    # 字号差异在 0.7-1.3 之间，可能是首字母变大效果，无需占位符
                    or is_same_style_except_size(
                        composition.pdf_same_style_characters.pdf_style,
                        paragraph.pdf_style,
                    )
                    or (
                        # 除了字体以外样式都和基准一样，并且字体都映射到同一个字体。无需占位符
                        is_same_style_except_font(
                            composition.pdf_same_style_characters.pdf_style,
                            paragraph.pdf_style,
                        )
                        and fonta
                        and fontb
                        and fonta.font_id == fontb.font_id
                    )
                    # or len(composition.pdf_same_style_characters.pdf_character) == 1
                ):
                    chars.extend(composition.pdf_same_style_characters.pdf_character)
                    continue
                placeholder = self.create_rich_text_placeholder(
                    composition.pdf_same_style_characters,
                    placeholder_id,
                    paragraph,
                )
                placeholders.append(placeholder)
                # 样式需要一左一右两个占位符，所以 id+2
                placeholder_id = placeholder.id + 2
                chars.append(placeholder.left_placeholder)
                chars.extend(composition.pdf_same_style_characters.pdf_character)
                chars.append(placeholder.right_placeholder)
            else:
                logger.error(
                    "Unexpected PdfParagraphComposition type "
                    "in PdfParagraph during translation. "
                    f"Composition: {composition}. "
                    f"Paragraph: {paragraph}. ",
                )
                return None

            # 如果占位符数量超过阈值，且未禁用富文本翻译，则递归调用并禁用富文本翻译
            if len(placeholders) > 40 and not disable_rich_text_translate:
                logger.warning(
                    f"Too many placeholders ({len(placeholders)}) in paragraph[{paragraph.debug_id}], "
                    "disabling rich text translation for this paragraph",
                )
                return self.get_translate_input(paragraph, page_font_map, True)

        text = get_char_unicode_string(chars)
        return self.TranslateInput(text, placeholders, paragraph.pdf_style)

    def process_formula(
        self,
        formula: PdfFormula,
        formula_id: int,
        paragraph: PdfParagraph,
    ):
        placeholder = self.create_formula_placeholder(formula, formula_id, paragraph)
        if placeholder.placeholder in paragraph.unicode:
            return self.process_formula(formula, formula_id + 1, paragraph)

        return placeholder

    def process_composition(
        self,
        composition: PdfSameStyleCharacters,
        composition_id: int,
        paragraph: PdfParagraph,
    ):
        placeholder = self.create_rich_text_placeholder(
            composition,
            composition_id,
            paragraph,
        )
        if (
            placeholder.left_placeholder in paragraph.unicode
            or placeholder.right_placeholder in paragraph.unicode
        ):
            return self.process_composition(
                composition,
                composition_id + 1,
                paragraph,
            )

        return placeholder

    def parse_translate_output(
        self,
        input_text: TranslateInput,
        output: str,
        llm_translate_tracker: LLMTranslateTracker | None = None,
    ) -> [PdfParagraphComposition]:
        result = []

        # 如果没有占位符，直接返回整个文本
        if not input_text.placeholders:
            comp = PdfParagraphComposition()
            comp.pdf_same_style_unicode_characters = PdfSameStyleUnicodeCharacters()
            comp.pdf_same_style_unicode_characters.unicode = output
            comp.pdf_same_style_unicode_characters.pdf_style = input_text.base_style
            if llm_translate_tracker:
                llm_translate_tracker.set_placeholder_full_match()
            return [comp]

        # 构建正则表达式模式
        patterns = []
        placeholder_patterns = []
        placeholder_map = {}

        for placeholder in input_text.placeholders:
            if isinstance(placeholder, FormulaPlaceholder):
                # 转义特殊字符
                # pattern = re.escape(placeholder.placeholder)
                pattern = placeholder.regex_pattern
                patterns.append(f"({pattern})")
                placeholder_patterns.append(f"({pattern})")
                placeholder_map[placeholder.placeholder] = placeholder
            else:
                left = placeholder.left_regex_pattern
                right = placeholder.right_regex_pattern
                patterns.append(f"({left}.*?{right})")
                placeholder_patterns.append(f"({left})")
                placeholder_patterns.append(f"({right})")
                placeholder_map[placeholder.left_placeholder] = placeholder
        all_match = True
        for pattern in patterns:
            if not re.search(pattern, output, flags=re.IGNORECASE):
                all_match = False
                break
        if all_match:
            if llm_translate_tracker:
                llm_translate_tracker.set_placeholder_full_match()
        else:
            logger.debug(f"Failed to match all placeholder for {input_text.unicode}")
        # 合并所有模式
        combined_pattern = "|".join(patterns)
        combined_placeholder_pattern = "|".join(placeholder_patterns)

        def remove_placeholder(text: str):
            return re.sub(combined_placeholder_pattern, "", text, flags=re.IGNORECASE)

        # 找到所有匹配
        last_end = 0
        for match in re.finditer(combined_pattern, output, flags=re.IGNORECASE):
            # 处理匹配之前的普通文本
            if match.start() > last_end:
                text = output[last_end : match.start()]
                if text:
                    comp = PdfParagraphComposition()
                    comp.pdf_same_style_unicode_characters = (
                        PdfSameStyleUnicodeCharacters()
                    )
                    comp.pdf_same_style_unicode_characters.unicode = remove_placeholder(
                        text,
                    )
                    comp.pdf_same_style_unicode_characters.pdf_style = (
                        input_text.base_style
                    )
                    result.append(comp)

            matched_text = match.group(0)

            # 处理占位符
            if any(
                isinstance(p, FormulaPlaceholder)
                and re.match(f"^{p.regex_pattern}$", matched_text, re.IGNORECASE)
                for p in input_text.placeholders
            ):
                # 处理公式占位符
                placeholder = next(
                    p
                    for p in input_text.placeholders
                    if isinstance(p, FormulaPlaceholder)
                    and re.match(f"^{p.regex_pattern}$", matched_text, re.IGNORECASE)
                )
                comp = PdfParagraphComposition()
                comp.pdf_formula = placeholder.formula
                result.append(comp)
            else:
                # 处理富文本占位符
                placeholder = next(
                    p
                    for p in input_text.placeholders
                    if not isinstance(p, FormulaPlaceholder)
                    and re.match(
                        f"^{p.left_regex_pattern}", matched_text, re.IGNORECASE
                    )
                )
                text = re.match(
                    f"^{placeholder.left_regex_pattern}(.*){placeholder.right_regex_pattern}$",
                    matched_text,
                    re.IGNORECASE,
                ).group(1)

                if isinstance(
                    placeholder.composition,
                    PdfSameStyleCharacters,
                ) and text.replace(" ", "") == "".join(
                    x.char_unicode for x in placeholder.composition.pdf_character
                ).replace(
                    " ",
                    "",
                ):
                    comp = PdfParagraphComposition(
                        pdf_same_style_characters=placeholder.composition,
                    )
                else:
                    comp = PdfParagraphComposition()
                    comp.pdf_same_style_unicode_characters = (
                        PdfSameStyleUnicodeCharacters()
                    )
                    comp.pdf_same_style_unicode_characters.pdf_style = (
                        placeholder.composition.pdf_style
                    )
                    comp.pdf_same_style_unicode_characters.unicode = remove_placeholder(
                        text,
                    )
                result.append(comp)

            last_end = match.end()

        # 处理最后的普通文本
        if last_end < len(output):
            text = output[last_end:]
            if text:
                comp = PdfParagraphComposition()
                comp.pdf_same_style_unicode_characters = PdfSameStyleUnicodeCharacters()
                comp.pdf_same_style_unicode_characters.unicode = remove_placeholder(
                    text,
                )
                comp.pdf_same_style_unicode_characters.pdf_style = input_text.base_style
                result.append(comp)

        return result

    def pre_translate_paragraph(
        self,
        paragraph: PdfParagraph,
        tracker: ParagraphTranslateTracker,
        page_font_map: dict[str, PdfFont],
        xobj_font_map: dict[int, dict[str, PdfFont]],
    ):
        """Pre-translation processing: prepare text for translation."""
        if paragraph.vertical:
            return None, None
        tracker.set_pdf_unicode(paragraph.unicode)
        if paragraph.xobj_id in xobj_font_map:
            page_font_map = xobj_font_map[paragraph.xobj_id]
        disable_rich_text_translate = (
            self.translation_config.disable_rich_text_translate
        )
        if not self.support_llm_translate:
            disable_rich_text_translate = True

        translate_input = self.get_translate_input(
            paragraph, page_font_map, disable_rich_text_translate
        )
        if not translate_input:
            return None, None
        tracker.set_input(translate_input.unicode)
        text = translate_input.unicode
        if len(text) < self.translation_config.min_text_length:
            logger.debug(
                f"Text too short to translate, skip. Text: {text}. Paragraph id: {paragraph.debug_id}."
            )
            return None, None
        return text, translate_input

    def post_translate_paragraph(
        self,
        paragraph: PdfParagraph,
        tracker: ParagraphTranslateTracker,
        translate_input,
        translated_text: str,
    ):
        """Post-translation processing: update paragraph with translated text."""
        tracker.set_output(translated_text)
        if translated_text == translate_input.unicode:
            if llm_translate_tracker := tracker.last_llm_translate_tracker():
                llm_translate_tracker.set_placeholder_full_match()
            return False
        paragraph.unicode = translated_text
        paragraph.pdf_paragraph_composition = self.parse_translate_output(
            translate_input, translated_text, tracker.last_llm_translate_tracker()
        )
        for composition in paragraph.pdf_paragraph_composition:
            if (
                composition.pdf_same_style_unicode_characters
                and composition.pdf_same_style_unicode_characters.pdf_style is None
            ):
                composition.pdf_same_style_unicode_characters.pdf_style = (
                    paragraph.pdf_style
                )
        return True

    def generate_prompt_for_llm(
        self,
        text: str,
        title_paragraph: PdfParagraph | None = None,
        local_title_paragraph: PdfParagraph | None = None,
        translate_input: TranslateInput | None = None,
    ):
        if self.translation_config.custom_system_prompt:
            llm_input = [self.translation_config.custom_system_prompt]
        else:
            llm_input = [
                f"You are a professional and reliable machine translation engine responsible for translating the input text into {self.translation_config.lang_out}."
            ]

        llm_context_hints = []

        if title_paragraph:
            llm_context_hints.append(
                f"The first title in the full text: {title_paragraph.unicode}"
            )
        if (
            local_title_paragraph
            and title_paragraph
            and local_title_paragraph.debug_id != title_paragraph.debug_id
        ):
            llm_context_hints.append(
                f"The most similar title in the full text: {local_title_paragraph.unicode}"
            )

        if translate_input and self.translation_config.add_formula_placehold_hint:
            placeholders_hint = translate_input.get_placeholders_hint()
            if placeholders_hint:
                llm_context_hints.append(
                    f"This is the formula placeholder hint: \n{placeholders_hint}"
                )

        active_glossary_markdown_blocks: list[str] = []
        # Use cached glossaries
        if self._cached_glossaries:
            for glossary in self._cached_glossaries:
                # Get active entries for the current text being processed (passed as 'text')
                active_entries = glossary.get_active_entries_for_text(text)

                if active_entries:
                    current_glossary_md_entries: list[str] = []
                    for original_source, target_text in sorted(active_entries):
                        current_glossary_md_entries.append(
                            f"| {original_source} | {target_text} |"
                        )

                    if current_glossary_md_entries:
                        glossary_table_md = (
                            f"### Glossary: {glossary.name}\n\n"
                            "| Source Term | Target Term |\n"
                            "|-------------|-------------|\n"
                            + "\n".join(current_glossary_md_entries)
                        )
                        active_glossary_markdown_blocks.append(glossary_table_md)

        if llm_context_hints or active_glossary_markdown_blocks:
            llm_input.append(
                "When translating, please refer to the following information to improve translation quality:"
            )
            current_hint_index = 1
            for hint_line in llm_context_hints:
                llm_input.append(f"{current_hint_index}. {hint_line}")
                current_hint_index += 1

            if active_glossary_markdown_blocks:
                llm_input.append(
                    f"{current_hint_index}. You MUST strictly adhere to the following glossaries. If a source term from a table appears in the text, use the corresponding target term in your translation:"
                )
                current_hint_index += 1
                for md_block in active_glossary_markdown_blocks:
                    llm_input.append(f"\n{md_block}\n")

        llm_input.append("When translating, please follow the following rules:")

        rich_text_left_placeholder = (
            self.translate_engine.get_rich_text_left_placeholder(1)
        )
        if isinstance(rich_text_left_placeholder, tuple):
            rich_text_left_placeholder = rich_text_left_placeholder[0]
        rich_text_right_placeholder = (
            self.translate_engine.get_rich_text_right_placeholder(2)
        )
        if isinstance(rich_text_right_placeholder, tuple):
            rich_text_right_placeholder = rich_text_right_placeholder[0]

        # Create a structured prompt template for LLM translation
        llm_input.append(
            f'1. Do not translate style tags, such as "{rich_text_left_placeholder}xxx{rich_text_right_placeholder}"!'
        )

        formula_placeholder = self.translate_engine.get_formular_placeholder(3)
        if isinstance(formula_placeholder, tuple):
            formula_placeholder = formula_placeholder[0]

        llm_input.append(
            f'2. Do not translate formula placeholders, such as "{formula_placeholder}". The system will automatically replace the placeholders with the corresponding formulas.'
        )
        llm_input.append(
            "3. If there is no need to translate (such as proper nouns, codes, etc.), then return the original text."
        )
        llm_input.append(
            f"4. Only output the translation result in {self.translation_config.lang_out} without explanations and annotations."
        )
        llm_input.append(f"5. Translate text into {self.translation_config.lang_out}.")
        prompt_template = f"""
Now, please carefully read the following text to be translated and directly output your translation.\n\n{text}

"""
        llm_input.append(prompt_template)

        final_input = "\n".join(llm_input).strip()

        return final_input

    def translate_paragraph(
        self,
        paragraph: PdfParagraph,
        pbar: tqdm | None = None,
        tracker: ParagraphTranslateTracker = None,
        page_font_map: dict[str, PdfFont] = None,
        xobj_font_map: dict[int, dict[str, PdfFont]] = None,
        paragraph_token_count: int = 0,
        title_paragraph: PdfParagraph | None = None,
        local_title_paragraph: PdfParagraph | None = None,
    ):
        """Translate a paragraph using pre and post processing functions."""
        self.translation_config.raise_if_cancelled()
        with PbarContext(pbar):
            try:
                if self.use_as_fallback:
                    # il translator llm only modifies unicode in some situations
                    paragraph.unicode = get_paragraph_unicode(paragraph)
                # Pre-translation processing
                text, translate_input = self.pre_translate_paragraph(
                    paragraph, tracker, page_font_map, xobj_font_map
                )
                if text is None:
                    return
                llm_translate_tracker = tracker.new_llm_translate_tracker()
                # Perform translation
                if self.support_llm_translate:
                    llm_prompt = self.generate_prompt_for_llm(
                        text, title_paragraph, local_title_paragraph, translate_input
                    )
                    llm_translate_tracker.set_input(llm_prompt)
                    translated_text = self.translate_engine.llm_translate(
                        llm_prompt,
                        rate_limit_params={
                            "paragraph_token_count": paragraph_token_count
                        },
                    )
                    llm_translate_tracker.set_output(translated_text)
                else:
                    translated_text = self.translate_engine.translate(
                        text,
                        rate_limit_params={
                            "paragraph_token_count": paragraph_token_count
                        },
                    )
                translated_text = re.sub(r"[. 。…，]{20,}", ".", translated_text)

                # Post-translation processing
                self.post_translate_paragraph(
                    paragraph, tracker, translate_input, translated_text
                )
            except Exception as e:
                logger.exception(
                    f"Error translating paragraph. Paragraph: {paragraph.debug_id} ({paragraph.unicode}). Error: {e}. ",
                )
                # ignore error and continue
                return
