'''
这里只是大模型错误码收集，不能用户其他任何地方
'''
ERROR_CODES = {
    'length': '输出长度达到了模型上下文长度限制，或达到了 max_tokens 的限制。',
    'content_filter': '输出内容因触发过滤策略而被过滤。',
    'insufficient_system_resource': '系统推理资源不足，生成被打断。',
    'stream_error': '流式响应生成过程中发生意外错误'
}