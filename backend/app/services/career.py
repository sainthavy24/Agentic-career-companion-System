"""Career Path Planner (Phase 7) — LLM-generated progression ladder."""
from app.services.gemini import generate_json


def generate_path(goal: str, skills: list):
    skills_txt = ", ".join(skills) if skills else "none specified"
    prompt = (
        'You are a career planning assistant. For the target career "' + goal + '", '
        'produce a realistic progression ladder as JSON. '
        'The candidate currently has these skills: ' + skills_txt + '. '
        'Return ONLY a JSON array of 4 to 5 stages, ordered entry-level to senior. '
        'Each stage is an object with keys: "stage" (job title), '
        '"duration" (e.g. "6-12 months"), "skills" (array of 3-5 skills to build), '
        '"tip" (one short actionable tip). Output JSON only, no markdown.'
    )
    return generate_json(prompt)
