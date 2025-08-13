from flask import Flask
from flask_cors import CORS

def create_app():
    """Application factory for the SCARAnalysis Flask app."""
    app = Flask(__name__)
    CORS(app)

    from .controllers.analysis_controller import analysis_bp
    app.register_blueprint(analysis_bp)

    return app