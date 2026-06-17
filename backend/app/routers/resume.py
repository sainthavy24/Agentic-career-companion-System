"""Resume Architect endpoints (Phase 5) — uses trained Model 1."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ml_models import classify_resume

router = APIRouter()


class TextReq(BaseModel):
    text: str


@router.post("/classify")
def classify(req: TextReq):
    try:
        return {"category": classify_resume(req.text)}
    except FileNotFoundError:
        raise HTTPException(503, "Model 1 file missing. Put model1_resume_classifier_baseline.joblib in backend/models/.")
    except Exception as e:
        raise HTTPException(500, str(e))
