"""Gemini text generation. Prefers free-tier models; falls back on quota errors."""
import json
import re
import google.generativeai as genai
from app.config import settings

_configured = False
_gen_model = None
# free-tier-friendly first; gemini-2.0-flash is often limit=0 on free tier -> last
PREFER = [
    "models/gemini-1.5-flash",
    "models/gemini-1.5-flash-8b",
    "models/gemini-2.0-flash-lite",
    "models/gemini-flash-latest",
    "models/gemini-1.5-flash-latest",
    "models/gemini-2.0-flash",
]


def _ensure():
    global _configured
    if not _configured:
        if not settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY not set in backend/.env")
        genai.configure(api_key=settings.gemini_api_key)
        _configured = True


def _candidates():
    avail = set(m.name for m in genai.list_models()
                if "generateContent" in getattr(m, "supported_generation_methods", []))
    ordered = [p for p in PREFER if p in avail]
    ordered += [a for a in avail if a not in ordered and "flash" in a]
    ordered += [a for a in avail if a not in ordered]
    return ordered


def generate_text(prompt: str) -> str:
    _ensure()
    global _gen_model
    cands = [_gen_model] if _gen_model else _candidates()
    last = None
    for m in cands:
        try:
            r = genai.GenerativeModel(m).generate_content(prompt)
            _gen_model = m
            return r.text
        except Exception as e:
            last = e
            _gen_model = None  # try the next model next time too
    raise last if last else RuntimeError("No Gemini text model available")


def generate_json(prompt: str):
    txt = generate_text(prompt)
    m = re.search(r"```(?:json)?\s*(.*?)```", txt, re.S)
    if m:
        txt = m.group(1)
    return json.loads(txt.strip())
