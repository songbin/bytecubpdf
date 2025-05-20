from fastapi.responses import JSONResponse
from model.config.error_info import ErrorInfo


class DataResult:
    def __init__(self):
        self.status = 200
        self.message = 'success'
        self.data = None

    def to_dict(self):
        return {
            'code': self.status,
            'msg': self.message,
            'data': self.data
        }

    @staticmethod
    def ok(data='success'):
        result = DataResult()
        result.data = data
        return JSONResponse(content=result.to_dict(), status_code=200)

    @staticmethod
    def fail(msg, code=ErrorInfo.code_err_default):
        result = DataResult()
        result.data = None
        result.status = code
        result.message = msg
        return JSONResponse(content=result.to_dict(), status_code=200)

    @staticmethod
    def reply_exception(msg, code=ErrorInfo.code_err_default):
        result = DataResult()
        result.data = msg
        result.status = code
        result.message = msg
        return JSONResponse(content=result.to_dict(), status_code=200)