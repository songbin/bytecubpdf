import copy
import json
import logging
import re
from pathlib import Path

import Levenshtein
import tiktoken
from tqdm import tqdm

from babeldoc.document_il import Document
from babeldoc.document_il import Page
from babeldoc.document_il import PdfFont
from babeldoc.document_il import PdfParagraph
from babeldoc.document_il.midend import il_translator
from babeldoc.document_il.midend.il_translator import DocumentTranslateTracker
from babeldoc.document_il.midend.il_translator import ILTranslator
from babeldoc.document_il.midend.il_translator import PageTranslateTracker
from babeldoc.document_il.translator.translator import BaseTranslator
from babeldoc.document_il.utils.fontmap import FontMapper
from babeldoc.document_il.utils.paragraph_helper import is_cid_paragraph
from babeldoc.document_il.utils.priority_thread_pool_executor import (
    PriorityThreadPoolExecutor,
)
from babeldoc.translation_config import TranslationConfig

logger = logging.getLogger(__name__)


class BatchParagraph:
    def __init__(
        self, paragraphs: list[PdfParagraph], page_tracker: PageTranslateTracker
    ):
        self.paragraphs = paragraphs
        self.trackers = [page_tracker.new_paragraph() for _ in paragraphs]


class ILTranslatorLLMOnly:
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

        self.il_translator = ILTranslator(
            translate_engine=translate_engine,
            translation_config=translation_config,
            tokenizer=self.tokenizer,
        )
        self.il_translator.use_as_fallback = True
        try:
            self.translate_engine.do_llm_translate(None)
        except NotImplementedError as e:
            raise ValueError("LLM translator not supported") from e

    def calc_token_count(self, text: str) -> int:
        try:
            return len(self.tokenizer.encode(text, disallowed_special=()))
        except Exception:
            return 0

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

    def translate(self, docs: Document) -> None:
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
        total = sum(
            [
                len(
                    [
                        p
                        for p in page.pdf_paragraph
                        if p.debug_id is not None and p.unicode is not None
                    ]
                )
                for page in docs.page
            ]
        )
        with self.translation_config.progress_monitor.stage_start(
            self.stage_name,
            total,
        ) as pbar:
            with PriorityThreadPoolExecutor(
                max_workers=self.translation_config.pool_max_workers,
            ) as executor2:
                with PriorityThreadPoolExecutor(
                    max_workers=self.translation_config.pool_max_workers,
                ) as executor:
                    for page in docs.page:
                        self.process_page(
                            page,
                            executor,
                            pbar,
                            tracker.new_page(),
                            executor2,
                        )

        path = self.translation_config.get_working_file_path("translate_tracking.json")

        if self.translation_config.debug:
            logger.debug(f"save translate tracking to {path}")
            with Path(path).open("w", encoding="utf-8") as f:
                f.write(tracker.to_json())

    def process_page(
        self,
        page: Page,
        executor: PriorityThreadPoolExecutor,
        pbar: tqdm | None = None,
        tracker: PageTranslateTracker = None,
        executor2: PriorityThreadPoolExecutor | None = None,
    ):
        self.translation_config.raise_if_cancelled()
        page_font_map = {}
        for font in page.pdf_font:
            page_font_map[font.font_id] = font
        page_xobj_font_map = {}
        for xobj in page.pdf_xobject:
            page_xobj_font_map[xobj.xobj_id] = page_font_map.copy()
            for font in xobj.pdf_font:
                page_xobj_font_map[xobj.xobj_id][font.font_id] = font

        paragraphs = []

        total_token_count = 0
        for paragraph in page.pdf_paragraph:
            if paragraph.debug_id is None or paragraph.unicode is None:
                continue
            if is_cid_paragraph(paragraph):
                pbar.advance(1)
                continue
            # self.translate_paragraph(paragraph, pbar,tracker.new_paragraph(), page_font_map, page_xobj_font_map)
            total_token_count += self.calc_token_count(paragraph.unicode)
            paragraphs.append(paragraph)
            if paragraph.layout_label == "title":
                self.shared_context_cross_split_part.recent_title_paragraph = (
                    copy.deepcopy(paragraph)
                )

            if total_token_count > 200 or len(paragraphs) > 5:
                executor.submit(
                    self.translate_paragraph,
                    BatchParagraph(paragraphs, tracker),
                    pbar,
                    page_font_map,
                    page_xobj_font_map,
                    self.translation_config.shared_context_cross_split_part.first_paragraph,
                    self.translation_config.shared_context_cross_split_part.recent_title_paragraph,
                    executor2,
                    priority=1048576 - total_token_count,
                    paragraph_token_count=total_token_count,
                )
                paragraphs = []
                total_token_count = 0

        if paragraphs:
            executor.submit(
                self.translate_paragraph,
                BatchParagraph(paragraphs, tracker),
                pbar,
                page_font_map,
                page_xobj_font_map,
                self.translation_config.shared_context_cross_split_part.first_paragraph,
                self.translation_config.shared_context_cross_split_part.recent_title_paragraph,
                executor2,
                priority=1048576 - total_token_count,
                paragraph_token_count=total_token_count,
            )

    def translate_paragraph(
        self,
        batch_paragraph: BatchParagraph,
        pbar: tqdm | None = None,
        page_font_map: dict[str, PdfFont] = None,
        xobj_font_map: dict[int, dict[str, PdfFont]] = None,
        title_paragraph: PdfParagraph | None = None,
        local_title_paragraph: PdfParagraph | None = None,
        executor: PriorityThreadPoolExecutor | None = None,
        paragraph_token_count: int = 0,
    ):
        """Translate a paragraph using pre and post processing functions."""
        self.translation_config.raise_if_cancelled()
        should_translate_paragraph = []
        try:
            inputs = []
            llm_translate_trackers = []
            paragraph_unicodes = []
            for i in range(len(batch_paragraph.paragraphs)):
                paragraph = batch_paragraph.paragraphs[i]
                tracker = batch_paragraph.trackers[i]
                text, translate_input = self.il_translator.pre_translate_paragraph(
                    paragraph, tracker, page_font_map, xobj_font_map
                )
                if text is None:
                    pbar.advance(1)
                    continue
                llm_translate_tracker = tracker.new_llm_translate_tracker()
                should_translate_paragraph.append(i)
                llm_translate_trackers.append(llm_translate_tracker)
                inputs.append(
                    (
                        text,
                        translate_input,
                        paragraph,
                        tracker,
                        llm_translate_tracker,
                        paragraph_unicodes,
                    )
                )
                paragraph_unicodes.append(paragraph.unicode)
            if not inputs:
                return
            json_format_input = []

            for id_, input_text in enumerate(inputs):
                ti: il_translator.ILTranslator.TranslateInput = input_text[1]
                placeholders_hint = ti.get_placeholders_hint()
                obj = {
                    "id": id_,
                    "input": input_text[0],
                    "layout_label": input_text[2].layout_label,
                }
                if (
                    placeholders_hint
                    and self.translation_config.add_formula_placehold_hint
                ):
                    obj["formula_placeholders_hint"] = placeholders_hint
                json_format_input.append(obj)

            json_format_input_str = json.dumps(
                json_format_input, ensure_ascii=False, indent=2
            )

            # Start building the new prompt
            llm_prompt_parts = []

            # 1. #role
            llm_prompt_parts.append("#role")
            if self.translation_config.custom_system_prompt:
                llm_prompt_parts.append(self.translation_config.custom_system_prompt)
            else:
                llm_prompt_parts.append(
                    f"You are a professional and reliable machine translation engine responsible for translating the input text into {self.translation_config.lang_out}.\n"
                    "When translating, strictly follow the instructions below to ensure translation quality and preserve all formatting, tags, and placeholders:\n"
                )

            # 2. ##Contextual Hints for Better Translation
            contextual_hints_section: list[str] = []
            hint_idx = 1
            if title_paragraph:
                contextual_hints_section.append(
                    f"{hint_idx}. First title in full text: {title_paragraph.unicode}"
                )
                hint_idx += 1

            if local_title_paragraph:
                is_different_from_global = True
                if title_paragraph:
                    if local_title_paragraph.debug_id == title_paragraph.debug_id:
                        is_different_from_global = False

                if is_different_from_global:
                    contextual_hints_section.append(
                        f"{hint_idx}. Most similar section title: {local_title_paragraph.unicode}"
                    )
                    hint_idx += 1

            # --- ADD GLOSSARY HINTS ---
            batch_text_for_glossary_matching = "\n".join(
                item.get("input", "") for item in json_format_input
            )

            active_glossary_markdown_blocks: list[str] = []
            # Use cached glossaries
            if self._cached_glossaries:
                for glossary in self._cached_glossaries:
                    # Get active entries for the current batch_text_for_glossary_matching
                    active_entries = glossary.get_active_entries_for_text(
                        batch_text_for_glossary_matching
                    )

                    if active_entries:
                        current_glossary_md_entries: list[str] = []
                        for original_source, target_text in active_entries:
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

            if contextual_hints_section or active_glossary_markdown_blocks:
                llm_prompt_parts.append("\n## Contextual Hints for Better Translation")
                llm_prompt_parts.extend(contextual_hints_section)

                if active_glossary_markdown_blocks:
                    llm_prompt_parts.append(
                        f"{hint_idx}. You MUST strictly adhere to the following glossaries. auto_extracted_glossary has a lower priority; please give preference to other glossaries. If a source term from a table appears in the text, use the corresponding target term in your translation:"
                    )
                    # hint_idx += 1 # No need to increment if tables are part of this point
                    for md_block in active_glossary_markdown_blocks:
                        llm_prompt_parts.append(f"\n{md_block}\n")

            # 3. ## Strict Rules:
            llm_prompt_parts.append("\n## Strict Rules:")
            llm_prompt_parts.append(
                "1. Do NOT translate or alter any of the following elements:"
            )
            llm_prompt_parts.append(
                "    Style or HTML-like tags: e.g., <style id='1'>...</style>, <b>...</b>, <i>...</i>, <code>...</code>, etc."
            )
            llm_prompt_parts.append(
                "    Formula or variable placeholders enclosed in curly braces: e.g., {v3}, {equation_1}, {name}, etc."
            )
            llm_prompt_parts.append(
                "    Any other placeholders like [[...]], %%...%%, %s, %d, etc."
            )
            llm_prompt_parts.append(
                "2. Preserve the exact structure, position, and content of the above elements — do not modify spacing, punctuation, or formatting."
            )
            llm_prompt_parts.append(
                "3. If the input contains:Proper nouns, code, or non-translatable technical terms, retain them in the original form."
            )

            # 4. ## Input/Output Format:
            llm_prompt_parts.append("\n## Input/Output Format:")
            llm_prompt_parts.append(
                '1. You will receive a JSON object with entries containing "id" and "input" fields.'
            )
            llm_prompt_parts.append(
                f'2. Your task is to translate the value of "input" into {self.translation_config.lang_out}, while applying the rules above.'
            )
            llm_prompt_parts.append(
                '3. Return a new JSON object with the same "id" and the translated "output" field.'
            )
            llm_prompt_parts.append(
                "Please return the translated json directly without wrapping ```json``` tag or include any additional information."
            )

            # 5. ##example (Renumbered from 5 to 4)
            llm_prompt_parts.append("\n## Example:")
            llm_prompt_parts.append("Here is an example of the expected format:")
            llm_prompt_parts.append("")  # Blank line
            llm_prompt_parts.append("<example>")
            llm_prompt_parts.append("```json")
            llm_prompt_parts.append("Input:")
            llm_prompt_parts.append("{")
            llm_prompt_parts.append('    "id": 1,')
            llm_prompt_parts.append('    "input": "Source",')
            llm_prompt_parts.append('    "layout_label": "plain text",')
            llm_prompt_parts.append("    // this is optional")
            llm_prompt_parts.append('    "formula_placeholders_hint": {')
            llm_prompt_parts.append('        "placeholder1": "hint1",')
            llm_prompt_parts.append('        "placeholder2": "hint2"')
            llm_prompt_parts.append("    }")
            llm_prompt_parts.append("}")
            llm_prompt_parts.append("```")
            llm_prompt_parts.append("Output:")
            llm_prompt_parts.append("```json")
            llm_prompt_parts.append("{")
            llm_prompt_parts.append('    "id": 1,')
            llm_prompt_parts.append('    "output": "Translation"')
            llm_prompt_parts.append("}")
            llm_prompt_parts.append("```")
            llm_prompt_parts.append("</example>")

            # 6. ## Here is the input:
            llm_prompt_parts.append("\n## Here is the input:")

            # Combine all parts for the main prompt
            main_prompt_content = "\n".join(llm_prompt_parts)

            # Append the actual JSON input string at the end, without markdown fence
            final_input = main_prompt_content + "\n\n" + json_format_input_str

            for llm_translate_tracker in llm_translate_trackers:
                llm_translate_tracker.set_input(final_input)
            llm_output = self.translate_engine.llm_translate(
                final_input,
                rate_limit_params={"paragraph_token_count": paragraph_token_count},
            )
            for llm_translate_tracker in llm_translate_trackers:
                llm_translate_tracker.set_output(llm_output)
            llm_output = llm_output.strip()

            llm_output = self._clean_json_output(llm_output)

            parsed_output = json.loads(llm_output)

            if isinstance(parsed_output, dict) and parsed_output.get(
                "output", parsed_output.get("input", False)
            ):
                parsed_output = [parsed_output]

            translation_results = {
                item["id"]: item.get("output", item.get("input"))
                for item in parsed_output
            }

            if len(translation_results) != len(inputs):
                raise Exception(
                    f"Translation results length mismatch. Expected: {len(inputs)}, Got: {len(translation_results)}"
                )

            for id_, output in translation_results.items():
                should_fallback = True
                try:
                    if not isinstance(output, str):
                        logger.warning(
                            f"Translation result is not a string. Output: {output}"
                        )
                        continue

                    id_ = int(id_)  # Ensure id is an integer
                    if id_ >= len(inputs):
                        logger.warning(f"Invalid id {id_}, skipping")
                        continue

                    # Clean up any excessive punctuation in the translated text
                    translated_text = re.sub(r"[. 。…，]{20,}", ".", output)

                    # Get the original input for this translation
                    translate_input = inputs[id_][1]
                    llm_translate_tracker = inputs[id_][4]

                    input_unicode = inputs[id_][2].unicode
                    output_unicode = translated_text

                    input_token_count = self.calc_token_count(input_unicode)
                    output_token_count = self.calc_token_count(output_unicode)

                    if not (0.3 < output_token_count / input_token_count < 3):
                        llm_translate_tracker.set_error_message(
                            f"Translation result is too long or too short. Input: {input_token_count}, Output: {output_token_count}"
                        )
                        logger.warning(
                            f"Translation result is too long or too short. Input: {input_token_count}, Output: {output_token_count}"
                        )
                        continue

                    edit_distance = Levenshtein.distance(input_unicode, output_unicode)
                    if edit_distance < 5 and input_token_count > 20:
                        llm_translate_tracker.set_error_message(
                            f"Translation result edit distance is too small. distance: {edit_distance}, input: {input_unicode}, output: {output_unicode}"
                        )
                        logger.warning(
                            f"Translation result edit distance is too small. distance: {edit_distance}, input: {input_unicode}, output: {output_unicode}"
                        )
                        continue
                    # Apply the translation to the paragraph
                    self.il_translator.post_translate_paragraph(
                        inputs[id_][2],
                        inputs[id_][3],
                        translate_input,
                        translated_text,
                    )
                    should_fallback = False
                    if pbar:
                        pbar.advance(1)
                except Exception as e:
                    error_message = f"Error translating paragraph. Error: {e}."
                    logger.exception(error_message)
                    # Ignore error and continue
                    for llm_translate_tracker in llm_translate_trackers:
                        llm_translate_tracker.set_error_message(error_message)
                    continue
                finally:
                    if should_fallback:
                        inputs[id_][4].set_fallback_to_translate()
                        logger.warning(
                            f"Fallback to simple translation. paragraph id: {inputs[id_][2].debug_id}"
                        )
                        paragraph_token_count = self.calc_token_count(
                            inputs[id_][2].unicode
                        )
                        paragraph_unicodes = inputs[id_][5]
                        inputs[id_][2].unicode = paragraph_unicodes[id_]
                        executor.submit(
                            self.il_translator.translate_paragraph,
                            inputs[id_][2],
                            pbar,
                            inputs[id_][3],
                            page_font_map,
                            xobj_font_map,
                            priority=1048576 - paragraph_token_count,
                            paragraph_token_count=paragraph_token_count,
                            title_paragraph=title_paragraph,
                            local_title_paragraph=local_title_paragraph,
                        )

        except Exception as e:
            error_message = f"Error {e} during translation. try fallback"
            logger.warning(error_message)
            for llm_translate_tracker in llm_translate_trackers:
                llm_translate_tracker.set_error_message(error_message)
                llm_translate_tracker.set_fallback_to_translate()
            for input_ in inputs:
                input_[2].unicode = input_[5]
            if not should_translate_paragraph:
                should_translate_paragraph = list(
                    range(len(batch_paragraph.paragraphs))
                )
            for i in should_translate_paragraph:
                paragraph = batch_paragraph.paragraphs[i]
                tracker = batch_paragraph.trackers[i]
                if paragraph.debug_id is None:
                    continue
                paragraph_token_count = self.calc_token_count(paragraph.unicode)
                executor.submit(
                    self.il_translator.translate_paragraph,
                    paragraph,
                    pbar,
                    tracker,
                    page_font_map,
                    xobj_font_map,
                    priority=1048576 - paragraph_token_count,
                    paragraph_token_count=paragraph_token_count,
                    title_paragraph=title_paragraph,
                    local_title_paragraph=local_title_paragraph,
                )

    def _clean_json_output(self, llm_output: str) -> str:
        # Clean up JSON output by removing common wrapper tags
        llm_output = llm_output.strip()
        if llm_output.startswith("<json>"):
            llm_output = llm_output[6:]
        if llm_output.endswith("</json>"):
            llm_output = llm_output[:-7]
        if llm_output.startswith("```json"):
            llm_output = llm_output[7:]
        if llm_output.startswith("```"):
            llm_output = llm_output[3:]
        if llm_output.endswith("```"):
            llm_output = llm_output[:-3]
        return llm_output.strip()
