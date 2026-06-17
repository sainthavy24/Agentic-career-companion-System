"""Skill Gap endpoints (Phase 5) — uses trained Model 2."""
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import get_supabase
from app.services.ml_models import extract_skills

router = APIRouter()


class AnalyzeReq(BaseModel):
    text: str
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
        required = extract_skills(req.text)
    except FileNotFoundError:
        raise HTTPException(503, "Model 2 file missing in backend/models/.")
    except Exception as e:
        raise HTTPException(500, str(e))
    present, missing = [], list(required)
    if req.user_id:
        sb = get_supabase()
        rows = sb.table("skills").select("name").eq("user_id", req.user_id).execute().data or []
        have = {r["name"].lower() for r in rows}
        present = [s for s in required if s.lower() in have]
        missing = [s for s in required if s.lower() not in have]
    return {"required": required, "present": present, "missing": missing}
