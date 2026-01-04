class ScannedPDFError(Exception):
    def __init__(self, message):
        super().__init__(message)


class ExtractTextError(Exception):
    def __init__(self, message):
        super().__init__(message)


class InputFileGeneratedByBabelDOCError(Exception):
    def __init__(self, message):
        super().__init__(message)


class ContentFilterError(Exception):
    def __init__(self, message):
        super().__init__(message)
        self.message = message
