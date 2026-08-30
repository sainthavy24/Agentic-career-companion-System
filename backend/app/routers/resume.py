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


# ===================== Resume Builder (AI-tailored resumes) =====================
from typing import Optional, List
from app.config import get_supabase
from app.services.gemini import generate_json


class ResumeBuildReq(BaseModel):
    user_id: str
    job_description: Optional[str] = None   # pasted JD or role name
    job_id: Optional[str] = None            # selected from Job Scout
    extra_skills: List[str] = []            # skills added just for this resume
    extra_notes: Optional[str] = None       # anything else the user wants included


class ResumeListReq(BaseModel):
    user_id: str


@router.post("/build")
def build_resume(req: ResumeBuildReq):
    """Generate a tailored resume JSON from profile + skills + target job."""
    try:
        sb = get_supabase()

        # ---- 1. Gather user data ----
        profile = {}
        prefs = {}
        try:
            res = sb.table("profiles").select("*").eq("id", req.user_id).execute()
            if res.data:
                profile = res.data[0]
                prefs = profile.get("prefs") or {}
        except Exception as e:
            print(f"[Resume Builder] profile fetch failed: {e}")

        skills = []
        try:
            res = sb.table("skills").select("name, proficiency").eq("user_id", req.user_id).execute()
            skills = [s["name"] for s in (res.data or [])]
        except Exception as e:
            print(f"[Resume Builder] skills fetch failed: {e}")

        all_skills = list(dict.fromkeys(skills + [s.strip() for s in req.extra_skills if s.strip()]))

        # ---- 2. Resolve target job ----
        job_desc = (req.job_description or "").strip()
        job_title = ""
        job_company = ""
        if req.job_id:
            try:
                res = sb.table("job_postings").select("title, company, description").eq("id", req.job_id).execute()
                if res.data:
                    job_title = res.data[0].get("title") or ""
                    job_company = res.data[0].get("company") or ""
                    if not job_desc:
                        job_desc = res.data[0].get("description") or ""
            except Exception as e:
                print(f"[Resume Builder] job fetch failed: {e}")

        target = job_desc or job_title or profile.get("target_role") or "Software Engineer"

        experiences = prefs.get("experiences") or []
        education = prefs.get("education") or []

        # ---- 3. Build Gemini prompt ----
        prompt = (
            "You are an expert resume writer and ATS optimization specialist.\n"
            "Write a tailored, professional resume for the candidate below, optimized for the target job.\n\n"
            f"CANDIDATE PROFILE:\n"
            f"- Name: {profile.get('full_name') or 'Candidate'}\n"
            f"- Current headline / target role: {profile.get('target_role') or ''}\n"
            f"- Location: {profile.get('location') or ''}\n"
            f"- Email: {prefs.get('contact_email') or profile.get('email') or ''}\n"
            f"- Phone: {prefs.get('phone') or ''}\n"
            f"- LinkedIn: {prefs.get('linkedin') or ''}\n"
            f"- Bio: {prefs.get('bio') or ''}\n"
            f"- Years of experience: {prefs.get('years_exp') or ''}\n\n"
            f"WORK EXPERIENCE (raw data): {experiences}\n\n"
            f"EDUCATION (raw data): {education}\n\n"
            f"SKILLS: {', '.join(all_skills) if all_skills else 'not specified'}\n\n"
            + (f"EXTRA NOTES FROM CANDIDATE: {req.extra_notes}\n\n" if req.extra_notes else "")
            + f"TARGET JOB (tailor the resume to this):\n{target[:4000]}\n"
            + (f"Company: {job_company}\n" if job_company else "")
            + "\nINSTRUCTIONS:\n"
            "- Rewrite experience descriptions as strong, quantified, achievement-oriented bullet points.\n"
            "- Reorder and emphasize the skills most relevant to the target job; include relevant candidate skills the job asks for.\n"
            "- Write a compelling 2-3 sentence professional summary tailored to the target job.\n"
            "- Do NOT invent employers, degrees, or dates. Only rephrase and highlight what is given. "
            "You may infer reasonable skill groupings.\n"
            "- Keep it concise enough for a one-page resume.\n\n"
            "Output strictly a single JSON object with exactly these keys:\n"
            "{\n"
            '  "header": {"name": str, "title": str, "email": str, "phone": str, "location": str, "linkedin": str},\n'
            '  "summary": str,\n'
            '  "skills": [str, ...]  (8-14 skills, most relevant first),\n'
            '  "experience": [{"title": str, "company": str, "period": str, "bullets": [str, ...]}],\n'
            '  "education": [{"degree": str, "school": str, "period": str}],\n'
            '  "highlights": [str, ...]  (3-5 short keywords/phrases matching the target job)\n'
            "}\n"
            "Do not wrap the JSON in markdown fences or any other text."
        )

        content = generate_json(prompt)
        if not isinstance(content, dict) or "header" not in content:
            raise ValueError("AI did not return a valid resume structure")

        # ---- 4. Save to resumes table ----
        saved_id = None
        try:
            row = {
                "user_id": req.user_id,
                "type": "tailored" if (job_desc or req.job_id) else "master",
                "category": job_title or profile.get("target_role"),
                "content": content,
            }
            if req.job_id:
                row["job_id"] = req.job_id
            res = sb.table("resumes").insert(row).execute()
            if res.data:
                saved_id = res.data[0].get("id")
        except Exception as e:
            print(f"[Resume Builder] save failed: {e}")

        return {"success": True, "id": saved_id, "resume": content}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to build resume: {str(e)}")


@router.post("/saved")
def list_saved_resumes(req: ResumeListReq):
    """List previously generated resumes for the user."""
    try:
        sb = get_supabase()
        res = (
            sb.table("resumes")
            .select("id, type, category, content, created_at")
            .eq("user_id", req.user_id)
            .order("created_at", desc=True)
            .limit(20)
            .execute()
        )
        return {"resumes": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list resumes: {str(e)}")
