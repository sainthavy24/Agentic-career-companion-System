"""Mock Interview (Phase 8) — adaptive questions + feedback via Groq Llama."""
import json
import re
from app.services.groq_svc import chat


def next_question(role, history, skills):
    hist = "\n".join(f"Q: {h.get('q','')}\nA: {h.get('a','')}" for h in history) or "(none yet)"
    sys = ("You are a friendly but professional technical interviewer. "
           "Ask exactly ONE interview question at a time, concise (1-2 sentences). "
           "Adapt to the candidate's previous answers and skills. Do not give feedback now. "
           "Return ONLY the question text, no preamble.")
    user = (f"Role: {role}\nCandidate skills: {', '.join(skills) or 'unknown'}\n"
            f"Interview so far:\n{hist}\n\nAsk the next question.")
    return chat([{"role": "system", "content": sys}, {"role": "user", "content": user}]).strip()


def feedback(role, history):
    hist = "\n".join(f"Q: {h.get('q','')}\nA: {h.get('a','')}" for h in history)
    prompt = (f"You are an interview coach. Role: {role}. The interview:\n{hist}\n\n"
              "Give concise constructive feedback. Return ONLY JSON: "
              '{"score": <integer 0-10>, "summary": "2-3 sentence overall feedback", '
              '"tips": ["tip 1", "tip 2", "tip 3"]}. No markdown.')
    txt = chat([{"role": "user", "content": prompt}], temperature=0.4)
    m = re.search(r"\{.*\}", txt, re.S)
    try:
        return json.loads(m.group(0) if m else txt)
    except Exception:
        return {"score": None, "summary": txt, "tips": []}
