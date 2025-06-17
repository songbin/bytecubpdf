class ErrorInfo:

    msg_token_invalid: str = 'login expired'
    msg_err_default: str = 'something exception, please try later'
    msg_exception_default: str = 'something exception, please try later'
    msg_file_limit: str = 'Allow a maximum file size of 10MB for uploads'
    msg_verify_pdf: str = '校验pdf可能是扫描版'

    code_err_default:int = 20001
    code_exception_default:int = 20002
    code_token_invalid: int = 40001
    code_file_limit: int = 4002
    code_verify_pdf: int = 4003

    def __init__(self):
        pass
