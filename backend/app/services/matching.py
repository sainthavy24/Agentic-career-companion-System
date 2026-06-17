"""Hybrid job matching: semantic similarity (embeddings) + skill overlap."""
import json
import math
from app.config import get_supabase
from app.services.embeddings import embed


def _cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0


def _parse(v):
    if v is None:
        return None
    if isinstance(v, list):
        return v
    try:
        return json.loads(v)
    except Exception:
        return None


def run_matching(user_id: str):
    sb = get_supabase()

    skills = (sb.table("skills").select("name").eq("user_id", user_id).execute().data) or []
    if not skills:
        return {"matched": 0, "note": "Add some skills first (Profile & Skills)."}
    names = [s["name"] for s in skills]
    user_vec = embed("Skills and experience: " + ", ".join(names))

    jobs = (sb.table("job_postings")
            .select("id,title,description,embedding").limit(60).execute().data) or []

    rows = []
    for j in jobs:
        emb = _parse(j.get("embedding"))
        if emb is None:
            emb = embed((j.get("title") or "") + ". " + (j.get("description") or ""))
            try:
                sb.table("job_postings").update({"embedding": str(emb)}).eq("id", j["id"]).execute()
            except Exception:
                pass  # caching is best-effort
        sim = _cosine(user_vec, emb)
        text = ((j.get("title") or "") + " " + (j.get("description") or "")).lower()
        matched = [n for n in names if n.lower() in text]
        rows.append({
            "user_id": user_id,
            "job_id": j["id"],
            "score": round(sim * 100, 1),
            "matched_skills": matched,
            "missing_skills": [],
        })

    if rows:
        sb.table("matches").upsert(rows, on_conflict="user_id,job_id").execute()
    return {"matched": len(rows)}
