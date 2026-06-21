"""Learning Resource Finder (Phase 6) — LLM-generated free study path."""
from app.services.gemini import generate_json


def generate_plan(skill: str):
    prompt = (
        'Create a free, ordered learning path to learn "' + skill + '" from scratch to job-ready. '
        'Return ONLY a JSON array of 4 to 6 steps, ordered beginner to advanced. '
        'Each step is an object: {'
        '"title": "short step title", '
        '"type": "docs|video|course|project", '
        '"provider": "the resource site, e.g. YouTube, freeCodeCamp, MDN, Coursera, roadmap.sh, official docs", '
        '"url": "a REAL, working link to a specific free resource for this step", '
        '"note": "one short line on what to do"}. '
        'Use real, well-known, working URLs only — e.g. official documentation sites, '
        'https://www.freecodecamp.org, https://developer.mozilla.org, https://www.youtube.com, '
        'https://roadmap.sh, https://www.coursera.org, https://www.khanacademy.org. '
        'Prefer a canonical page (a real course, channel, playlist or docs page). '
        'If unsure of an exact page, use the provider homepage or a YouTube search URL '
        '(https://www.youtube.com/results?search_query=...). Never invent fake-looking paths. '
        'JSON only, no markdown.'
    )
    return generate_json(prompt)
