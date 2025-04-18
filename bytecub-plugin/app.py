
from flask import Flask, request, make_response,  jsonify, Blueprint
from flask_cors import CORS
from chat_app import ChatApp
from utils.chatlog import logger
from model.config.chat_exception import ChatException
from model.config.error_info import ErrorInfo
import traceback
from model.data_result import DataResult
from controller.pdf_api import pdf_api

app = ChatApp.create_app()


app.register_blueprint(pdf_api, url_prefix='/pdf')
#白名单 不需要验证token的url
FILTER_URLS = ['/auth/reg', '/auth/login'] 


@app.before_request
def before_request():
    # if request.path in FILTER_URLS:
    #     return
    # if 'text/event-stream' in request.headers.get('Accept', ''):
    #     return

    # token = request.headers.get('token')
    # AuthSecurity.check_token(token=token, request_url=request.path)
    pass
   

@app.teardown_request
def teardown_request(exception=None):
    # AuthSecurity.clear_current_user()
    pass


@app.errorhandler(Exception)
def handle_exception(e):
    # 打印异常信息，或记录异常日志
    tb = traceback.format_exc()
    logger.error(f'An error occurred: {e}\nStack Trace: {tb}')
    # return {'code': ErrorInfo.code_exception_default, 'msg': ErrorInfo.msg_exception_default}
    response = jsonify(
        {'code': ErrorInfo.code_exception_default, 'msg': ErrorInfo.msg_exception_default})
    response.headers.add('Content-Type', 'application/json')
    return response


@app.errorhandler(ChatException)
def handle_exception(e):
    # 打印异常信息，或记录异常日志
    print(f"Exception caught: {e}")
    response = jsonify({'code': e.error_code, 'msg': e.msg})
    response.headers.add('Content-Type', 'application/json')
    return response
