"""Chatbot router (Phase 1 skeleton + Phase 2 AI implementation)."""
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import get_supabase
from app.services.gemini import generate_text

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" or "model"
    content: str


class ChatReq(BaseModel):
    message: str
    user_id: Optional[str] = None
    history: Optional[List[ChatMessage]] = None


@router.post("")
def chat(req: ChatReq):
    try:
        # 1. Fetch user context from Supabase if logged in
        context_parts = []
        user_name = "User"
        
        if req.user_id:
            sb = get_supabase()
            
            # Fetch Profile
            try:
                profile_res = sb.table("profiles").select("*").eq("id", req.user_id).execute()
                if profile_res.data:
                    p = profile_res.data[0]
                    user_name = p.get("full_name") or "User"
                    context_parts.append(
                        f"User Profile:\n- Name: {user_name}\n- Target Role: {p.get('target_role') or 'Not set'}\n- Location: {p.get('location') or 'Not set'}"
                    )
            except Exception:
                pass
            
            # Fetch Skills
            try:
                skills_res = sb.table("skills").select("name, proficiency").eq("user_id", req.user_id).execute()
                if skills_res.data:
                    skills_list = [f"{s['name']} (Proficiency: {s['proficiency']}%)" for s in skills_res.data]
                    context_parts.append(f"User Skills:\n" + "\n".join([f"- {s}" for s in skills_list]))
            except Exception:
                pass
                
            # Fetch Resumes
            try:
                resumes_res = sb.table("resumes").select("category, ats_score").eq("user_id", req.user_id).execute()
                if resumes_res.data:
                    r = resumes_res.data[0]
                    context_parts.append(
                        f"Resume Info:\n- Predicted Category: {r.get('category') or 'Unknown'}\n- ATS Score: {r.get('ats_score') or 'Not calculated'}/100"
                    )
            except Exception:
                pass
                
            # Fetch Gap Analysis
            try:
                gaps_res = sb.table("gap_analyses").select("goal_text, present_skills, missing_skills").eq("user_id", req.user_id).order("created_at", desc=True).limit(1).execute()
                if gaps_res.data:
                    g = gaps_res.data[0]
                    context_parts.append(
                        f"Latest Skill Gap Analysis:\n- Goal: {g.get('goal_text') or 'Not set'}\n- Present Skills: {g.get('present_skills') or []}\n- Missing Skills: {g.get('missing_skills') or []}"
                    )
            except Exception:
                pass
                
            # Fetch Learning Plans
            try:
                plans_res = sb.table("learning_plans").select("skill_name, progress, status").eq("user_id", req.user_id).execute()
                if plans_res.data:
                    plans_list = [f"- {p['skill_name']} ({p['progress']}% done, status: {p['status']})" for p in plans_res.data]
                    context_parts.append("Active Learning Plans:\n" + "\n".join(plans_list))
            except Exception:
                pass
                
            # Fetch Career Path
            try:
                paths_res = sb.table("career_paths").select("goal, stages").eq("user_id", req.user_id).order("created_at", desc=True).limit(1).execute()
                if paths_res.data:
                    path = paths_res.data[0]
                    context_parts.append(
                        f"Career Path Plan:\n- Goal: {path.get('goal') or 'Not set'}\n- Stages: {path.get('stages') or []}"
                    )
            except Exception:
                pass

        # 2. Build system instruction
        system_instruction = (
            "You are PathCompanion AI, a highly supportive, professional, and friendly career & talent companion AI.\n"
            "Your objective is to help the user with career goals, software engineering advice, learning paths, "
            "resume improvements, interview tips, and skill mapping.\n\n"
        )
        
        if context_parts:
            system_instruction += (
                f"Here is the user's current progress and profile context from the database:\n"
                f"{'='*40}\n"
                f"{chr(10).join(context_parts)}\n"
                f"{'='*40}\n\n"
                f"Use this information to personalize your answers and naturally reference their target role, skills, "
                f"learning plan, or resume scores where appropriate. Do not mention 'database tables' or 'system context' "
                f"explicitly unless asked; speak to the user as if you already know their details.\n"
            )
        else:
            system_instruction += "No user profile is loaded yet (the user might be unsigned or has a fresh account). Offer general career and tech guidance.\n"
            
        # 3. Formulate the final prompt with history
        prompt_lines = [f"System: {system_instruction}"]
        
        if req.history:
            for h in req.history:
                speaker = "User" if h.role == "user" else "Assistant"
                prompt_lines.append(f"{speaker}: {h.content}")
                
        prompt_lines.append(f"User: {req.message}")
        prompt_lines.append("Assistant:")
        
        full_prompt = "\n\n".join(prompt_lines)
        
        # 4. Generate response using Gemini
        ai_response = generate_text(full_prompt)
        
        return {"response": ai_response}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
