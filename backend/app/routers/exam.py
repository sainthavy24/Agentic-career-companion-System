"""Mockup Exam router (Phase 1 skeleton + Phase 2 AI implementation)."""
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import get_supabase
from app.services.gemini import generate_json

router = APIRouter()


class ExamGenerateReq(BaseModel):
    user_id: Optional[str] = None


class ExamSubmitReq(BaseModel):
    user_id: str
    subject: str
    score: float
    total_questions: int
    correct_answers: int


@router.post("/generate")
def generate_exam(req: ExamGenerateReq):
    try:
        target_role = "Software Engineer"
        skills = []
        
        # 1. Fetch user profile context from Supabase if logged in
        if req.user_id:
            sb = get_supabase()
            try:
                prof_res = sb.table("profiles").select("target_role").eq("id", req.user_id).execute()
                if prof_res.data and prof_res.data[0].get("target_role"):
                    target_role = prof_res.data[0]["target_role"]
            except Exception:
                pass
                
            try:
                sk_res = sb.table("skills").select("name").eq("user_id", req.user_id).execute()
                if sk_res.data:
                    skills = [s["name"] for s in sk_res.data]
            except Exception:
                pass

        skills_str = ", ".join(skills) if skills else "General Software Development"
        
        # 2. Formulate Prompt for Gemini to generate strict JSON array of MCQs
        prompt = (
            "You are an expert technical interviewer and educator.\n"
            f"Generate exactly 5 multiple-choice questions (MCQs) for a mock exam testing the user's suitability "
            f"for a '{target_role}' role.\n"
            f"The questions should test knowledge related to the role and the following skills: {skills_str}.\n\n"
            "Each question must have exactly 4 distinct options.\n"
            "Output the result strictly as a JSON array of objects. Do not wrap it in anything else. "
            "Each object inside the array must contain the following keys exactly:\n"
            "- \"question\": (string) The text of the question.\n"
            "- \"options\": (list of 4 strings) The multiple choice options.\n"
            "- \"answer_idx\": (integer, 0 to 3) The index of the correct answer in the options list.\n"
            "- \"explanation\": (string) A short explanation of why the correct answer is correct.\n\n"
            "Example format:\n"
            "[\n"
            "  {\n"
            "    \"question\": \"What does HTML stand for?\",\n"
            "    \"options\": [\"Hyper Text Markup Language\", \"High Tech Modern Language\", \"Hyperlink Text Management Language\", \"Home Tool Markup Language\"],\n"
            "    \"answer_idx\": 0,\n"
            "    \"explanation\": \"HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages.\"\n"
            "  }\n"
            "]"
        )
        
        # 3. Call Gemini to generate the JSON questions
        questions = generate_json(prompt)
        
        # Ensure it is a valid list of questions
        if not isinstance(questions, list):
            raise ValueError("Gemini failed to return a list format")
            
        # Return the generated exam
        return {"subject": f"{target_role} Skill Assessment", "questions": questions[:5]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate exam: {str(e)}")


@router.post("/submit")
def submit_exam(req: ExamSubmitReq):
    try:
        sb = get_supabase()
        
        # Insert exam score into exam_results table
        res = sb.table("exam_results").insert({
            "user_id": req.user_id,
            "subject": req.subject,
            "score": req.score,
            "total_questions": req.total_questions,
            "correct_answers": req.correct_answers
        }).execute()
        
        if not res.data:
            raise ValueError("No data returned from database insert")
            
        return {"success": True, "result": res.data[0]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save exam score: {str(e)}")


class EmailCertificateReq(BaseModel):
    user_id: str
    email: str
    subject: str
    score: float
    total_questions: int
    correct_answers: int
    exam_result_id: Optional[str] = None


@router.post("/email-certificate")
def email_certificate(req: EmailCertificateReq):
    try:
        # Fetch user's full name from Supabase profiles if possible
        user_name = "Career Companion User"
        sb = get_supabase()
        try:
            prof_res = sb.table("profiles").select("full_name").eq("id", req.user_id).execute()
            if prof_res.data and prof_res.data[0].get("full_name"):
                user_name = prof_res.data[0]["full_name"]
        except Exception as e:
            print(f"Error fetching user profile: {str(e)}")
            
        # Use exam_result_id as verification ID, or generate a default/fallback
        verification_id = req.exam_result_id or "VER-MOCK-EXAM"
        
        from app.services.email_svc import send_certificate_email
        success = send_certificate_email(
            email=req.email,
            user_name=user_name,
            subject=req.subject,
            score=req.score,
            correct_answers=req.correct_answers,
            total_questions=req.total_questions,
            verification_id=verification_id
        )
        
        return {"success": success, "message": "Certificate email processed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to email certificate: {str(e)}")

