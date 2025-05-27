from ai_enginee.agents.tool_agents.tl_common_agent import TlCommonAgent
from ai_enginee.agents.agent import Agent
from ai_enginee.models.chat_request import ChatRequest
class ManagerToolAgent:
    '''配置规划专家列表'''
    def __init__(self):
        pass

    @classmethod
    def get_expert_list_str(cls):
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
        # health_agent = TlHealthAgent()
        common_agent = TlCommonAgent()
        agents_list = [
            TlCommonAgent()
        ]
        # 假设 PlHealthAgent 类有 code、name 和 description 属性
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
    def get_agent_by_code(cls, request:ChatRequest,expert_code:str)->Agent:
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
            target_agent = TlCommonAgent()
         
        target_agent.initialize(request)
        return target_agent
