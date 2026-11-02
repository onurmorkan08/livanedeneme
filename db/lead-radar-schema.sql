-- Apply in a dedicated Supabase project via SQL Editor.
-- All business tables are server-only: RLS enabled, no anon/authenticated policies.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'sales' check (role in ('admin','sales')),
  created_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  identity_key text not null unique,
  name text not null,
  license_number text,
  phone text,
  email text,
  website text,
  employee_count integer check (employee_count is null or employee_count >= 0),
  employee_count_source text,
  decision_maker text,
  observed_project_count integer not null default 0,
  contact_status text not null default 'not_contacted',
  last_contacted_at timestamptz,
  next_followup_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_record_id text not null,
  source_url text not null,
  permit_number text,
  project_name text,
  address text,
  city text not null,
  zip text,
  project_type text,
  description text,
  permit_status text,
  permit_date date,
  construction_start_date date,
  construction_end_date date,
  installation_date date,
  installation_date_confidence text not null default 'unknown' check (installation_date_confidence in ('unknown','estimated','verified')),
  developer text,
  designer text,
  architect text,
  unit_count integer,
  contractor_company_id uuid references public.companies(id) on delete set null,
  cabinet_signal text not null default 'unknown' check (cabinet_signal in ('unknown','potential','explicit')),
  door_signal text not null default 'unknown' check (door_signal in ('unknown','potential','explicit')),
  procurement_status text not null default 'unknown' check (procurement_status in ('unknown','open','quote_requested','awarded','closed')),
  sales_note text,
  score numeric(3,1) not null default 0,
  score_reasons jsonb not null default '[]'::jsonb,
  raw_source jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_record_id)
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  user_id uuid not null references auth.users(id),
  outcome text not null check (outcome in ('no_answer','wrong_number','gatekeeper','decision_maker','not_interested','already_awarded','future','plans_requested','quote_requested','meeting','negotiation','won','lost')),
  note text not null default '',
  next_followup_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.scan_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status text not null check (status in ('running','success','partial','failed')),
  fetched integer not null default 0,
  created integer not null default 0,
  updated integer not null default 0,
  errors integer not null default 0,
  error_detail text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists projects_score_idx on public.projects (score desc);
create index if not exists projects_company_idx on public.projects (contractor_company_id);
create index if not exists projects_city_idx on public.projects (city);
create index if not exists companies_followup_idx on public.companies (next_followup_at);
create index if not exists activities_company_idx on public.activities (company_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.projects enable row level security;
alter table public.activities enable row level security;
alter table public.scan_runs enable row level security;

-- Intentionally no RLS policies: only service role (server-side, never browser) can read/write.
-- Supabase Auth used for sign-in. Add user in Authentication > Users, then run:
-- insert into public.profiles (user_id, display_name, role)
-- values ('UUID-FROM-AUTH', 'Orhun', 'sales');
-- Repeat for owner as role = 'admin'.
