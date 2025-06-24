import math
import re

from babeldoc.format.pdf.document_il.il_version_1 import Box
from babeldoc.format.pdf.document_il.il_version_1 import Document
from babeldoc.format.pdf.document_il.il_version_1 import GraphicState
from babeldoc.format.pdf.document_il.il_version_1 import Page
from babeldoc.format.pdf.document_il.il_version_1 import PdfCharacter
from babeldoc.format.pdf.document_il.il_version_1 import PdfFormula
from babeldoc.format.pdf.document_il.il_version_1 import PdfLine
from babeldoc.format.pdf.document_il.il_version_1 import PdfParagraphComposition
from babeldoc.format.pdf.document_il.il_version_1 import PdfSameStyleCharacters
from babeldoc.format.pdf.document_il.il_version_1 import PdfStyle
from babeldoc.format.pdf.document_il.utils.fontmap import FontMapper
from babeldoc.format.pdf.document_il.utils.formular_helper import (
    collect_page_formula_font_ids,
)
from babeldoc.format.pdf.document_il.utils.formular_helper import (
    is_formulas_middle_char,
)
from babeldoc.format.pdf.document_il.utils.formular_helper import is_formulas_start_char
from babeldoc.format.pdf.document_il.utils.formular_helper import update_formula_data
from babeldoc.format.pdf.document_il.utils.layout_helper import LEFT_BRACKET
from babeldoc.format.pdf.document_il.utils.layout_helper import RIGHT_BRACKET
from babeldoc.format.pdf.document_il.utils.layout_helper import build_layout_index
from babeldoc.format.pdf.document_il.utils.layout_helper import calculate_iou_for_boxes
from babeldoc.format.pdf.document_il.utils.layout_helper import (
    calculate_y_iou_for_boxes,
)
from babeldoc.format.pdf.document_il.utils.layout_helper import is_bullet_point
from babeldoc.format.pdf.document_il.utils.layout_helper import is_same_style
from babeldoc.format.pdf.translation_config import TranslationConfig


class StylesAndFormulas:
    stage_name = "Parse Formulas and Styles"

    def __init__(self, translation_config: TranslationConfig):
        self.translation_config = translation_config
        self.font_mapper = FontMapper(translation_config)

    def update_formula_data(self, formula: PdfFormula):
        update_formula_data(formula)

    def process(self, document: Document):
        with self.translation_config.progress_monitor.stage_start(
            self.stage_name,
            len(document.page),
        ) as pbar:
            for page in document.page:
                self.translation_config.raise_if_cancelled()
                self.process_page(page)
                pbar.advance()

    def update_all_formula_data(self, page: Page):
        for para in page.pdf_paragraph:
            for comp in para.pdf_paragraph_composition:
                if comp.pdf_formula:
                    self.update_formula_data(comp.pdf_formula)

    def process_page(self, page: Page):
        """处理页面，包括公式识别和偏移量计算"""
        build_layout_index(page)
        self.process_page_formulas(page)
        # self.process_page_offsets(page)
        self.process_comma_formulas(page)
        self.merge_overlapping_formulas(page)
        # self.process_page_offsets(page)
        self.process_translatable_formulas(page)
        self.update_all_formula_data(page)
        self.process_page_offsets(page)
        self.update_all_formula_data(page)
        self.process_page_styles(page)

        # clean up to save memory
        del page.layout_index
        del page.layout_map

    def update_line_data(self, line: PdfLine):
        min_x = min(char.visual_bbox.box.x for char in line.pdf_character)
        min_y = min(char.visual_bbox.box.y for char in line.pdf_character)
        max_x = max(char.visual_bbox.box.x2 for char in line.pdf_character)
        max_y = max(char.visual_bbox.box.y2 for char in line.pdf_character)
        line.box = Box(min_x, min_y, max_x, max_y)

    def _classify_characters_in_composition(
        self,
        composition: PdfParagraphComposition,
        formula_font_ids: set[int],
        first_is_bullet_so_far: bool,
    ) -> tuple[list[tuple[PdfCharacter, bool]], bool]:
        """
        Phase 1: Classify every character in a composition as either formula or text.
        This preserves the original logic, including the sticky `first_is_bullet` flag.
        """
        tagged_chars = []
        is_formula_tags = []

        line = composition.pdf_line
        if not line or not line.pdf_character:
            return [], first_is_bullet_so_far

        first_is_bullet = first_is_bullet_so_far
        in_formula_state = False
        in_corner_mark_state = False

        # Determine the `is_formula` tag for each character
        for i, char in enumerate(line.pdf_character):
            # The original logic for `first_is_bullet`: it is set if any segment starts with a bullet.
            # A "segment" started when `current_chars` was empty.
            # We determine the start of a segment by looking at the previous char's tag.
            is_start_of_segment = i == 0 or (
                len(is_formula_tags) > 0 and is_formula_tags[-1] != in_formula_state
            )
            if not first_is_bullet and is_start_of_segment and is_bullet_point(char):
                first_is_bullet = True

            is_formula = (
                (  # 区分公式开头的字符&公式中间的字符。主要是逗号不能在公式开头，但是可以在中间。
                    char.formula_layout_id
                    or (
                        is_formulas_start_char(
                            char.char_unicode,
                            self.font_mapper,
                            self.translation_config,
                        )
                        and not in_formula_state
                    )
                    or (
                        is_formulas_middle_char(
                            char.char_unicode,
                            self.font_mapper,
                            self.translation_config,
                        )
                        and in_formula_state
                    )
                )  # 公式字符
                or char.pdf_style.font_id in formula_font_ids  # 公式字体
                or char.vertical  # 垂直字体
                or (
                    #   如果是程序添加的 dummy 空格
                    char.char_unicode is None and in_formula_state
                )
                or (
                    # 如果字符的视觉框和实际框不一致，则认为是公式字符
                    char.box.x > char.visual_bbox.box.x2
                    or char.box.x2 < char.visual_bbox.box.x
                    or char.box.y > char.visual_bbox.box.y2
                    or char.box.y2 < char.visual_bbox.box.y
                )
            )

            previous_char = line.pdf_character[i - 1] if i > 0 else None
            isspace = char.char_unicode.isspace() if char.char_unicode else False

            is_corner_mark = (
                previous_char is not None
                and not isspace
                and not first_is_bullet
                # 角标字体，有 0.76 的角标和 0.799 的大写，这里用 0.79 取中，同时考虑首字母放大的情况
                and char.pdf_style.font_size < previous_char.pdf_style.font_size * 0.79
                and not in_corner_mark_state
            ) or (
                previous_char is not None
                and not isspace
                and not first_is_bullet
                # 角标字体，有 0.76 的角标和 0.799 的大写，这里用 0.79 取中，同时考虑首字母放大的情况
                and char.pdf_style.font_size < previous_char.pdf_style.font_size * 1.1
                and in_corner_mark_state
            )

            is_formula = is_formula or is_corner_mark

            if char.char_unicode == " ":
                is_formula = in_formula_state

            # This simulates the state change for the next iteration
            if is_formula != in_formula_state:
                in_formula_state = is_formula

            in_corner_mark_state = is_corner_mark
            is_formula_tags.append(is_formula)

        # Pair characters with their tags
        for char, is_formula in zip(line.pdf_character, is_formula_tags, strict=False):
            tagged_chars.append((char, is_formula))

        return tagged_chars, first_is_bullet

    def _group_classified_characters(
        self,
        tagged_chars: list[tuple[PdfCharacter, bool]],
    ) -> list[PdfParagraphComposition]:
        """
        Phase 2: Group consecutive characters with the same tag into new compositions.
        """
        if not tagged_chars:
            return []

        new_compositions = []
        current_chars = []
        current_tag = tagged_chars[0][1]

        for char, is_formula_tag in tagged_chars:
            if is_formula_tag == current_tag:
                current_chars.append(char)
            else:
                new_compositions.append(
                    self.create_composition(current_chars, current_tag),
                )
                current_chars = [char]
                current_tag = is_formula_tag

        if current_chars:
            new_compositions.append(
                self.create_composition(current_chars, current_tag),
            )

        return new_compositions

    def process_page_formulas(self, page: Page):
        if not page.pdf_paragraph:
            return

        page_level_formula_font_ids, xobj_specific_formula_font_ids = (
            collect_page_formula_font_ids(
                page, self.translation_config.formular_font_pattern
            )
        )

        for paragraph in page.pdf_paragraph:
            if not paragraph.pdf_paragraph_composition:
                continue

            current_formula_font_ids: set[int]
            if (
                paragraph.xobj_id
                and paragraph.xobj_id in xobj_specific_formula_font_ids
            ):
                current_formula_font_ids = xobj_specific_formula_font_ids[
                    paragraph.xobj_id
                ]
            else:
                current_formula_font_ids = page_level_formula_font_ids

            new_paragraph_compositions = []
            # This flag is carried through all compositions in a paragraph, as in the original implementation.
            first_is_bullet = False

            for composition in paragraph.pdf_paragraph_composition:
                (
                    tagged_chars,
                    first_is_bullet,
                ) = self._classify_characters_in_composition(
                    composition,
                    current_formula_font_ids,
                    first_is_bullet,
                )

                if not tagged_chars:
                    new_paragraph_compositions.append(composition)
                    continue

                grouped_compositions = self._group_classified_characters(tagged_chars)
                new_paragraph_compositions.extend(grouped_compositions)

            paragraph.pdf_paragraph_composition = new_paragraph_compositions

    def process_translatable_formulas(self, page: Page):
        """将需要正常翻译的公式（如纯数字、数字加逗号等）转换为普通文本行"""
        if not page.pdf_paragraph:
            return

        for paragraph in page.pdf_paragraph:
            if not paragraph.pdf_paragraph_composition:
                continue

            new_compositions = []
            for composition in paragraph.pdf_paragraph_composition:
                if composition.pdf_formula is not None and self.is_translatable_formula(
                    composition.pdf_formula,
                ):
                    # 将可翻译公式转换为普通文本行
                    new_line = PdfLine(
                        pdf_character=composition.pdf_formula.pdf_character,
                    )
                    self.update_line_data(new_line)
                    new_compositions.append(PdfParagraphComposition(pdf_line=new_line))
                else:
                    new_compositions.append(composition)

            paragraph.pdf_paragraph_composition = new_compositions

    def process_page_styles(self, page: Page):
        """处理页面中的文本样式，识别相同样式的文本"""
        if not page.pdf_paragraph:
            return

        for paragraph in page.pdf_paragraph:
            if not paragraph.pdf_paragraph_composition:
                continue

            # 计算基准样式（除公式外所有文字样式的交集）
            base_style = self._calculate_base_style(paragraph)
            paragraph.pdf_style = base_style

            # 重新组织段落中的文本，将相同样式的文本组合在一起
            new_compositions = []
            current_chars = []
            current_style = None

            for comp in paragraph.pdf_paragraph_composition:
                if comp.pdf_formula is not None:
                    if current_chars:
                        new_comp = self._create_same_style_composition(
                            current_chars,
                            current_style,
                        )
                        new_compositions.append(new_comp)
                        current_chars = []
                    new_compositions.append(comp)
                    continue

                if not comp.pdf_line:
                    new_compositions.append(comp)
                    continue

                for char in comp.pdf_line.pdf_character:
                    char_style = char.pdf_style
                    if current_style is None:
                        current_style = char_style
                        current_chars.append(char)
                    elif is_same_style(char_style, current_style):
                        current_chars.append(char)
                    else:
                        if current_chars:
                            new_comp = self._create_same_style_composition(
                                current_chars,
                                current_style,
                            )
                            new_compositions.append(new_comp)
                        current_chars = [char]
                        current_style = char_style

            if current_chars:
                new_comp = self._create_same_style_composition(
                    current_chars,
                    current_style,
                )
                new_compositions.append(new_comp)

            paragraph.pdf_paragraph_composition = new_compositions

    def _calculate_base_style(self, paragraph) -> PdfStyle:
        """计算段落的基准样式（除公式外所有文字样式的交集）"""
        styles = []
        for comp in paragraph.pdf_paragraph_composition:
            if isinstance(comp, PdfFormula):
                continue
            if not comp.pdf_line:
                continue
            for char in comp.pdf_line.pdf_character:
                styles.append(char.pdf_style)

        if not styles:
            return None

        # 返回所有样式的交集
        base_style = styles[0]
        for style in styles[1:]:
            # 更新基准样式为所有样式的交集
            base_style = self._merge_styles(base_style, style)

        # 如果 font_id 或 font_size 为 None，则使用众数
        if base_style.font_id is None:
            base_style.font_id = self._get_mode_value([s.font_id for s in styles])
        if base_style.font_size is None:
            base_style.font_size = self._get_mode_value([s.font_size for s in styles])

        return base_style

    def _get_mode_value(self, values):
        """计算列表中的众数"""
        if not values:
            return None
        from collections import Counter

        counter = Counter(values)
        return counter.most_common(1)[0][0]

    def _merge_styles(self, style1, style2):
        """合并两个样式，返回它们的交集"""
        if style1 is None or style1.font_size is None:
            return style2
        if style2 is None or style2.font_size is None:
            return style1

        return PdfStyle(
            font_id=style1.font_id if style1.font_id == style2.font_id else None,
            font_size=(
                style1.font_size
                if math.fabs(style1.font_size - style2.font_size) < 0.02
                else None
            ),
            graphic_state=self._merge_graphic_states(
                style1.graphic_state,
                style2.graphic_state,
            ),
        )

    def _merge_graphic_states(self, state1, state2):
        """合并两个 GraphicState，返回它们的交集"""
        if state1 is None:
            return state2
        if state2 is None:
            return state1

        return GraphicState(
            linewidth=(
                state1.linewidth if state1.linewidth == state2.linewidth else None
            ),
            dash=state1.dash if state1.dash == state2.dash else None,
            flatness=state1.flatness if state1.flatness == state2.flatness else None,
            intent=state1.intent if state1.intent == state2.intent else None,
            linecap=state1.linecap if state1.linecap == state2.linecap else None,
            linejoin=state1.linejoin if state1.linejoin == state2.linejoin else None,
            miterlimit=(
                state1.miterlimit if state1.miterlimit == state2.miterlimit else None
            ),
            ncolor=state1.ncolor if state1.ncolor == state2.ncolor else None,
            scolor=state1.scolor if state1.scolor == state2.scolor else None,
            stroking_color_space_name=(
                state1.stroking_color_space_name
                if state1.stroking_color_space_name == state2.stroking_color_space_name
                else None
            ),
            non_stroking_color_space_name=(
                state1.non_stroking_color_space_name
                if state1.non_stroking_color_space_name
                == state2.non_stroking_color_space_name
                else None
            ),
            passthrough_per_char_instruction=(
                state1.passthrough_per_char_instruction
                if state1.passthrough_per_char_instruction
                == state2.passthrough_per_char_instruction
                else None
            ),
        )

    def _create_same_style_composition(
        self,
        chars: list[PdfCharacter],
        style,
    ) -> PdfParagraphComposition:
        """创建具有相同样式的文本组合"""
        if not chars:
            return None

        # 计算边界框
        min_x = min(char.visual_bbox.box.x for char in chars)
        min_y = min(char.visual_bbox.box.y for char in chars)
        max_x = max(char.visual_bbox.box.x2 for char in chars)
        max_y = max(char.visual_bbox.box.y2 for char in chars)
        box = Box(min_x, min_y, max_x, max_y)

        return PdfParagraphComposition(
            pdf_same_style_characters=PdfSameStyleCharacters(
                box=box,
                pdf_style=style,
                pdf_character=chars,
            ),
        )

    def process_page_offsets(self, page: Page):
        """计算公式的 x 和 y 偏移量"""
        if not page.pdf_paragraph:
            return

        for paragraph in page.pdf_paragraph:
            if paragraph.debug_id is None:
                continue
            if not paragraph.pdf_paragraph_composition:
                continue

            # 计算该段落的行间距，用其 80% 作为容差
            # line_spacing = self.calculate_line_spacing(paragraph)
            # y_tolerance = line_spacing * 0.8

            for i, composition in enumerate(paragraph.pdf_paragraph_composition):
                if not composition.pdf_formula:
                    continue

                formula = composition.pdf_formula
                left_char = None
                right_char = None

                left_iou = 0
                right_iou = 0

                # 查找左边最近的同一行的文本
                for j in range(i - 1, -1, -1):
                    comp = paragraph.pdf_paragraph_composition[j]
                    if comp.pdf_line:
                        for char in reversed(comp.pdf_line.pdf_character):
                            if not char.pdf_character_id:
                                continue
                            # 检查 y 坐标是否接近，判断是否在同一行
                            left_iou = calculate_y_iou_for_boxes(char.box, formula.box)
                            if left_iou > 0.6:
                                left_char = char
                                break
                    break

                # 查找右边最近的同一行的文本
                for j in range(i + 1, len(paragraph.pdf_paragraph_composition)):
                    comp = paragraph.pdf_paragraph_composition[j]
                    if comp.pdf_line:
                        for char in comp.pdf_line.pdf_character:
                            if not char.pdf_character_id:
                                continue
                            # 检查 y 坐标是否接近，判断是否在同一行
                            right_iou = calculate_y_iou_for_boxes(char.box, formula.box)
                            if right_iou > 0.6:
                                right_char = char
                                break
                    break

                # If both text segments exist, keep the one with higher IOU
                if left_char and right_char:
                    if left_iou < right_iou:
                        left_char = None
                    elif right_iou < left_iou:
                        right_char = None
                    # If IOUs are equal, keep both

                # 计算 x 偏移量（相对于左边文本）
                if left_char:
                    formula.x_offset = formula.box.x - left_char.box.x2
                else:
                    formula.x_offset = 0  # 如果左边没有文字，x_offset 应该为 0
                if abs(formula.x_offset) < 0.1:
                    formula.x_offset = 0
                if formula.x_offset > 10:
                    formula.x_offset = 0
                # if formula.x_offset > 0:
                #     formula.x_offset = 0
                if formula.x_offset < -5:
                    formula.x_offset = 0

                # 计算 y 偏移量
                if left_char:
                    # 使用底部坐标计算偏移量
                    formula.y_offset = formula.box.y - left_char.box.y
                elif right_char:
                    formula.y_offset = formula.box.y - right_char.box.y
                else:
                    formula.y_offset = 0

                if abs(formula.y_offset) < 0.1:
                    formula.y_offset = 0

                if max(abs(formula.y_offset), abs(formula.x_offset)) > 10:
                    pass
                    # logging.debug(
                    #     f"公式 {formula.box} 的偏移量过大：{formula.x_offset}, {formula.y_offset}"
                    # )

    def calculate_line_spacing(self, paragraph) -> float:
        """计算段落中的平均行间距"""
        if not paragraph.pdf_paragraph_composition:
            return 0.0

        # 收集所有文本行的 y 坐标
        line_y_positions = []
        for comp in paragraph.pdf_paragraph_composition:
            if comp.pdf_line:
                line_y_positions.append(comp.pdf_line.box.y)

        if len(line_y_positions) < 2:
            return 10.0  # 如果只有一行或没有行，返回一个默认值

        # 计算相邻行之间的 y 差值
        line_spacings = []
        for i in range(len(line_y_positions) - 1):
            spacing = abs(line_y_positions[i] - line_y_positions[i + 1])
            if spacing > 0:  # 忽略重叠的行
                line_spacings.append(spacing)

        if not line_spacings:
            return 10.0  # 如果没有有效的行间距，返回默认值

        # 使用中位数来避免异常值的影响
        median_spacing = sorted(line_spacings)[len(line_spacings) // 2]
        return median_spacing

    def create_composition(
        self,
        chars: list[PdfCharacter],
        is_formula: bool,
    ) -> PdfParagraphComposition:
        if is_formula:
            formula = PdfFormula(pdf_character=chars)
            self.update_formula_data(formula)
            return PdfParagraphComposition(pdf_formula=formula)
        else:
            new_line = PdfLine(pdf_character=chars)
            self.update_line_data(new_line)
            return PdfParagraphComposition(pdf_line=new_line)

    def is_translatable_formula(self, formula: PdfFormula) -> bool:
        """判断公式是否只包含需要正常翻译的字符（数字、空格和英文逗号）"""
        if all(char.formula_layout_id for char in formula.pdf_character):
            return False

        text = "".join(char.char_unicode for char in formula.pdf_character)
        if formula.y_offset > 0.1:
            return False
        return bool(re.match(r"^[0-9, .]+$", text))

    def should_split_formula(self, formula: PdfFormula) -> bool:
        """判断公式是否需要按逗号拆分（包含逗号且有其他特殊符号）"""

        if all(x.formula_layout_id for x in formula.pdf_character):
            return False

        text = "".join(char.char_unicode for char in formula.pdf_character)
        # 必须包含逗号
        if "," not in text:
            return False
        # 检查是否包含除了数字和 [] 之外的其他符号
        text_without_basic = re.sub(r"[0-9\[\],\s]", "", text)
        return bool(text_without_basic)

    def split_formula_by_comma(
        self,
        formula: PdfFormula,
    ) -> list[tuple[list[PdfCharacter], PdfCharacter]]:
        """按逗号拆分公式字符，返回 (字符组，逗号字符) 的列表，最后一组的逗号字符为 None。
        只有不在括号内的逗号才会被用作分隔符。支持的括号对包括：
        - (cid:8) 和 (cid:9)
        - ( 和 )
        - (cid:16) 和 (cid:17)
        """
        result = []
        current_chars = []
        bracket_level = 0  # 跟踪括号的层数

        for char in formula.pdf_character:
            # 检查是否是左括号
            if char.char_unicode in LEFT_BRACKET:
                bracket_level += 1
                current_chars.append(char)
            # 检查是否是右括号
            elif char.char_unicode in RIGHT_BRACKET:
                bracket_level = max(0, bracket_level - 1)  # 防止括号不匹配的情况
                current_chars.append(char)
            # 检查是否是逗号，且不在括号内
            elif char.char_unicode == "," and bracket_level == 0:
                if current_chars:
                    result.append((current_chars, char))
                    current_chars = []
            else:
                current_chars.append(char)

        if current_chars:
            result.append((current_chars, None))  # 最后一组没有逗号

        return result

    def merge_formulas(self, formula1: PdfFormula, formula2: PdfFormula) -> PdfFormula:
        """合并两个公式，保持字符的相对位置"""
        # 合并所有字符
        all_chars = formula1.pdf_character + formula2.pdf_character
        # 按 y 坐标和 x 坐标排序，确保字符顺序正确
        # sorted_chars = sorted(
        #     all_chars, key=lambda c: (c.visual_bbox.box.y, c.visual_bbox.box.x))

        merged_formula = PdfFormula(pdf_character=all_chars)
        self.update_formula_data(merged_formula)
        return merged_formula

    def is_x_axis_contained(self, box1: Box, box2: Box) -> bool:
        """判断 box1 的 x 轴是否完全包含在 box2 的 x 轴内，或反之"""
        return (box1.x >= box2.x and box1.x2 <= box2.x2) or (
            box2.x >= box1.x and box2.x2 <= box1.x2
        )

    def has_y_intersection(self, box1: Box, box2: Box) -> bool:
        """判断两个 box 的 y 轴是否有交集"""
        tolerance = 1.0
        return not (box1.y2 < box2.y - tolerance or box2.y2 < box1.y - tolerance)

    def is_x_axis_adjacent(self, box1: Box, box2: Box, tolerance: float = 2.0) -> bool:
        """判断两个 box 在 x 轴上是否相邻或有交集"""
        # 检查是否有交集
        has_intersection = not (box1.x2 < box2.x or box2.x2 < box1.x)

        # 检查 box1 是否在 box2 左边且相邻
        left_adjacent = abs(box1.x2 - box2.x) <= tolerance
        # 检查 box2 是否在 box1 左边且相邻
        right_adjacent = abs(box2.x2 - box1.x) <= tolerance

        return has_intersection or left_adjacent or right_adjacent

    def calculate_y_iou(self, box1: Box, box2: Box) -> float:
        """计算两个 box 在 y 轴上的 IOU (Intersection over Union)"""
        # 计算交集
        intersection_start = max(box1.y, box2.y)
        intersection_end = min(box1.y2, box2.y2)
        intersection_length = max(0, intersection_end - intersection_start)

        # 计算并集
        box1_height = box1.y2 - box1.y
        box2_height = box2.y2 - box2.y
        union_length = box1_height + box2_height - intersection_length

        # 避免除零错误
        if union_length <= 0:
            return 0.0

        return intersection_length / union_length

    def merge_overlapping_formulas(self, page: Page):
        """
        合并符合以下条件的公式：
        1. x 轴重叠且 y 轴有交集的相邻公式，或者
        2. x 轴相邻且 y 轴 IOU > 0.5 的相邻公式，或者
        3. 所有字符的 layout id 都相同的相邻公式，或者
        4. 任意两个公式的 IOU > 0.8
        角标可能会被识别成单独的公式，需要合并
        """
        if not page.pdf_paragraph:
            return

        for paragraph in page.pdf_paragraph:
            if not paragraph.pdf_paragraph_composition:
                continue

            # 重复执行合并过程，直到没有更多可以合并的公式
            merged = True
            while merged:
                merged = False
                for i in range(len(paragraph.pdf_paragraph_composition)):
                    if merged:
                        break
                    comp1 = paragraph.pdf_paragraph_composition[i]
                    if comp1.pdf_formula is None:
                        continue

                    for j in range(i + 1, len(paragraph.pdf_paragraph_composition)):
                        comp2 = paragraph.pdf_paragraph_composition[j]
                        if comp2.pdf_formula is None:
                            continue

                        formula1 = comp1.pdf_formula
                        formula2 = comp2.pdf_formula

                        # 检查合并条件：
                        # 1. x 轴重叠且 y 轴有交集，或者
                        # 2. x 轴相邻且 y 轴 IOU > 0.5，或者
                        # 3. 所有字符的 layout id 都相同，或者
                        # 4. 任意两个公式的 IOU > 0.8
                        should_merge = (
                            (
                                j == i + 1
                                and (
                                    (
                                        self.is_x_axis_contained(
                                            formula1.box, formula2.box
                                        )
                                        and self.has_y_intersection(
                                            formula1.box, formula2.box
                                        )
                                    )
                                    or (
                                        self.is_x_axis_adjacent(
                                            formula1.box, formula2.box
                                        )
                                        and self.calculate_y_iou(
                                            formula1.box, formula2.box
                                        )
                                        > 0.5
                                    )
                                )
                            )
                            or (self._have_same_layout_ids(formula1, formula2, page))
                            or (
                                calculate_iou_for_boxes(formula1.box, formula2.box)
                                > 0.8
                            )
                            or (
                                calculate_iou_for_boxes(formula2.box, formula1.box)
                                > 0.8
                            )
                        )

                        if should_merge:
                            # 合并公式
                            merged_formula = self.merge_formulas(formula1, formula2)
                            paragraph.pdf_paragraph_composition[i] = (
                                PdfParagraphComposition(
                                    pdf_formula=merged_formula,
                                )
                            )
                            # 删除第二个公式
                            del paragraph.pdf_paragraph_composition[j]
                            merged = True
                            break

    def _have_same_layout_ids(
        self, formula1: PdfFormula, formula2: PdfFormula, page: Page
    ) -> bool:
        """检查两个公式的所有字符是否具有相同的 layout id"""
        # 获取 formula1 中所有字符的 layout id
        formula1_layout_ids = set()
        for char in formula1.pdf_character:
            layout = char.formula_layout_id
            if layout is not None:
                formula1_layout_ids.add(layout)

        # 获取 formula2 中所有字符的 layout id
        formula2_layout_ids = set()
        for char in formula2.pdf_character:
            layout = char.formula_layout_id
            if layout is not None:
                formula2_layout_ids.add(layout)

        # 如果任一公式没有有效的 layout id，则不合并
        if not (len(formula1_layout_ids) == len(formula2_layout_ids) == 1):
            return False

        # 检查两个公式的 layout id 集合是否相同
        return formula1_layout_ids == formula2_layout_ids

    def process_comma_formulas(self, page: Page):
        """处理包含逗号的复杂公式，将其按逗号拆分"""
        if not page.pdf_paragraph:
            return

        for paragraph in page.pdf_paragraph:
            if not paragraph.pdf_paragraph_composition:
                continue

            new_compositions = []
            for composition in paragraph.pdf_paragraph_composition:
                if composition.pdf_formula is not None and self.should_split_formula(
                    composition.pdf_formula,
                ):
                    # 按逗号拆分公式
                    char_groups = self.split_formula_by_comma(composition.pdf_formula)
                    for chars, comma in char_groups:
                        if chars:  # 忽略空组（连续的逗号）
                            formula = PdfFormula(pdf_character=chars)
                            self.update_formula_data(formula)
                            new_compositions.append(
                                PdfParagraphComposition(pdf_formula=formula),
                            )

                            # 如果有逗号，添加为文本行
                            if comma:
                                comma_line = PdfLine(pdf_character=[comma])
                                self.update_line_data(comma_line)
                                new_compositions.append(
                                    PdfParagraphComposition(pdf_line=comma_line),
                                )
                else:
                    new_compositions.append(composition)

            paragraph.pdf_paragraph_composition = new_compositions
