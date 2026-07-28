-- Migración 002 — perfil de usuario + recordatorio de suplementos
-- Correr en el SQL Editor de Supabase. No toca las tablas de la migración
-- inicial (supabase/schema.sql), así que es seguro correrla sobre una base
-- que ya está en uso.

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  age integer,
  height_cm numeric,
  goal text check (goal in ('perder_grasa', 'ganar_musculo', 'mantenerse', 'resistencia')),
  target_weight_kg numeric,
  training_location text not null default 'casa' check (training_location in ('casa', 'gimnasio')),
  tracked_supplements jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Una fila por usuario y suplemento tomado en el día. Si existe la fila, lo tomó.
create table if not exists supplement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  supplement text not null,
  taken_at timestamptz not null default now(),
  unique (user_id, log_date, supplement)
);

alter table profiles enable row level security;
alter table supplement_logs enable row level security;

create policy "own profile" on profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own supplement_logs" on supplement_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_supplement_logs_user_date on supplement_logs(user_id, log_date);
