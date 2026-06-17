-- ============================================================
--  PathCompanion AI — Database Schema (Supabase / PostgreSQL)
--  Phase 1 foundation: 12 tables + agent_events bus
--  Run this in the Supabase SQL Editor.
-- ============================================================

-- ---- Extensions -------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists vector;        -- pgvector (768-d embeddings)

-- ---- Helper: auto-update updated_at ----------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ============================================================
-- 1. profiles  (master user profile; 1:1 with auth.users)
-- ============================================================
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  target_role text,
  location    text,
  prefs       jsonb default '{}'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- ============================================================
-- 2. skills  (shared memory — every agent reads/writes this)
-- ============================================================
create table if not exists skills (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  proficiency int  default 0 check (proficiency between 0 and 100),
  source      text default 'manual',  -- manual | learning | resume | journal
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (user_id, name)
);
create index if not exists idx_skills_user on skills(user_id);
create trigger trg_skills_updated before update on skills
  for each row execute function set_updated_at();

-- ============================================================
-- 3. job_postings  (aggregated jobs + semantic embedding) — SHARED
-- ============================================================
create table if not exists job_postings (
  id          uuid primary key default gen_random_uuid(),
  source      text,                 -- remotive | adzuna | arbeitnow ...
  external_id text,
  title       text not null,
  company     text,
  location    text,
  remote      boolean default false,
  description text,
  url         text,
  embedding   vector(768),
  posted_at   timestamptz,
  fetched_at  timestamptz default now(),
  unique (source, external_id)
);
create index if not exists idx_jobs_embedding
  on job_postings using hnsw (embedding vector_cosine_ops);

-- ============================================================
-- 4. matches  (job <-> user hybrid score)
-- ============================================================
create table if not exists matches (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  job_id         uuid not null references job_postings(id) on delete cascade,
  score          numeric(5,2),
  matched_skills text[] default '{}',
  missing_skills text[] default '{}',
  created_at     timestamptz default now(),
  unique (user_id, job_id)
);
create index if not exists idx_matches_user on matches(user_id);

-- ============================================================
-- 5. gap_analyses  (present vs missing skills for a job/goal)
-- ============================================================
create table if not exists gap_analyses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  job_id        uuid references job_postings(id) on delete set null,
  goal_text     text,
  present_skills jsonb default '[]'::jsonb,
  missing_skills jsonb default '[]'::jsonb,   -- [{skill, importance}]
  status        text default 'fresh',          -- fresh | stale
  created_at    timestamptz default now()
);
create index if not exists idx_gaps_user on gap_analyses(user_id);

-- ============================================================
-- 6. learning_plans  (ordered free resources per missing skill)
-- ============================================================
create table if not exists learning_plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  gap_id      uuid references gap_analyses(id) on delete set null,
  skill_name  text not null,
  resources   jsonb default '[]'::jsonb,        -- [{title,url,type,done}]
  progress    int  default 0 check (progress between 0 and 100),
  status      text default 'active',
  created_at  timestamptz default now()
);
create index if not exists idx_plans_user on learning_plans(user_id);

-- ============================================================
-- 7. resumes  (master + tailored; category from Model 1; embedding)
-- ============================================================
create table if not exists resumes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         text default 'master',           -- master | tailored
  job_id       uuid references job_postings(id) on delete set null,
  category     text,                             -- predicted by resume classifier
  content      jsonb default '{}'::jsonb,
  ats_score    int,
  embedding    vector(768),
  needs_refresh boolean default false,          -- set by the cascade
  created_at   timestamptz default now()
);
create index if not exists idx_resumes_user on resumes(user_id);
create index if not exists idx_resumes_embedding
  on resumes using hnsw (embedding vector_cosine_ops);

-- ============================================================
-- 8. interview_sessions
-- ============================================================
create table if not exists interview_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  job_id       uuid references job_postings(id) on delete set null,
  type         text default 'technical',
  anxiety_pre  int check (anxiety_pre between 0 and 10),
  anxiety_post int check (anxiety_post between 0 and 10),
  score        numeric(5,2),
  created_at   timestamptz default now()
);
create index if not exists idx_sessions_user on interview_sessions(user_id);

-- ============================================================
-- 9. interview_turns  (Q/A per session)
-- ============================================================
create table if not exists interview_turns (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  session_id  uuid not null references interview_sessions(id) on delete cascade,
  idx         int,
  question    text,
  answer_transcript text,
  feedback    jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);
create index if not exists idx_turns_session on interview_turns(session_id);

-- ============================================================
-- 10. career_paths
-- ============================================================
create table if not exists career_paths (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  goal        text,
  stages      jsonb default '[]'::jsonb,
  created_at  timestamptz default now()
);
create index if not exists idx_paths_user on career_paths(user_id);

-- ============================================================
-- 11. milestones  (per-stage skills + duration)
-- ============================================================
create table if not exists milestones (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  path_id       uuid not null references career_paths(id) on delete cascade,
  stage_name    text,
  order_idx     int,
  required_skills text[] default '{}',
  duration_months int,
  tips          text,
  created_at    timestamptz default now()
);
create index if not exists idx_milestones_path on milestones(path_id);

-- ============================================================
-- 12. agent_events  (shared event bus → interconnected cascade)
-- ============================================================
create table if not exists agent_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,           -- e.g. skill_learned | resume_updated
  payload     jsonb default '{}'::jsonb,
  processed   boolean default false,
  created_at  timestamptz default now()
);
create index if not exists idx_events_user on agent_events(user_id);
create index if not exists idx_events_unprocessed on agent_events(processed) where processed = false;

-- ============================================================
--  ROW-LEVEL SECURITY
--  Each user can only touch their own rows. job_postings is a
--  shared catalogue: readable by any signed-in user, written
--  only by the backend service role (which bypasses RLS).
-- ============================================================
alter table profiles            enable row level security;
alter table skills              enable row level security;
alter table job_postings        enable row level security;
alter table matches             enable row level security;
alter table gap_analyses        enable row level security;
alter table learning_plans      enable row level security;
alter table resumes             enable row level security;
alter table interview_sessions  enable row level security;
alter table interview_turns     enable row level security;
alter table career_paths        enable row level security;
alter table milestones          enable row level security;
alter table agent_events        enable row level security;

-- profiles keyed by id (= auth.uid())
create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- shared job catalogue: read for any authenticated user
create policy "read jobs" on job_postings
  for select to authenticated using (true);

-- per-user tables: full access to own rows only
do $$
declare t text;
begin
  foreach t in array array[
    'skills','matches','gap_analyses','learning_plans','resumes',
    'interview_sessions','interview_turns','career_paths','milestones','agent_events'
  ] loop
    execute format(
      'create policy "own rows" on %I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
  end loop;
end $$;

-- ============================================================
--  Auto-create a profile row when a new auth user signs up
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
--  Done. 12 tables + agent_events, pgvector, HNSW, RLS enabled.
-- ============================================================
