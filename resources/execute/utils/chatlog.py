import logging
from logging.handlers import RotatingFileHandler
import time
import os
import sys
import io
import traceback

# 检查日志文件夹是否存在，不存在则新建
log_dir = 'logs'
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# 创建一个日志记录器并命名
logger = logging.getLogger('my_logger')
logger.setLevel(logging.INFO)

# 创建一个文件处理器，并指定日志文件的名称和日志级别（INFO 级别）
filename_info = 'chatlog_info_' + time.strftime('%Y-%m-%d', time.localtime()) + '.log'
filename_info = os.path.join(log_dir, filename_info)
handler_info = RotatingFileHandler(filename=filename_info, maxBytes=100*1024*1024, backupCount=10, encoding='utf-8')
handler_info.setLevel(logging.INFO)

# 创建一个文件处理器，并指定日志文件的名称和日志级别（WARN 级别）
filename_warn = 'chatlog_warn_' + time.strftime('%Y-%m-%d', time.localtime()) + '.log'
filename_warn = os.path.join(log_dir, filename_warn)
handler_warn = RotatingFileHandler(filename=filename_warn, maxBytes=100*1024*1024, backupCount=10, encoding='utf-8')
handler_warn.setLevel(logging.WARN)

# 创建一个格式化器，并添加到处理器中
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(pathname)s:%(lineno)d - %(message)s')
handler_info.setFormatter(formatter)
handler_warn.setFormatter(formatter)

# 将处理器添加到日志记录器中
logger.addHandler(handler_info)
logger.addHandler(handler_warn)

# 自定义 PrintHandler 用于同时打印到控制台
class PrintHandler(logging.Handler):
    def emit(self, record):
        msg = self.format(record)
        print(msg)  # 使用 print 输出日志

# 创建并添加 PrintHandler
print_handler = PrintHandler()
print_handler.setLevel(logging.INFO)
print_handler.setFormatter(formatter)
logger.addHandler(print_handler)

# 配置 httpx._client 和 Flask 的日志级别为 WARN
logging.getLogger('httpx._client').setLevel(logging.WARN)
logging.getLogger('werkzeug').setLevel(logging.WARN)

# 自定义 warn_ext 和 error_ext 方法，强制打印堆栈信息
def warning_ext(msg):
    if logger.isEnabledFor(logging.WARN):
        stack_trace = traceback.format_exc()
        logger.warning(f"{msg}\nStack Trace:\n{stack_trace}")

def error_ext(msg):
    if logger.isEnabledFor(logging.ERROR):
        stack_trace = traceback.format_exc()
        logger.error(f"{msg}\nStack Trace:\n{stack_trace}")

# 将自定义方法绑定到 logger 上
logger.warning_ext = warning_ext
logger.error_ext = error_ext