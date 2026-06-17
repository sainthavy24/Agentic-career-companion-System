# ML — Trained Models

Two custom models (training notebooks live here).

## Model 1 — Resume Category Classifier (Phase 3)
- Dataset: Kaggle Resume Dataset (2,400+ resumes, 24 categories)
- Baseline: TF-IDF + Logistic Regression/SVM → DistilBERT fine-tune
- Targets: ≥85% accuracy, ≥0.80 macro-F1; benchmarked vs zero-shot LLM
- Output: `model1_resume_classifier/` (saved model) + evaluation notebook

## Model 2 — Skill Extraction (Phase 4)
- Labels: curated vocabulary from ESCO taxonomy
- Training text: LinkedIn Job Postings (LLM-assisted weak labelling)
- Model: multi-label DistilBERT (sigmoid + BCE); target ≥0.70 micro-F1
- Output: `model2_skill_extractor/` (saved model) + evaluation notebook

Trained on Google Colab (free GPU); served from `backend/` model-inference module.
