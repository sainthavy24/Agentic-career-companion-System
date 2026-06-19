"""Mock Interview endpoints (Phase 8)."""
from typing import List
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.services.interview import next_question, feedback
from app.services.groq_svc import transcribe

router = APIRouter()


class QA(BaseModel):
    q: str = ""
    a: str = ""


class QReq(BaseModel):
    role: str
    history: List[QA] = []
    skills: List[str] = []


class FReq(BaseModel):
    role: str
    history: List[QA] = []


@router.post("/question")
def question(req: QReq):
    try:
        return {"question": next_question(req.role, [h.dict() for h in req.history], req.skills)}
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        data = await file.read()
        return {"text": transcribe(file.filename or "answer.webm", data)}
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/feedback")
def fb(req: FReq):
    try:
        return feedback(req.role, [h.dict() for h in req.history])
    except Exception as e:
        raise HTTPException(500, str(e))
