import os
import sys
import socket
import psutil
import subprocess
from pdf2zh.doclayout import ModelInstance, OnnxModel
os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'
from dotenv import dotenv_values
from app import app

def load_env_file(env_file):
    """加载指定的 .env 文件，并返回环境变量字典"""
    return dotenv_values(env_file)

def check_port_available(port):
    """检查端口是否可用（不实际绑定）"""
    # 优先使用 psutil 检查（跨平台兼容）
    for conn in psutil.net_connections():
        if conn.status == psutil.CONN_LISTEN and conn.laddr.port == port:
            try:
                process = psutil.Process(conn.pid)
                return False, {
                    'pid': conn.pid,
                    'name': process.name(),
                    'username': process.username(),
                    'cmdline': ' '.join(process.cmdline())
                }
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                return False, {'pid': conn.pid, 'name': '未知进程'}
    
    # 备用检查（防止 psutil 漏检）
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            s.bind(('0.0.0.0', port))
            return True, None
        except socket.error:
            return False, {'pid': '未知进程'}

def terminate_process(pid):
    """跨平台终止进程"""
    try:
        if os.name == 'nt':
            subprocess.run(['taskkill', '/F', '/PID', str(pid)], check=True)
        else:
            subprocess.run(['kill', '-9', str(pid)], check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"终止失败: {e}")
        return False
    except Exception as e:
        print(f"未知错误: {e}")
        return False

def setup() -> int:
    os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'
    ModelInstance.value = OnnxModel.load_available()
    return 0

if __name__ == "__main__":
    port = 8089
    # available, process_info = check_port_available(port)
    
    # if not available:
    #     print(f"端口 {port} 被占用，无法启动服务！")
    #     if process_info.get('pid'):
    #         print(f"冲突进程信息：")
    #         print(f"  PID: {process_info['pid']}")
    #         print(f"  进程名: {process_info.get('name', '未知进程')}")
    #         print(f"  用户: {process_info.get('username', '未知用户')}")
    #         print(f"  启动命令: {process_info.get('cmdline', '无法获取命令行参数')}")
            
    #         confirm = input("\n是否立即终止该进程？(y/N): ").strip().lower()
    #         if confirm == 'y':
    #             print("正在终止进程...")
    #             if terminate_process(process_info['pid']):
    #                 # 等待端口释放（最多等待5秒）
    #                 for _ in range(5):
    #                     available, _ = check_port_available(port)
    #                     if available:
    #                         break
    #                     print("等待端口释放...")
    #                     import time
    #                     time.sleep(1)
    #                 else:
    #                     print("端口释放超时，请手动处理")
    #                     sys.exit(1)
    #             else:
    #                 print("自动终止失败，请手动执行：")
    #                 if os.name == 'nt':
    #                     print(f"  Windows: taskkill /F /PID {process_info['pid']}")
    #                 else:
    #                     print(f"  Linux/macOS: kill -9 {process_info['pid']}")
    #                 sys.exit(1)
    #         else:
    #             print("取消操作，请手动处理端口占用后重试")
    #             sys.exit(1)
    #     else:
    #         print("无法获取进程详细信息，请手动检查端口占用")
    #         sys.exit(1)
    
    # 正常启动服务
    try:
        setup()
        app.run(host='0.0.0.0', port=port, debug=True)
    except Exception as e:
        print(f"服务启动失败: {str(e)}")
        sys.exit(1)