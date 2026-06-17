"""Gemini text embeddings for semantic job matching.
Auto-discovers a working embedding model for the user's API key."""
import google.generativeai as genai
from app.config import settings

_configured = False
_model = None
PREFERRED = ["models/text-embedding-004", "models/embedding-001", "models/gemini-embedding-001"]


def _ensure():
    global _configured
    if not _configured:
        if not settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY not set in backend/.env")
        genai.configure(api_key=settings.gemini_api_key)
        _configured = True


def available_models():
    _ensure()
    names = []
    for m in genai.list_models():
        if "embedContent" in getattr(m, "supported_generation_methods", []):
            names.append(m.name)
    return names


def _pick():
    avail = available_models()
    for p in PREFERRED:
        if p in avail:
            return p
    return avail[0] if avail else None


def embed(text: str):
    _ensure()
    global _model
    if _model is None:
        _model = _pick()
        if not _model:
            raise RuntimeError("No embedding model supports embedContent for this API key.")
    text = (text or " ")[:8000]
    r = genai.embed_content(model=_model, content=text)
    return r["embedding"]
