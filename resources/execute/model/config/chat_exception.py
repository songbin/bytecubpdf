class ChatException(Exception):
    def __init__(self, message, error_code=1000):
        super().__init__(message)
        self.error_code = error_code
        self.msg = message

    def __str__(self):
        return f"{self.error_code}: {super().__str__()}"
