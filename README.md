# PathCompanion AI

An agentic career & talent companion — **6 cooperating AI agents** + **2 custom-trained ML models** (hybrid intelligence), built on free-tier services.

> Development Project (CIS 6035) — B.Sc (Hons) Software Engineering.
> See `Proposal_PathCompanionAI_EN_v2.docx` and `PathCompanion_AI_Planning_Pack.html` for the full design.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite (clean light / professional UI) |
| Backend | FastAPI (async) + LangGraph orchestration |
| Database | Supabase — PostgreSQL + pgvector + Row-Level Security |
| Trained models | scikit-learn (baseline) + DistilBERT (Hugging Face / PyTorch) |
| LLM / voice | Gemini Flash · Groq Llama 3.3 · Groq Whisper · Edge-TTS |

## Repo structure

```
backend/    FastAPI app (API routes, agents, model-inference)
frontend/   React + Vite app
db/         schema.sql — Supabase database (run in SQL editor)
ml/         model training notebooks (Model 1 + Model 2)
docs/       proposal, planning pack, design artefacts
```

## Getting started (Phase 1)

### 1. Database
Create a Supabase project, then open **SQL Editor** and run [`db/schema.sql`](db/schema.sql).
It creates 12 tables + `agent_events`, enables `pgvector`, adds HNSW indexes and RLS policies.

### 2. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example ../.env        # then fill in keys
uvicorn main:app --reload         # http://localhost:8000/health
```

### 3. Frontend
```bash
npm create vite@latest frontend -- --template react
cd frontend && npm install && npm run dev   # http://localhost:5173
```

### 4. Environment
Copy `.env.example` → `.env` and fill in Supabase + Gemini + Groq keys (all free tiers).

## Build phases (16 weeks)

1. **Foundations** — schema, auth, app shell  ← _current_
2. Job Scout (APIs + embeddings + matching)
3. ML Model 1 — Resume Classifier
4. ML Model 2 — Skill Extractor
5. Resume Architect + Learning (+ cascade)
6. Mock Interview (voice + panic)
7. Career Path + full cascade
8. Test + evaluate + deploy + dissertation
