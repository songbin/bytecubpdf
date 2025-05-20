from ai_enginee.models.chat_request import ChatRequest
from ai_enginee.models.message_img import MessageImg
from ai_enginee.models.message import Message
from ai_enginee.models.llm_res.llm_response import LLMResponse
from ai_enginee.adapter.dynamic_adapter import DynamicAdapter
from typing import AsyncGenerator
from ai_enginee.agents.intent_agent import IntentAgent
from ai_enginee.enums.intent_enum import IntentEnum
from ai_enginee.enums.error_enum import ErrorEnum
from ai_enginee.enums.extend_enum import ExtendEnum
from ai_enginee.agents.manager.manager_flow import ManagerFlowAgent
from ai_enginee.agents.manager.manager_tool import ManagerToolAgent
from ai_enginee.agents.agent import Agent
from ai_enginee.model_util.sse_output import SSEOutput
class PlanAgent:
    '''
    规划agent，用于识别用户意图，进行下一步的规划。
    1.识别用户意图
    3.决定调用哪个agent
    3.决定调用agent(可以串行、可以并行)
    4.给前端返回，当前正在进行什么错误
    5.只有最后一个agent的yield输出给前端
    '''
    def __init__(self, request: ChatRequest, is_stream: bool = False):
        self.request:ChatRequest = request
        self.stream: bool = is_stream
        self.intent_agent:IntentAgent = IntentAgent()
        self.manager_flow_agent:ManagerFlowAgent = ManagerFlowAgent()
    async def sse_execute(self)-> AsyncGenerator[str, None]:
        sseOutput = SSEOutput()
        target_flow_agent: Agent = None
        # 允许指定执行工作流编码
        expert_plan_code: str = self.request.expand_request.get('agent_code') if self.request.expand_request else None
        if expert_plan_code:
            target_flow_agent = self.manager_flow_agent.get_agent_by_code(request=self.request, expert_code=expert_plan_code)
        if not target_flow_agent:
            #第一步：识别用户意图
            msg:str = f"""正在选举合适的规划专家...\n\n"""
            yield sseOutput.thinking_content(msg)
            sseOutput.clean()

            prompt_system,prompt_user_prefix = self.__build_intent_promt(IntentEnum.INTENT_FLOW.code)
            self.intent_agent.initialize(request=self.request,
                                            intent_type=IntentEnum.INTENT_FLOW.code,
                                            prompt_system=prompt_system,
                                            prompt_user_prefix=prompt_user_prefix)
            response:LLMResponse = self.intent_agent.excute()
            if response.code != ErrorEnum.SUCCESS.code:
                msg:str = f'''规划专家选型失败:{response.code} \n'''
                yield sseOutput.answer_content(msg)
                return
            #获取规划专家编码
            expert_plan_code = response.content
            target_flow_agent = self.manager_flow_agent.get_agent_by_code(request=self.request, expert_code=expert_plan_code)
        #第二步，执行规划
        if not target_flow_agent:
            msg:str = f'''规划专家{expert_plan_code}不存在'''
            sseOutput.clean()
            yield sseOutput.answer_content(msg)
            return
        
        # msg:str = f"""规划专家【{target_flow_agent.name}】已经就绪，准备开始进行任务规划...\n\n"""
        # sseOutput.clean()
        # yield sseOutput.thinking_content(msg)

        event_stream = target_flow_agent.sse_execute()
        sseOutput.clean()
        async for chunk in event_stream:
            yield sseOutput.answer_chunk(chunk)

    def execute(self)-> LLMResponse:
        """
        同步执行接口
        """
        target_flow_agent: Agent = None;
        # 允许指定执行工作流编码
        expert_plan_code: str = None
        if self.request.extends:
            expert_plan_code = self.request.expert_plan_code
        # 有明确用户意图
        if expert_plan_code:
            target_flow_agent = self.manager_flow_agent.get_agent_by_code(request=self.request, expert_code=expert_plan_code)
        if not target_flow_agent:
            prompt_system,prompt_user_prefix = self.__build_intent_promt(IntentEnum.INTENT_FLOW.code)
            self.intent_agent.initialize(request=self.request,
                                            intent_type=IntentEnum.INTENT_FLOW.code,
                                            prompt_system=prompt_system,
                                            prompt_user_prefix=prompt_user_prefix)
            response:LLMResponse = self.intent_agent.excute()
            if response.code!= ErrorEnum.SUCCESS.code:
                return response
            #获取规划专家编码
            expert_plan_code = response.content
            target_flow_agent = self.manager_flow_agent.get_agent_by_code(request=self.request, expert_code=expert_plan_code)
        if not target_flow_agent:
            return LLMResponse.from_content_to_json_str(f'''规划专家{expert_plan_code}不存在''')
        res:LLMResponse = target_flow_agent.excute()
        
        return res
 
        
        
        return '通用专家'
    def __build_intent_promt(self, intent_type:str = None):
        """
        构建意图识别的提示词。

        :param intent_type: 意图类型，可选值为'plan'或'tool'
        """
        expert_list_str:str = ''
        expert_number:int = 1
        if intent_type == IntentEnum.INTENT_FLOW.code:
            expert_list_str = ManagerFlowAgent.get_expert_list_str()
            expert_number = len(ManagerFlowAgent.get_expert_list())
        elif intent_type == IntentEnum.INTENT_TOOL.code:
            expert_list_str = ManagerToolAgent.get_expert_list_str()
            expert_number = len(ManagerToolAgent.get_expert_list())
        else:
            expert_list_str = '''
            1. 通用类专家-专家代码是fl_common_agent（当用户的意图无法明确归类到上述三个领域时，使用此专家）
            '''
        promt_system:str = f"""
            你是一个意图识别的专家，你需要根据用户的输入并结合历史对话记录，识别出用户的意图，然后返回给用户。
            返回对象必须是以下专家之一，并且必须包含专家代码：
            {expert_list_str}
            请直接输出这{expert_number}位专家其中一位的专家代码，不要输出其他内容。
        """
        promt_user_prefix:str = f"""
            {promt_system}
            以下是用户输入内容：

        """

        return promt_system, promt_user_prefix

