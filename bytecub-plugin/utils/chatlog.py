from math import log
import os
import time
import logging
import traceback
from logging.handlers import RotatingFileHandler
import types
from config.ts_constants import TSConstants
import sys
import io

# 在日志目录定义后添加编码强制设置
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
class CustomRotatingFileHandler(RotatingFileHandler):
        def doRollover(self):
            """
            重写 doRollover 方法，在轮转时添加日期到备份文件名中。
            """
            if self.stream:
                self.stream.close()
                self.stream = None

            # 当前时间
            current_time = time.strftime("%Y-%m-%d", time.localtime())

            # 构造新的备份文件名
            base_name, ext = os.path.splitext(self.baseFilename)
            new_filename = f"{base_name}.{current_time}{ext}"

            # 如果目标文件已存在，则追加编号
            index = 1
            while os.path.exists(new_filename):
                new_filename = f"{base_name}.{current_time}.{index}{ext}"
                index += 1

            # 重命名当前日志文件为备份文件
            if os.path.exists(self.baseFilename):
                os.rename(self.baseFilename, new_filename)

            # 打开新日志文件
            if not self.delay:
                self.stream = self._open()




# 定义日志目录
# log_dir = os.getenv("LOG_PATH",TSConstants.log_file_path)
log_dir = os.getenv("LOG_PATH",TSConstants.log_file_path)
# 确保日志目录存在
os.makedirs(log_dir, exist_ok=True)
# 日志文件名前缀,可修改
LOG_PREFIX = os.getenv('LOG_PREFIX','bytecub')
# 公共配置,可修改
LOG_CONFIG = {
    "maxBytes": int(os.getenv("LOG_CONFIG_MAXBYTES","3145728")),  # 单个文件最大 3MB
    "backupCount": int(os.getenv("LOG_BACKUP_COUNT", 10)),              # 保留 10 个备份
}

# 从环境变量中获取日志级别，默认为 INFO
GLOBAL_LOG_LEVEL = os.getenv("GLOBAL_LOG_LEVEL", "INFO").upper()  # 转换为大写
CONSOLE_LOG_LEVEL = os.getenv("CONSOLE_LOG_LEVEL", "INFO").upper()  # 控制台日志级别

# 创建一个格式化器
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(pathname)s:%(lineno)d - %(message)s')

# 动态生成日志文件名（用于初始日志文件）
def get_log_filename(log_type):
    """
    根据日志类型生成日志文件名。
    :param log_type: 日志类型，例如 'info', 'warn', 'error'
    :return: 日志文件路径
    """
    return os.path.join(
        log_dir,
        f'{LOG_PREFIX}_{log_type}.log'  # 初始日志文件名不带日期
    )

# 配置 INFO 级别日志处理器
filename_info = get_log_filename('info')
handler_info = CustomRotatingFileHandler(
    filename=filename_info,
    maxBytes=LOG_CONFIG["maxBytes"],  
    backupCount=LOG_CONFIG["backupCount"],  
    encoding='utf-8'  # 指定编码格式
)
handler_info.setLevel(logging.INFO)
handler_info.setFormatter(formatter)

# 配置 WARN 级别日志处理器
filename_warn = get_log_filename('warn')
handler_warn = CustomRotatingFileHandler(
    filename=filename_warn,
    maxBytes=LOG_CONFIG["maxBytes"],  
    backupCount=LOG_CONFIG["backupCount"],  
    encoding='utf-8'
)
handler_warn.setLevel(logging.WARN)
handler_warn.setFormatter(formatter)

# 配置 ERROR 级别日志处理器
filename_error = get_log_filename('error')
handler_error = CustomRotatingFileHandler(
    filename=filename_error,
    maxBytes=LOG_CONFIG["maxBytes"],  
    backupCount=LOG_CONFIG["backupCount"], 
    encoding='utf-8'
)
handler_error.setLevel(logging.ERROR)
handler_error.setFormatter(formatter)

# 自定义 PrintHandler 用于同时打印到控制台
class PrintHandler(logging.Handler):
    def emit(self, record):
        try:
            msg = self.format(record) + '\n'
            # 直接操作缓冲区避免二次编码
            sys.stdout.buffer.write(msg.encode('utf-8', errors='xmlcharrefreplace'))
            sys.stdout.flush()
        except Exception as e:
            print(f"[ERROR] 日志输出失败: {str(e)}")

# 创建并添加 PrintHandler
print_handler = PrintHandler()
print_handler.setLevel(logging.INFO)
print_handler.setFormatter(formatter)

# 配置根日志记录器（捕获所有默认日志）
root_logger = logging.getLogger()  # 获取根日志记录器
root_logger.setLevel(GLOBAL_LOG_LEVEL)  # 设置全局日志级别为 DEBUG

# 将处理器添加到根日志记录器
root_logger.addHandler(handler_info)
root_logger.addHandler(handler_warn)
root_logger.addHandler(handler_error)
root_logger.addHandler(print_handler)

# 创建自定义日志记录器
logger = logging.getLogger('my_logger')
logger.setLevel(CONSOLE_LOG_LEVEL)
# 提升 watchfiles 的日志级别
logging.getLogger("watchfiles").setLevel(logging.WARNING)

# 防止日志传播到根日志记录器（避免重复日志）
logger.propagate = False

# 将处理器添加到自定义日志记录器
logger.addHandler(handler_info)
logger.addHandler(handler_warn)
logger.addHandler(handler_error)
logger.addHandler(print_handler)

# 自定义扩展方法
def warning_ext(self, msg):
    if self.isEnabledFor(logging.WARN):
        stack_trace = traceback.format_exc()
        self.warning(f"{msg}\nStack Trace:\n{stack_trace}")

def error_ext(self, msg):
    if self.isEnabledFor(logging.ERROR):
        stack_trace = traceback.format_exc()
        self.error(f"{msg}\nStack Trace:\n{stack_trace}")

def info_ext(self, msg, extra=None):
    if self.isEnabledFor(logging.INFO):
        if extra:
            msg = f"{msg} | Extra Info: {extra}"
        self.info(msg)

# 动态绑定方法到 logger 实例
logger.warning_ext = types.MethodType(warning_ext, logger)
logger.error_ext = types.MethodType(error_ext, logger)
logger.info_ext = types.MethodType(info_ext, logger)



 