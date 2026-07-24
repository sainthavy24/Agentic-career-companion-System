"""API v1 router. Per-agent routers included here as phases land."""
from fastapi import APIRouter
from app.routers import jobs, resume, skillgap, career, learning, interview, chat, assistant

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


api_router.include_router(jobs.router, prefix="/jobs", tags=["job-scout"])
api_router.include_router(resume.router, prefix="/resume", tags=["resume"])
api_router.include_router(skillgap.router, prefix="/skill-gap", tags=["skill-gap"])
api_router.include_router(career.router, prefix="/career", tags=["career"])
api_router.include_router(learning.router, prefix="/learning", tags=["learning"])
api_router.include_router(interview.router, prefix="/interview", tags=["interview"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(assistant.router, prefix="/assistant", tags=["assistant"])
