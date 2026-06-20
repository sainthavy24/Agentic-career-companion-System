"""Load the trained baseline models (Phase 5) and run inference."""
import os
import joblib

_HERE = os.path.dirname(__file__)
MODELS_DIR = os.path.normpath(os.path.join(_HERE, "..", "..", "models"))
M1 = os.path.join(MODELS_DIR, "model1_resume_classifier_baseline.joblib")
M2 = os.path.join(MODELS_DIR, "model2_skill_baseline.joblib")

_m1 = None
_m2 = None


def classify_resume(text: str) -> str:
    """Model 1 — predict the job category of a resume."""
    global _m1
    if _m1 is None:
        _m1 = joblib.load(M1)               # sklearn Pipeline (TF-IDF + LogReg)
    return str(_m1.predict([text or ""])[0])


def classify_resume_top(text: str, k: int = 3) -> list:
    """Model 1 — top-k predicted categories with confidence."""
    global _m1
    if _m1 is None:
        _m1 = joblib.load(M1)
    if hasattr(_m1, "predict_proba"):
        import numpy as np
        probs = _m1.predict_proba([text or ""])[0]
        classes = _m1.classes_
        idx = np.argsort(probs)[::-1][:k]
        return [{"category": str(classes[i]), "prob": round(float(probs[i]), 3)} for i in idx]
    return [{"category": classify_resume(text), "prob": None}]


def extract_skills(text: str, threshold: float = 0.15, top_k: int = 5) -> list:
    """Model 2 — extract a role's focus areas (multi-label).

    The base 0.5 decision threshold is too strict (many postings returned
    nothing), so we rank labels by probability and keep those above a lower
    threshold, most-relevant first. If none clear the threshold we fall back
    to the single best guess (when plausible) so a real posting is rarely
    empty. "Other" is dropped as a non-informative catch-all class.
    """
    global _m2
    if _m2 is None:
        _m2 = joblib.load(M2)               # {"vectorizer","clf","labels"}
    vec, clf, labels = _m2["vectorizer"], _m2["clf"], _m2["labels"]
    X = vec.transform([text or ""])

    if hasattr(clf, "predict_proba"):
        probs = clf.predict_proba(X)[0]
        ranked = sorted(
            ((labels[i], float(p)) for i, p in enumerate(probs) if labels[i] != "Other"),
            key=lambda t: t[1], reverse=True,
        )
        picked = [lbl for lbl, p in ranked if p >= threshold][:top_k]
        if not picked and ranked and ranked[0][1] >= 0.08:
            picked = [ranked[0][0]]
        return picked

    pred = clf.predict(X)[0]                 # fallback if no proba
    return [labels[i] for i, v in enumerate(pred) if v == 1 and labels[i] != "Other"]
