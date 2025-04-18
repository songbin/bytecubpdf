from flask import jsonify
from model.config.error_info import ErrorInfo
# res.send({ status: 'Fail', message: error.message, data: null })
class DataResult():
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
        response = jsonify(result.to_dict())
        # response.status_code = 200
        # response.headers.add('Content-Type', 'application/json')
        return response
    @staticmethod
    def fail(msg, code=ErrorInfo.code_err_default):
        result = DataResult()
        result.data = None
        result.status = code
        result.message = msg
        response = jsonify(result.to_dict())
        response.status_code = 200
        response.headers.add('Content-Type', 'application/json')
        return response

    @staticmethod
    def reply_exception(msg, code=ErrorInfo.code_err_default):
        result = DataResult()
        result.data = None
        result.status = code
        result.message = msg
        result.data = msg
        response = jsonify(result.to_dict())
        response.status_code = 200
        response.headers.add('Content-Type', 'application/json')
        return response
