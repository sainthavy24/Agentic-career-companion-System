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


def extract_skills(text: str) -> list:
    """Model 2 — extract required skills (multi-label)."""
    global _m2
    if _m2 is None:
        _m2 = joblib.load(M2)               # {"vectorizer","clf","labels"}
    vec, clf, labels = _m2["vectorizer"], _m2["clf"], _m2["labels"]
    pred = clf.predict(vec.transform([text or ""]))[0]
    return [labels[i] for i, v in enumerate(pred) if v == 1]
