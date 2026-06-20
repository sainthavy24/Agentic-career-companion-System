"""Job aggregation from free public APIs (Phase 2). Remotive needs no API key."""
import re
import httpx
from app.config import get_supabase

REMOTIVE_URL = "https://remotive.com/api/remote-jobs"


def _clean(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)        # strip HTML tags
    text = re.sub(r"\s+", " ", text).strip()
    return text[:4000]


async def fetch_remotive(limit: int = 50):
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(REMOTIVE_URL, params={"limit": limit})
        r.raise_for_status()
        return r.json().get("jobs", [])


def upsert_jobs(jobs: list) -> int:
    sb = get_supabase()
    rows = []
    for j in jobs:
        rows.append({
            "source": "remotive",
            "external_id": str(j.get("id")),
            "title": j.get("title"),
            "company": j.get("company_name"),
            "location": j.get("candidate_required_location") or "Remote",
            "remote": True,
            "description": _clean(j.get("description")),
            "url": j.get("url"),
            "posted_at": j.get("publication_date"),
        })
    if not rows:
        return 0
    sb.table("job_postings").upsert(rows, on_conflict="source,external_id").execute()
    return len(rows)
