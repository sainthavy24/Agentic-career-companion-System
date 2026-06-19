# PathCompanion AI — Documentation & Screenshot Checklist

## A. Screenshots — ML models (the core requirement, MOST important)

### Model 1 — Resume Classifier (Colab)
- [ ] Dataset loaded: `rows: 2484`, `categories: 24`
- [ ] Category distribution bar chart
- [ ] Train/test split: `train: 2235  test: 249` (90/10)
- [ ] Baseline metrics: Accuracy + Macro-F1 + classification report
- [ ] Baseline confusion matrix
- [ ] DistilBERT training progress + final Accuracy / Macro-F1
- [ ] Comparison table (TF-IDF vs DistilBERT)

### Model 2 — Skill Extraction (Colab)
- [ ] Dataset + `NNNN samples; 25 skill labels`
- [ ] Train/test split (90/10) numbers
- [ ] Baseline micro-F1 / macro-F1 + classification report
- [ ] DistilBERT micro-F1 / macro-F1
- [ ] Comparison table

## B. Screenshots — working application
- [ ] Sign-up / Login page
- [ ] Dashboard ("Backend + Database: connected")
- [ ] Profile & Skills (skills added as chips)
- [ ] Job Scout: synced jobs + "Find my matches" with match % + matched skills
- [ ] Resume Architect: pasted resume -> predicted category (Model 1 live)
- [ ] Skill Gap: pasted job -> required skills + present/missing (Model 2 live)
- [ ] Backend interactive API: http://localhost:8000/docs

## C. Screenshots — database (proof of design + RLS)
- [ ] Supabase Table Editor: profiles, skills, job_postings, matches (with rows)
- [ ] Authentication -> Users (a registered user)
- [ ] SQL Editor showing schema ran successfully (12 tables)

## D. Final documentation (dissertation) — assemble these
- [ ] Proposal (docs/Proposal_PathCompanionAI_EN_v3.docx)
- [ ] Planning pack: architecture, screen map, wireframes (PathCompanion_AI_Planning_Pack.html)
- [ ] Architecture diagram + ER diagram (from db/schema.sql)
- [ ] ML methodology: datasets, splits (90/10), preprocessing, models, hyper-parameters
- [ ] ML results: accuracy/F1 tables, confusion matrices, baseline-vs-DistilBERT comparison
- [ ] Limitations section (truncation, class imbalance — reuse the note from proposal v3)
- [ ] Evaluation: job-match precision, model F1, latency, user feedback
- [ ] Application screenshots (section B above)
- [ ] Source code: GitHub repository link
- [ ] README / setup & user guide (already in repo)
- [ ] Testing evidence (when Phase 8 tests are added)

## E. Key numbers to quote (fill in from your runs)
- Model 1: 2,484 resumes, 24 classes, 90/10 split (2,235 / 249). DistilBERT Acc=0.823, Macro-F1=0.751 | baseline Acc=0.655, Macro-F1=0.596
- Model 2: ~11,800 postings, 25 labels, 90/10 split; micro-F1=__  macro-F1=__
- Job matching: Gemini 768-d embeddings + skill overlap (hybrid)
