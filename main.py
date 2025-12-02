"""Entry point for Railway/cloud deployment."""

# Re-export the FastAPI app from backend.main
from backend.main import app

# This allows: uvicorn main:app
__all__ = ["app"]
