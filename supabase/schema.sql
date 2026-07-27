-- Tu Personal Trainer — schema inicial
-- Correr esto una vez en el SQL Editor de tu proyecto de Supabase (Project > SQL Editor > New query).

create extension if not exists pgcrypto;

-- ---------- equipment_config: una fila por usuario ----------
create table if not exists equipment_config (
  user_id uuid primary key references auth.users(id) on delete cascade,
  barbell_enabled boolean not null default false,
  barbell_weight numeric not null default 20,
  plates jsonb not null default '[]',           -- [{"weight":10,"qty":2}, ...]
  dumbbells_enabled boolean not null default false,
  dumbbell_weights jsonb not null default '[]', -- [8,10,12]
  kettlebell_enabled boolean not null default false,
  kettlebell_weights jsonb not null default '[]',
  bench boolean not null default false,
  pullup_bar boolean not null default false,
  bands boolean not null default false,
  cable boolean not null default false,
  days_per_week integer not null default 3,
  updated_at timestamptz not null default now()
);

-- ---------- routines ----------
create table if not exists routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Push Pull Legs',
  days_per_week integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists routine_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid not null references routines(id) on delete cascade,
  day_order integer not null,       -- 0-based orden en la semana
  label text not null,              -- "Push A"
  split_type text not null check (split_type in ('push', 'pull', 'legs'))
);

create table if not exists routine_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_day_id uuid not null references routine_days(id) on delete cascade,
  exercise_id text not null,        -- id del catálogo estático (src/data/exercises.js)
  position integer not null,
  sets integer not null default 3,
  reps_min integer not null default 8,
  reps_max integer not null default 12
);

-- ---------- workout_logs: una fila por serie realizada ----------
create table if not exists workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_day_id uuid references routine_days(id) on delete set null,
  exercise_id text not null,
  performed_at timestamptz not null default now(),
  set_number integer not null,
  weight_kg numeric,
  reps integer
);

-- ---------- body_metrics ----------
create table if not exists body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recorded_at date not null default current_date,
  weight_kg numeric not null
);

-- ---------- Row Level Security: cada usuario ve y toca solo lo suyo ----------
alter table equipment_config enable row level security;
alter table routines enable row level security;
alter table routine_days enable row level security;
alter table routine_exercises enable row level security;
alter table workout_logs enable row level security;
alter table body_metrics enable row level security;

create policy "own equipment_config" on equipment_config
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own routines" on routines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own routine_days" on routine_days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own routine_exercises" on routine_exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own workout_logs" on workout_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own body_metrics" on body_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_routine_days_routine on routine_days(routine_id);
create index if not exists idx_routine_exercises_day on routine_exercises(routine_day_id);
create index if not exists idx_workout_logs_user_exercise on workout_logs(user_id, exercise_id, performed_at);
create index if not exists idx_body_metrics_user on body_metrics(user_id, recorded_at);
