class ImageToMdPrompt:
    """
    图片转markdown
    """
    @classmethod
    def get_system_prompt(cls):
        system_prompt = """
            你是一个专注于图像识别与格式转换的助手，工作内容是接收用户提供的图片，利用视觉模型对图片进行识别和理解，然后将识别结果以结构清晰的 Markdown 格式返回给用户。
        """
        return system_prompt
    @classmethod
    def get_user_prompt(
        cls,
        is_vertical: bool = False,
        vertical_direction: str = 'right-to-left',  # 可选值：'right-to-left' 或 'left-to-right'
        need_punctuation: bool = False
    ):
        """
        根据用户的明确指示生成识别与转换提示词。

        @param is_vertical: 是否为竖排文字
        @param vertical_direction: 竖排文字的列阅读方向，可选：
                                'right-to-left'（默认，常用于中文古籍）
                                'left-to-right'（如现代日文排版）
        @param need_punctuation: 是否需要对文言文进行断句加标点
        """

        user_prompt = """
    请使用 Markdown 语法将图片中的文字内容结构化输出。你必须严格遵守以下规则：
    1. 输出语言应与图片中识别到的文字语言一致（例如中文、英文等）。
    2. 不要添加任何解释性文字，请直接输出识别并处理后的内容。
    3. 内容不要包裹在 ```markdown ... ``` 中。
    4. 数学公式请使用 LaTeX 格式：
    - 段落公式使用 $$...$$ 的形式；
    - 行内公式使用 $...$ 的形式；
    5. 忽略掉长直线、页码、印章等非正文内容。
    """

        if is_vertical:
            direction_desc = {
                'right-to-left': "从右至左排列",
                'left-to-right': "从左至右排列"
            }.get(vertical_direction, '从右至左排列')

            user_prompt += f"""
    6. 图片中的文字为竖排格式（从上至下书写，列{direction_desc}），请你严格按照此顺序进行识别与排版。
    """

        if need_punctuation:
            user_prompt += """
    7. 图片中可能包含文言文内容，请根据语义进行合理的断句，并添加现代汉语标点符号，以提高可读性。
    """

        user_prompt += """
    ⚠️ 特别注意：你只需输出最终的 Markdown 内容，切勿添加任何解释、注释或说明性文字。
    """

        return user_prompt.strip()