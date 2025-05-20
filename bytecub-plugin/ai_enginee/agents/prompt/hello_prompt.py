class HelloPrompt:
    prompt_system = """你是一名无所不能的专家"""
    
    @classmethod
    def get_user_prompt(cls, input: str) -> str:
        return f"""
            你猜用户想干什么：
            {input}
        """