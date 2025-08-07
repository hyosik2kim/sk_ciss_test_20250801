# main.py (기존 SCARGui 역할을 Flask 서버로 전환)

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from SCARAnalyzer import SCARAnalyzer
from SCARCategorizer import SCARCategorizer
from SCARSummarizer import SCARSummarizer
from SCARCommon import Config, LogList, Analyzed, setLogPath, getLogFiles

app = Flask(__name__)
CORS(app) 
# 클래스 인스턴스 초기화
analyzer = SCARAnalyzer()
categorizer = SCARCategorizer()
summarizer = SCARSummarizer()

# 콜백 설정
def on_analyze_completed(src, completed):
    print(f"[분석 완료] {src} → {completed}")

analyzer.set_analyze_completed_callback(on_analyze_completed)

# === API 정의 ===

@app.route('/select_folder', methods=['POST'])
def select_folder():
    print("📥 호출됨 /select_folder")

    # 1. 헤더 확인
    print("📌 request.headers:", dict(request.headers))

    # 2. 바디(raw) 확인
    print("📌 request.data:", request.data)

    # 3. JSON 파싱
    try:
        data = request.get_json()
    except Exception as e:
        return jsonify({'error': f'JSON 파싱 실패: {str(e)}'}), 400

    print("📌 request.get_json() 결과:", data)

    # 4. 유효성 체크
    if not data or 'folder' not in data:
        return jsonify({'error': 'Missing "folder" in request'}), 400

    folder = data['folder']
    print("📁 받은 폴더 경로:", folder)
    
    # 설정 및 로그 준비
    Config().logPath = folder
    Config().detailPath = os.path.join(folder, Config().detailFile)
    LogList().clear()
    Analyzed().clear()
    setLogPath(folder)
    getLogFiles()

    return jsonify({
        'folder': folder,
        'fileCount': LogList().fileCount,
        'detailPath': Config().detailPath,
        'hasDetailFile': os.path.exists(Config().detailPath)
    })


@app.route('/analyze', methods=['POST'])
def analyze():
    if LogList().fileCount == 0:
        return jsonify({'error': 'No files to analyze'}), 400

    Analyzed().clear()
    analyzer.analyze()

    return jsonify({
        'status': 'analyze_completed',
        'analyzedCount': Analyzed().size(),
        'dstFiles': list(LogList().dstDicts.values())
    })


@app.route('/categorize', methods=['POST'])
def categorize():
    result = categorizer.saveCategorize()
    return jsonify({
        'status': 'categorize_completed',
        'result': result
    })


@app.route('/summarize', methods=['POST'])
def summarize():
    result = summarizer.requestSummarize()
    return jsonify({
        'status': 'summarize_completed',
        'result': result
    })


# === 서버 실행 ===
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
