from datetime import datetime


class TimeUtil():
    def __init__(self):
        pass
    @staticmethod
    def get_yyyymmdd()->str:
        # 获取当前日期时间
        now = datetime.now()
        # 格式化为 yyyymmdd
        formatted_date = now.strftime('%Y%m%d')
        return formatted_date
    @staticmethod
    def get_yyyymmddhhmmss() -> str:
        # 获取当前日期时间
        now = datetime.now()
        # 格式化为 yyyymmddhhmmss
        formatted_date = now.strftime('%Y%m%d%H%M%S')
        return formatted_date
