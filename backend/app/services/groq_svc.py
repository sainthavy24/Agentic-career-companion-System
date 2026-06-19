"""Groq — Llama chat (questions/feedback) + Whisper (speech-to-text)."""
from groq import Groq
from app.config import settings

_client = None
CHAT_MODEL = "llama-3.3-70b-versatile"
STT_MODEL = "whisper-large-v3-turbo"


def _c():
    global _client
    if _client is None:
        if not settings.groq_api_key:
            raise RuntimeError("GROQ_API_KEY not set in backend/.env")
        _client = Groq(api_key=settings.groq_api_key)
    return _client


def chat(messages, temperature=0.7):
    r = _c().chat.completions.create(model=CHAT_MODEL, messages=messages, temperature=temperature)
    return r.choices[0].message.content


def transcribe(filename: str, data: bytes) -> str:
    r = _c().audio.transcriptions.create(model=STT_MODEL, file=(filename, data))
    return r.text
