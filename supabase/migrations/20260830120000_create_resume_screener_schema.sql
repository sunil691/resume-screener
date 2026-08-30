-- Resume Screener: core relational data model and private resume storage.
-- Apply with `supabase db push` after linking this directory to a Supabase project.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) > 0),
  company text not null check (char_length(btrim(company)) > 0),
  description text not null check (char_length(btrim(description)) > 0),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(btrim(full_name)) > 0),
  address text not null check (char_length(btrim(address)) > 0),
  phone text not null check (char_length(btrim(phone)) > 0),
  email text not null check (char_length(btrim(email)) > 0),
  age integer not null check (age > 0),
  current_location text not null check (char_length(btrim(current_location)) > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete restrict,
  candidate_id uuid not null references public.candidates(id) on delete restrict,
  resume_file_path text not null check (char_length(btrim(resume_file_path)) > 0),
  resume_text text,
  analysis_status text not null default 'pending' check (analysis_status in ('pending', 'processing', 'completed', 'failed')),
  analysis_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.resume_analyses (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  match_score integer not null check (match_score between 0 and 100),
  fit_summary text not null check (char_length(btrim(fit_summary)) > 0),
  strengths jsonb not null default '[]'::jsonb,
  gaps jsonb not null default '[]'::jsonb,
  follow_up_questions jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  model text not null check (char_length(btrim(model)) > 0),
  prompt_version text not null check (char_length(btrim(prompt_version)) > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (jsonb_typeof(strengths) = 'array'),
  check (jsonb_typeof(gaps) = 'array'),
  check (jsonb_typeof(follow_up_questions) = 'array'),
  check (jsonb_typeof(evidence) = 'array')
);

create index jobs_status_idx on public.jobs(status);
create index jobs_created_at_idx on public.jobs(created_at desc);
create index applications_job_id_idx on public.applications(job_id);
create index applications_candidate_id_idx on public.applications(candidate_id);
create index applications_created_at_idx on public.applications(created_at desc);
create index applications_analysis_status_idx on public.applications(analysis_status);
-- The unique constraint on resume_analyses.application_id also creates its required index.

create trigger jobs_set_updated_at before update on public.jobs for each row execute function public.set_updated_at();
create trigger candidates_set_updated_at before update on public.candidates for each row execute function public.set_updated_at();
create trigger applications_set_updated_at before update on public.applications for each row execute function public.set_updated_at();
create trigger resume_analyses_set_updated_at before update on public.resume_analyses for each row execute function public.set_updated_at();

alter table public.jobs enable row level security;
alter table public.candidates enable row level security;
alter table public.applications enable row level security;
alter table public.resume_analyses enable row level security;

-- Intentionally no table policies yet. With RLS enabled, anon/authenticated clients
-- cannot read or write any table. Later public/admin flows will use narrowly scoped
-- policies or validated server-side actions; analysis data must never be public.

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do update set public = false;

-- storage.objects is RLS-protected by Supabase. No object policy is introduced here,
-- so resumes remain inaccessible to browser roles until a future scoped policy exists.
