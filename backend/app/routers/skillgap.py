"""Skill Gap endpoints (Phase 5) — uses trained Model 2."""
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import get_supabase
from app.services.ml_models import extract_skills
from app.services.skill_map import skills_to_categories

router = APIRouter()


class AnalyzeReq(BaseModel):
    text: str
    title: Optional[str] = None
    user_id: Optional[str] = None


@router.post("/extract")
def extract(req: AnalyzeReq):
    try:
        return {"skills": extract_skills(req.text)}
    except FileNotFoundError:
        raise HTTPException(503, "Model 2 file missing. Put model2_skill_baseline.joblib in backend/models/.")
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/analyze")
def analyze(req: AnalyzeReq):
    try:
        found = extract_skills(req.text)
        if req.title:
            found = found + extract_skills(req.title)   # title signal, not diluted
        required = list(dict.fromkeys(found))           # de-dupe, keep order
    except FileNotFoundError:
        raise HTTPException(503, "Model 2 file missing in backend/models/.")
    except Exception as e:
        raise HTTPException(500, str(e))
    # Model 2 outputs broad job-function focus areas. Bridge the user's
    # granular skills up to those same categories for a like-for-like gap.
    user_cats = set()
    if req.user_id:
        sb = get_supabase()
        rows = sb.table("skills").select("name").eq("user_id", req.user_id).execute().data or []
        user_cats = skills_to_categories([r["name"] for r in rows])
    present = [s for s in required if s in user_cats]
    missing = [s for s in required if s not in user_cats]
    return {
        "required": required,
        "present": present,
        "missing": missing,
        "user_categories": sorted(user_cats),
    }
