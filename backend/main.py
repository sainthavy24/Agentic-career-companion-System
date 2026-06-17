"""PathCompanion AI — FastAPI entrypoint (Phase 1 skeleton)."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import api_router

app = FastAPI(title="PathCompanion AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "service": "PathCompanion AI API",
        "status": "running",
        "try": ["/health", "/api/v1/db-check", "/docs"],
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "pathcompanion-api", "version": "0.1.0"}
