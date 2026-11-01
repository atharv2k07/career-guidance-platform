-- Run in the Supabase SQL editor.
-- If you ran the earlier demo schema, nothing real is in it yet, so first run:
--   drop table if exists conversations, recommendations, students cascade;

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 1 and 100),
  email text not null unique check (char_length(email) <= 254),
  college text not null check (char_length(college) between 1 and 150),
  branch text not null check (char_length(branch) between 1 and 80),
  year_of_study int not null check (year_of_study between 1 and 5),
  skills text[] not null default '{}' check (cardinality(skills) <= 20),
  interests text[] not null default '{}' check (cardinality(interests) <= 20),
  career_goal text not null check (char_length(career_goal) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  rank smallint not null check (rank between 1 and 3),
  career_title text not null,
  description text not null,
  outlook text not null,
  score int not null check (score between 0 and 100),
  reason text not null,
  missing_skills text[] not null default '{}',
  generated_at timestamptz not null default now(),
  unique (student_id, rank)
);

-- One row per chat message; session_id groups a conversation, seq keeps order.
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  session_id uuid not null,
  seq bigint generated always as identity,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 4000),
  source text check (source in ('claude', 'demo')), -- how an assistant reply was produced
  created_at timestamptz not null default now()
);
create index if not exists conversations_student_session_idx on conversations (student_id, session_id, seq);

create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists students_updated_at on students;
create trigger students_updated_at before update on students
  for each row execute function set_updated_at();

-- Access: the browser never talks to the database. Only our server API routes do,
-- using the service-role key (which bypasses RLS). With RLS on and NO policies,
-- the anon/authenticated roles are denied everything.
drop policy if exists "demo insert" on students;
drop policy if exists "demo select" on students;
drop policy if exists "demo update" on students;

alter table students enable row level security;
alter table recommendations enable row level security;
alter table conversations enable row level security;

revoke all on students, recommendations, conversations from anon, authenticated;

-- Upgrade path if you created the tables from the previous version of this file:
alter table recommendations add column if not exists missing_skills text[] not null default '{}';
alter table conversations add column if not exists source text check (source in ('claude', 'demo'));
