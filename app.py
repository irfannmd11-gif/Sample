"""Flask application entry point for Workbook Automation Tool."""

from __future__ import annotations

from flask import Flask, jsonify, render_template, request

from config import Settings
from db import DatabaseConfigurationError, OracleDatabase, TaskNotFoundError
from services.pii_service import PIIScanner
from services.workbook_service import WorkbookDownloader, WorkbookError, WorkbookProcessor


def create_app(settings: Settings | None = None) -> Flask:
    settings = settings or Settings.from_environment()
    app = Flask(__name__)
    app.config["SECRET_KEY"] = settings.secret_key
    database = OracleDatabase(settings)
    downloader = WorkbookDownloader(settings)
    processor = WorkbookProcessor()
    pii_scanner = PIIScanner()

    @app.get("/")
    def index():
        return render_template("index.html")

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.post("/scan_pii")
    def scan_pii():
        payload = request.get_json(silent=True) or {}
        prompt = payload.get("prompt", "")
        if not isinstance(prompt, str):
            return jsonify(error="prompt must be a string."), 400
        if len(prompt) > 1_000_000:
            return jsonify(error="prompt must be 1,000,000 characters or fewer."), 413
        return jsonify(pii_scanner.scan(prompt))

    @app.post("/fetch_workbook")
    def fetch_workbook():
        payload = request.get_json(silent=True) or {}
        project_reference = str(payload.get("project_reference", "")).strip()
        task_number = str(payload.get("task_number", "")).strip()
        if not project_reference or not task_number:
            return jsonify(error="project_reference and task_number are required."), 400
        if len(project_reference) > 100 or len(task_number) > 100:
            return jsonify(error="Project reference and task number must be 100 characters or fewer."), 400

        try:
            task = database.get_task(project_reference, task_number)
            workbook_path = downloader.download(task.workbook_url, project_reference, task_number)
            return jsonify(processor.build_payload(workbook_path, task.offer_description))
        except TaskNotFoundError as error:
            return jsonify(error=str(error)), 404
        except (DatabaseConfigurationError, WorkbookError) as error:
            app.logger.warning("Workbook fetch failed: %s", error)
            return jsonify(error=str(error)), 422
        except Exception:
            app.logger.exception("Unexpected workbook fetch failure")
            return jsonify(error="Unable to fetch the workbook. Please contact support if the problem persists."), 500

    return app


if __name__ == "__main__":
    create_app().run(host="127.0.0.1", port=5000, debug=True)
