"""Learning Path endpoints (Phase 6)."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.learning import generate_plan

router = APIRouter()


class PlanReq(BaseModel):
    skill: str


@router.post("/plan")
def plan(req: PlanReq):
    try:
        return {"skill": req.skill, "steps": generate_plan(req.skill)}
    except Exception as e:
        raise HTTPException(500, f"Could not generate learning path: {e}")
