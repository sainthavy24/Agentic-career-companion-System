"""Learning Resource Finder (Phase 6) — LLM-generated free study path."""
from app.services.gemini import generate_json


def generate_plan(skill: str):
    prompt = (
        'Create a free, ordered learning path to learn "' + skill + '" from scratch to job-ready. '
        'Return ONLY a JSON array of 4 to 6 steps, ordered beginner to advanced. '
        'Each step is an object: {"title": "short step title", '
        '"type": "docs|video|course|project", "note": "one short line on what to do"}. '
        'Prefer free resources (official docs, freeCodeCamp, MDN, YouTube, roadmap.sh). JSON only, no markdown.'
    )
    return generate_json(prompt)
