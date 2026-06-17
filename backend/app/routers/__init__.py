"""API v1 router. Per-agent routers get included here as phases land."""
from fastapi import APIRouter

api_router = APIRouter()


@api_router.get("/ping")
def ping():
    return {"pong": True}


@api_router.get("/db-check")
def db_check():
    """Verify the backend can reach your Supabase database."""
    from app.config import settings, get_supabase
    diag = {
        "url_looks_ok": settings.supabase_url.startswith("https://")
        and settings.supabase_url.endswith(".supabase.co"),
        "service_key_set": bool(settings.supabase_service_key),
    }
    try:
        sb = get_supabase()
        res = sb.table("job_postings").select("id").limit(1).execute()
        return {"connected": True, "rows": len(res.data), **diag}
    except Exception as e:
        return {"connected": False, "error": str(e), **diag}
