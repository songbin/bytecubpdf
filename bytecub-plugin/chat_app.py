from flask import Flask 
import os

from flask_cors import CORS

class ChatApp():
    @staticmethod
    def create_app():
        app = Flask(__name__)
         # 启用 CORS，允许所有域名访问
        CORS(app)
        return app
    
