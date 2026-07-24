"""AI Assistant Router (Page Guide) — dynamic contextual guidance using Gemini."""
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import get_supabase
from app.services.gemini import generate_json

router = APIRouter()


class AssistantReq(BaseModel):
    page_path: str
    user_id: Optional[str] = None


PAGE_MAP = {
    "/": ("Dashboard", "This page displays the user's profile strength, total skills, job match count, and quick access shortcuts to other agents."),
    "/profile": ("Profile & Skills", "Here users manage their personal details, target career role, preferences, and add or update their technical skills list and proficiency levels."),
    "/jobs": ("Job Scout", "This page lists job postings retrieved from aggregators, matching them against the user's profile and showing custom match scores."),
    "/skill-gap": ("Skill Gap Analyzer", "This page compares the user's existing profile skills with a target job description or role, highlighting which categories and skills they are missing."),
    "/resume": ("Resume Architect", "Here users upload their resume PDFs, get them classified by NLP classifier models, view their ATS scoring feedback, and tailor them for jobs."),
    "/learning": ("Learning Path", "This agent builds study plans for missing skills, listing tutorials, docs, projects, and courses. Users check off steps as they complete them."),
    "/career": ("Career Path Plan", "Here users map a strategic step-by-step career path ladder from their current skills to their target goal role, including milestones."),
    "/interview": ("Mock Interview", "This page lets users practice mock technical or behavioral voice interviews, records transcripts, and provides detailed feedback and scoring.")
}


@router.post("/tips")
def get_tips(req: AssistantReq):
    try:
        # Resolve page details
        path = req.page_path.strip().lower()
        # Handle trailing slash or /dashboard alias
        if path == "/dashboard":
            path = "/"
            
        page_name, page_desc = PAGE_MAP.get(path, ("General Navigation", "A page inside the PathCompanion AI application shell."))

        # 1. Fetch user context from Supabase if logged in
        profile_context = ""
        user_name = "User"
        
        if req.user_id:
            sb = get_supabase()
            
            # Fetch Profile & Skills
            p_role = "Not set yet"
            p_location = "Not set yet"
            skills = []
            
            try:
                prof_res = sb.table("profiles").select("full_name, target_role, location").eq("id", req.user_id).execute()
                if prof_res.data:
                    p = prof_res.data[0]
                    user_name = p.get("full_name") or "User"
                    p_role = p.get("target_role") or p_role
                    p_location = p.get("location") or p_location
            except Exception:
                pass
                
            try:
                sk_res = sb.table("skills").select("name").eq("user_id", req.user_id).execute()
                if sk_res.data:
                    skills = [s["name"] for s in sk_res.data]
            except Exception:
                pass
                
            profile_context = (
                f"- User's Name: {user_name}\n"
                f"- Target Career Role: {p_role}\n"
                f"- Current Location: {p_location}\n"
                f"- Added Skills: {', '.join(skills) if skills else 'None added yet'}\n"
            )
            
            # Extra page-specific context
            if path == "/learning":
                try:
                    plans_res = sb.table("learning_plans").select("skill_name, progress").eq("user_id", req.user_id).execute()
                    if plans_res.data:
                        plans = [f"{p['skill_name']} ({p['progress']}% complete)" for p in plans_res.data]
                        profile_context += f"- Active Learning Plans: {', '.join(plans)}\n"
                except Exception:
                    pass
            elif path == "/skill-gap":
                try:
                    gaps_res = sb.table("gap_analyses").select("goal_text, missing_skills").eq("user_id", req.user_id).order("created_at", desc=True).limit(1).execute()
                    if gaps_res.data:
                        g = gaps_res.data[0]
                        missing = [s.get("skill") if isinstance(s, dict) else str(s) for s in (g.get("missing_skills") or [])]
                        profile_context += f"- Current Target Goal: {g.get('goal_text') or 'Not set'}\n"
                        profile_context += f"- Missing Skills identified: {', '.join(missing[:5]) if missing else 'None'}\n"
                except Exception:
                    pass

        # 2. Formulate Prompt for JSON list output
        prompt = (
            "You are the PathCompanion AI Assistant, a helpful page-specific guide.\n"
            f"The user ({user_name}) is currently viewing the page: '{page_name}'.\n"
            f"Description of this page: {page_desc}\n\n"
        )
        
        if profile_context:
            prompt += f"Here is the user's database context:\n{profile_context}\n"
        else:
            prompt += "The user is not signed in or has no profile data. Give generic onboarding guidance.\n"
            
        prompt += (
            "\nBased on this context, generate exactly 3 or 4 short, highly personalized, actionable tips (one sentence each) "
            f"for what the user should do next on this '{page_name}' page. Make them encouraging and practical.\n"
            "Write the tips in a friendly tone.\n\n"
            "Format the output strictly as a JSON list of strings (no other text, markdown blocks are okay if parsed):\n"
            "[\n"
            "  \"First suggestion/action item...\",\n"
            "  \"Second suggestion/action item...\",\n"
            "  \"Third suggestion/action item...\"\n"
            "]"
        )
        
        # 3. Call Gemini to get JSON list
        tips_list = generate_json(prompt)
        
        # Guard against non-list return
        if not isinstance(tips_list, list):
            tips_list = [str(tips_list)]
            
        return {"tips": tips_list}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
