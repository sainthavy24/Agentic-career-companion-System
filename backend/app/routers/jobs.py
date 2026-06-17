"""Job Scout endpoints: fetch, list, match, matches, embed-models (debug)."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import get_supabase
from app.services.jobs import fetch_remotive, upsert_jobs
from app.services.matching import run_matching
from app.services.embeddings import available_models

router = APIRouter()


class MatchReq(BaseModel):
    user_id: str


@router.post("/sync")
async def sync_jobs(limit: int = 50):
    try:
        jobs = await fetch_remotive(limit)
        return {"synced": upsert_jobs(jobs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
def list_jobs(limit: int = 50):
    sb = get_supabase()
    res = (sb.table("job_postings")
           .select("id,title,company,location,url,description,posted_at")
           .order("posted_at", desc=True).limit(limit).execute())
    return {"jobs": res.data}


@router.get("/embed-models")
def embed_models():
    """Debug: which embedding models this API key supports."""
    try:
        return {"models": available_models()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/match")
def match_jobs(req: MatchReq):
    try:
        return run_matching(req.user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/matches")
def get_matches(user_id: str, limit: int = 50):
    sb = get_supabase()
    res = (sb.table("matches")
           .select("score,matched_skills,missing_skills,job_postings(id,title,company,location,url,description)")
           .eq("user_id", user_id).order("score", desc=True).limit(limit).execute())
    return {"matches": res.data}
