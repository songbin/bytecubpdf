class LLMResUsage():
    '''
    大模型返回结果的使用量统计
    '''
    def __init__(self, prompt_tokens:int, completion_tokens:int, total_tokens:int):
        self.prompt_tokens = prompt_tokens
        self.completion_tokens = completion_tokens
        self.total_tokens = total_tokens

    def to_dict(self):
        return {
                'prompt_tokens': self.prompt_tokens,
                'completion_tokens': self.completion_tokens,
                'total_tokens': self.total_tokens
        }
    @classmethod
    def from_dict(cls, data:dict):
        return LLMResUsage(
            prompt_tokens=data.get('prompt_tokens', 0),
            completion_tokens=data.get('completion_tokens', 0),
            total_tokens=data.get('total_tokens', 0)
        )