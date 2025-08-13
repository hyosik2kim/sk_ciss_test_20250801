import os
from flask import Blueprint, request, jsonify

from SCARAnalyzer import SCARAnalyzer
from SCARCategorizer import SCARCategorizer
from SCARSummarizer import SCARSummarizer
from SCARCommon import Config, LogList, Analyzed, setLogPath, getLogFiles
from monitoring_service import (
    get_charging_page_data,
    get_errors,
    get_overall_error_statistics,
    get_charging_sessions,
)

analysis_bp = Blueprint("analysis", __name__)

# Initialize class instances
analyzer = SCARAnalyzer()
categorizer = SCARCategorizer()
summarizer = SCARSummarizer()


# Callback setup

def on_analyze_completed(src, completed):
    print(f"[분석 완료] {src} → {completed}")


analyzer.set_analyze_completed_callback(on_analyze_completed)


@analysis_bp.route("/select_folder", methods=["POST"])
def select_folder():
    print("📥 호출됨 /select_folder")
    print("📌 request.headers:", dict(request.headers))
    print("📌 request.data:", request.data)

    try:
        data = request.get_json()
    except Exception as e:
        return jsonify({"error": f"JSON 파싱 실패: {str(e)}"}), 400

    print("📌 request.get_json() 결과:", data)

    if not data or "folder" not in data:
        return jsonify({"error": 'Missing "folder" in request'}), 400

    folder = data["folder"]
    print("📁 받은 폴더 경로:", folder)

    # Set configuration and prepare logs
    Config().logPath = folder
    Config().detailPath = os.path.join(folder, Config().detailFile)
    LogList().clear()
    Analyzed().clear()
    setLogPath(folder)
    getLogFiles()

    return jsonify(
        {
            "folder": folder,
            "fileCount": LogList().fileCount,
            "detailPath": Config().detailPath,
            "hasDetailFile": os.path.exists(Config().detailPath),
        }
    )


@analysis_bp.route("/analyze", methods=["POST"])
def analyze():
    if LogList().fileCount == 0:
        return jsonify({"error": "No files to analyze"}), 400

    Analyzed().clear()
    analyzer.analyze()

    return jsonify(
        {
            "status": "analyze_completed",
            "analyzedCount": Analyzed().size(),
            "dstFiles": list(LogList().dstDicts.values()),
        }
    )


@analysis_bp.route("/categorize", methods=["POST"])
def categorize():
    result = categorizer.saveCategorize()
    return jsonify({"status": "categorize_completed", "result": result})


@analysis_bp.route("/summarize", methods=["POST"])
def summarize():
    result = summarizer.requestSummarize()
    return jsonify({"status": "summarize_completed", "result": result})


@analysis_bp.route("/monitoring/charging-page", methods=["POST"])
def monitoring_charging_page():
    data = request.get_json() or {}
    result = get_charging_page_data(
        data.get("serialNos"),
        data.get("startDate"),
        data.get("endDate"),
        data.get("page", 1),
        data.get("limit", 15),
    )
    return jsonify(result)


@analysis_bp.route("/monitoring/sessions", methods=["POST"])
def monitoring_sessions():
    data = request.get_json() or {}
    result = get_charging_sessions(
        data.get("serialNos"),
        data.get("startDate"),
        data.get("endDate"),
        data.get("errorCodes"),
    )
    return jsonify(result)


@analysis_bp.route("/monitoring/errors", methods=["POST"])
def monitoring_errors():
    data = request.get_json() or {}
    result = get_errors(
        data.get("serialNos"),
        data.get("startDate"),
        data.get("endDate"),
        data.get("page"),
        data.get("limit"),
        data.get("fetchAll", False),
    )
    return jsonify(result)


@analysis_bp.route("/monitoring/error-stats", methods=["POST"])
def monitoring_error_stats():
    data = request.get_json() or {}
    result = get_overall_error_statistics(
        data.get("serialNos"),
        data.get("startDate"),
        data.get("endDate"),
    )
    return jsonify(result)