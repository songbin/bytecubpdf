from ai_enginee.agents.flow_agents.fl_common_agent import FlCommonAgent
from ai_enginee.agents.flow_agents.fl_image_to_md_agent import FlImageToMdAgent
from ai_enginee.agents.agent import Agent
from ai_enginee.models.chat_request import ChatRequest
class ManagerFlowAgent:
    '''配置规划专家列表'''
    def __init__(self):
        pass

    @classmethod
    def get_expert_list_str(cls)->str:
        """
        根据专家列表生成格式化的字符串。

        :return: 格式化后的字符串，包含专家名称、代码和描述
        """
        expert_list = cls.get_expert_list()
        expert_strs = []
        for i, expert in enumerate(expert_list, start=1):
            expert_strs.append(f"{i}. {expert['name']}-专家代码是{expert['code']}，描述：{expert['description']}")
        return "\n".join(expert_strs)
    # 专家列表，每个专家包含编码、名字和描述
    @classmethod
    def get_expert_list(cls):
        """
        获取专家列表，每个专家包含编码、名字和描述。

        :return: 包含专家信息的列表
        """
        agents_list = [
                FlCommonAgent(),
                FlImageToMdAgent(),
            ]
        return [
            {
                "code": agent.code,
                "name": agent.name,
                "description": agent.description,
                "agent": agent
            }
            for agent in agents_list
        ]

    @classmethod
    def get_agent_by_code(cls, expert_code, request:ChatRequest)->Agent:
        """
        根据编码查询对应的agent实体。

        :param code: 专家编码
        :return: 对应的agent实体，如果未找到则返回None
        """
        expert_list = cls.get_expert_list()
        target_agent:Agent = None
        for expert in expert_list:
            if expert["code"] in expert_code:
                target_agent = expert["agent"]
                break
        if target_agent is None:
            target_agent = FlCommonAgent()
         
        target_agent.initialize(request)
        return target_agent
