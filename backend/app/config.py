"""Environment / settings + Supabase client factory."""
import os
from functools import lru_cache
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())


def _clean_url(u: str) -> str:
    """Remove trailing slash / accidental /rest/v1 so the URL is well-formed."""
    u = (u or "").strip().rstrip("/")
    if u.endswith("/rest/v1"):
        u = u[: -len("/rest/v1")]
    return u


class Settings:
    supabase_url: str = _clean_url(os.getenv("SUPABASE_URL", ""))
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "").strip()
    supabase_service_key: str = os.getenv("SUPABASE_SERVICE_KEY", "").strip()
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    cors_origins: list = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")


settings = Settings()


@lru_cache
def get_supabase():
    """Service-role Supabase client (server-side; bypasses RLS for jobs ingest)."""
    from supabase import create_client
    return create_client(settings.supabase_url, settings.supabase_service_key)
