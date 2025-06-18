class TranslateProcessState:
    READY = 'ready'
    WORKING = 'working'
    FINISH = 'finish'
    ERROR = 'error'

class FilePage:
    def __init__(self, page: int, text: str):
        self.page = page
        self.text = text
        