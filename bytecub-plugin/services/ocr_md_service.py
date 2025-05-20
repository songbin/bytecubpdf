from config.ts_constants import TSConstants, TSCore,TSStatus,LLM_SUPPORT
from ai_enginee.agents.flow_agents.fl_image_to_md_agent import FlImageToMdAgent
from ai_enginee.agents.entry_agnet import EntryAgent
from ai_enginee.models.chat_request import ChatRequest
from config.ts_constants import TSConstants, TSCore,TSStatus,LLM_SUPPORT,AGENT_EXPAND_KEY,Layout_Direction
class OcrMdService():
    @classmethod
    def ocr_2_md(cls, file_path:str,
        platform:str, model:str, api_key:str, base_url:str, cache_dir:str, thread:int = 4,
        layoutDirection:str = Layout_Direction.left_to_right,
        enabaleSentence:bool = False,
        enableVertical:bool = False,
        enableConvert:bool = False):
        '''
        识别PDF文件中的文字，并将识别结果转换为Markdown格式的文本。
        :param file_path: PDF或者图片文件的路径。
        :param platform: 识别平台，目前只支持 openai ollama LLM_SUPPORT.openai(ollama)两种。
        :param model: 识别模型，例如qvq2.5_vl等,这里只支持视觉模型。
        :param api_key: 平台的API密钥。
        :param base_url: 平台的基础URL。
        :param cache_dir: 缓存目录，用于存储识别结果。
        :param thread: 线程数，默认为4。
        :param layoutDirection: 布局方向，默认为Layout_Direction.left_to_right。
        :param enabaleSentence: 是否启用句子分割，默认为False。
        :param enableVertical: 是否启用垂直布局，默认为False。
        :param enableConvert: 是否启用繁体和简体转换，默认为False。
        :return: 转换后的Markdown文本。
        '''
        chat_request:ChatRequest = ChatRequest()
        entry_agent:EntryAgent = EntryAgent()
        chat_request = cls().build_chat_request(file_path, platform, model, api_key, base_url, cache_dir, thread,
            layoutDirection, enabaleSentence, enableVertical,enableConvert)
        response:LLMResponse = entry_agent.sse_execute(chat_request)
        return response.content
    @classmethod
    def build_chat_request(cls, file_path:str, platform:str, model:str, 
            api_key:str, base_url:str, cache_dir:str, threads:int = 4,
            layoutDirection:str = Layout_Direction.left_to_right,
            enabaleSentence:bool = False,
            enableVertical:bool = False,
            enableConvert:bool = False):
        '''
        构建ChatRequest对象。
        :param file_path: PDF或者图片文件的路径。
        :param platform: 识别平台，目前只支持 openai ollama LLM_SUPPORT.openai(ollama)两种。
        :param model: 识别模型，例如qvq2.5_vl等,这里只支持视觉模型。
        :param api_key: 平台的API密钥。
        :param base_url: 平台的基础URL。
        :param cache_dir: 缓存目录，用于存储识别结果。
        :param thread: 线程数，默认为4。
        :return: ChatRequest对象。
        '''
        chat_request:ChatRequest = ChatRequest(
            platform=platform,
            model=model,
            api_key=api_key,
            base_url=base_url,
            cache_dir=cache_dir,
            img_url=file_path,
            check_image=False,
            intent_flow=False,
            threads=threads,
            expand_request= {
                "agent_code":FlImageToMdAgent.code,
                AGENT_EXPAND_KEY.file_path:file_path,
                AGENT_EXPAND_KEY.file_type:"pdf" if file_path.endswith(".pdf") else "image",
                AGENT_EXPAND_KEY.layoutDirection:  layoutDirection,
                AGENT_EXPAND_KEY.enabaleSentence: enabaleSentence,
                AGENT_EXPAND_KEY.enableVertical: enableVertical,
                AGENT_EXPAND_KEY.enableConvert: enableConvert
            }
        )
        return chat_request
         