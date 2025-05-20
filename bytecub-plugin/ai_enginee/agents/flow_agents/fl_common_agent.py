from ai_enginee.agents.agent import Agent
from typing import AsyncGenerator, Union
from ai_enginee.models.llm_res.llm_response import LLMResponse
from ai_enginee.models.chat_request import ChatRequest
from ai_enginee.enums.intent_enum import IntentEnum
from ai_enginee.model_util.model_response_format_util import ModelResponseFormatUtil
from ai_enginee.model_util.sse_output import SSEOutput
class FlCommonAgent(Agent):
    """
    通用类专家
    """
    name = '通用规划专家'
    description = '通用类专家，用于处理用户的通用类任务'
    code = 'fl_common_agent'
    intent_type = IntentEnum.INTENT_FLOW.code
    system_prompt = """
        你是一个通用类规划的专家，你需要根据用户的输入并结合历史对话记录，规划出用户的下一步行动，然后返回给用户。
    """
    user_prompt = system_prompt
    
    def __init__(self, request: ChatRequest = None):
        super().__init__(request)

    async def sse_execute(self)-> AsyncGenerator[str, None]:
        """
        sse方式返回
        :return: 返回一个生成器，生成智能体的决策和环境的当前状态。
        """
        sseOutput = SSEOutput()
        async for chunk in super().ask_llm(is_stream=True, prompt_system=self.system_prompt, prompt_user_prefix=self.user_prompt):
            yield sseOutput.answer_chunk(chunk)
        


    def excute(self)-> LLMResponse:
        """
        同步接口
        :return: 同步结果 LLMResponse
        """
        return super().ask_llm(is_stream=False, prompt_system=self.system_prompt, prompt_user_prefix=self.user_prompt)
