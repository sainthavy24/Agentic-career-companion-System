"""Career Path endpoints (Phase 7)."""
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import get_supabase
from app.services.career import generate_path

router = APIRouter()


class PlanReq(BaseModel):
    goal: str
    user_id: Optional[str] = None


@router.post("/plan")
def plan(req: PlanReq):
    skills = []
    sb = None
    if req.user_id:
        sb = get_supabase()
        rows = sb.table("skills").select("name").eq("user_id", req.user_id).execute().data or []
        skills = [r["name"] for r in rows]
    try:
        stages = generate_path(req.goal, skills)
    except Exception as e:
        raise HTTPException(500, f"Could not generate path: {e}")
    if sb and isinstance(stages, list):
        try:
            sb.table("career_paths").insert({"user_id": req.user_id, "goal": req.goal, "stages": stages}).execute()
        except Exception:
            pass  # saving is best-effort
    return {"goal": req.goal, "stages": stages}
