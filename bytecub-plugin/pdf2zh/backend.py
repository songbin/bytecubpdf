from flask import Flask, request, send_file
from celery import Celery, Task
from celery.result import AsyncResult
from pdf2zh import translate_stream
import tqdm
import json
import io
from pdf2zh.doclayout import ModelInstance
from pdf2zh.config import ConfigManager

flask_app = Flask("pdf2zh")
flask_app.config.from_mapping(
    CELERY=dict(
        broker_url=ConfigManager.get("CELERY_BROKER", "redis://127.0.0.1:6379/0"),
        result_backend=ConfigManager.get("CELERY_RESULT", "redis://127.0.0.1:6379/0"),
    )
)


def celery_init_app(app: Flask) -> Celery:
    class FlaskTask(Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app = Celery(app.name)
    celery_app.config_from_object(app.config["CELERY"])
    celery_app.Task = FlaskTask
    celery_app.set_default()
    celery_app.autodiscover_tasks()
    app.extensions["celery"] = celery_app
    return celery_app


celery_app = celery_init_app(flask_app)


@celery_app.task(bind=True)
def translate_task(
    self: Task,
    stream: bytes,
    args: dict,
):
    def progress_bar(t: tqdm.tqdm):
        self.update_state(state="PROGRESS", meta={"n": t.n, "total": t.total})  # noqa
        print(f"Translating {t.n} / {t.total} pages")

    try:
        doc_mono, doc_dual = translate_stream(
            stream,
            callback=progress_bar,
            model=ModelInstance.value,
            **args,
        )
        return doc_mono, doc_dual
    except Exception as e:
        # 捕获异常并更新任务状态为FAILURE
        import traceback
        error_msg = str(e)
        error_trace = traceback.format_exc()
        print(f"Translation task failed: {error_msg}\n{error_trace}")
        # 重新抛出异常,让Celery将任务标记为FAILURE
        raise


@flask_app.route("/v1/translate", methods=["POST"])
def create_translate_tasks():
    file = request.files["file"]
    stream = file.stream.read()
    print(request.form.get("data"))
    args = json.loads(request.form.get("data"))
    task = translate_task.delay(stream, args)
    return {"id": task.id}


@flask_app.route("/v1/translate/<id>", methods=["GET"])
def get_translate_task(id: str):
    result: AsyncResult = celery_app.AsyncResult(id)
    if str(result.state) == "PROGRESS":
        return {"state": str(result.state), "info": result.info}
    elif str(result.state) == "FAILURE":
        # 任务失败,返回错误信息
        error_info = str(result.info) if result.info else "Unknown error"
        return {"state": str(result.state), "error": error_info}, 500
    else:
        return {"state": str(result.state)}


@flask_app.route("/v1/translate/<id>", methods=["DELETE"])
def delete_translate_task(id: str):
    result: AsyncResult = celery_app.AsyncResult(id)
    result.revoke(terminate=True)
    return {"state": str(result.state)}


@flask_app.route("/v1/translate/<id>/<format>")
def get_translate_result(id: str, format: str):
    result = celery_app.AsyncResult(id)
    if not result.ready():
        return {"error": "task not finished"}, 400
    if not result.successful():
        # 任务失败,返回详细的错误信息
        error_info = str(result.info) if result.info else "Unknown error"
        return {"error": f"task failed: {error_info}"}, 400
    doc_mono, doc_dual = result.get()
    to_send = doc_mono if format == "mono" else doc_dual
    return send_file(io.BytesIO(to_send), "application/pdf")


if __name__ == "__main__":
    flask_app.run()
