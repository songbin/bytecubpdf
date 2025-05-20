from ai_enginee.agents.agent import Agent
from typing import AsyncGenerator, Union
from ai_enginee.models.llm_res.llm_response import LLMResponse
from ai_enginee.models.chat_request import ChatRequest
from ai_enginee.enums.intent_enum import IntentEnum
from ai_enginee.model_util.model_response_format_util import ModelResponseFormatUtil
from ai_enginee.model_util.sse_output import SSEOutput
from ai_enginee.enums.flow_enum import FlowEnum
from ai_enginee.agents.tool_agents.tl_common_agent import TlCommonAgent
from ai_enginee.agents.prompt.image_to_md_prompt import ImageToMdPrompt
from ai_enginee.agents.tool_agents.tl_image_to_md_agent import TlImageToMdAgent

class FlImageToMdAgent(Agent):
    """
    图片转markdown格式
    """
    name = '图片转markdown格式'
    description = '图片转markdown格式'
    code = FlowEnum.IMAGE_TO_MD.code
    intent_type = IntentEnum.INTENT_FLOW.code
    system_prompt = """
        你是一个专注于图像识别与格式转换的助手，工作内容是接收用户提供的图片，利用视觉模型对图片进行识别和理解，然后将识别结果以结构清晰的 Markdown 格式返回给用户。
    """
    user_prompt = system_prompt
    
    def __init__(self, request: ChatRequest = None):
        super().__init__(request)

    async def sse_execute(self)-> AsyncGenerator[str, None]:
        """
        sse方式返回
        :return: 返回一个生成器，生成智能体的决策和环境的当前状态。
        """
        # step1: 图片分析
        tool_agent:TlImageToMdAgent = TlImageToMdAgent(request = self.request)
        sseOutput = SSEOutput()
        async for chunk in tool_agent.sse_execute():
            yield sseOutput.answer_chunk(chunk)
        sseOutput.clean()
        


    def excute(self)-> LLMResponse:
        """
        同步接口
        :return: 同步结果 LLMResponse
        """
        return super().ask_llm(is_stream=False, is_replace=True, 
                prompt_system=ImageToMdPrompt.get_system_prompt(), 
                prompt_user_prefix=ImageToMdPrompt.get_user_prompt())
