"""Resume Architect endpoints (Phase 5) — uses trained Model 1.

Accepts pasted text OR an uploaded resume file (PDF / DOCX / TXT / image)
and predicts the job category, with top-3 confidence.
"""
import io
import os
import tempfile
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.services.ml_models import classify_resume, classify_resume_top
from app.services.skill_map import detect_skills

router = APIRouter()


class TextReq(BaseModel):
    text: str


def _result(text: str) -> dict:
    return {
        "category": classify_resume(text),
        "top": classify_resume_top(text),
        "strengths": detect_skills(text),
        "chars": len(text),
        "preview": text[:600],
    }


@router.post("/classify")
def classify(req: TextReq):
    try:
        if not req.text.strip():
            raise HTTPException(422, "Paste some resume text first.")
        return _result(req.text)
    except HTTPException:
        raise
    except FileNotFoundError:
        raise HTTPException(503, "Model 1 file missing. Put model1_resume_classifier_baseline.joblib in backend/models/.")
    except Exception as e:
        raise HTTPException(500, str(e))


def _extract_text(filename: str, data: bytes) -> str:
    name = (filename or "").lower()
    if name.endswith(".pdf"):
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(data))
        return "\n".join((p.extract_text() or "") for p in reader.pages)
    if name.endswith(".docx"):
        import docx2txt
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tf:
            tf.write(data)
            path = tf.name
        try:
            return docx2txt.process(path) or ""
        finally:
            os.unlink(path)
    if name.endswith(".txt"):
        return data.decode("utf-8", "ignore")
    if name.endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff")):
        try:
            from PIL import Image
            import pytesseract
            return pytesseract.image_to_string(Image.open(io.BytesIO(data)))
        except Exception:
            raise HTTPException(503, "Image OCR needs the Tesseract engine installed. PDF, DOCX and TXT work without it.")
    raise HTTPException(415, "Unsupported file. Upload a PDF, DOCX, TXT or image.")


@router.post("/classify-file")
async def classify_file(file: UploadFile = File(...)):
    data = await file.read()
    try:
        text = _extract_text(file.filename, data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Could not read file: {e}")
    if not text.strip():
        raise HTTPException(422, "No readable text found in that file. A scanned image may need OCR.")
    try:
        return {**_result(text), "filename": file.filename}
    except FileNotFoundError:
        raise HTTPException(503, "Model 1 file missing in backend/models/.")
    except Exception as e:
        raise HTTPException(500, str(e))
