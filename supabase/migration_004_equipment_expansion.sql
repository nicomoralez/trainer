-- Migración 004 — equipamiento de casa (poco material) + gimnasio ocasional
-- Correr en el SQL Editor de Supabase. Independiente de las migraciones
-- anteriores, es seguro correrla sobre una base que ya está en uso.

alter table equipment_config add column if not exists wall boolean not null default false;
alter table equipment_config add column if not exists towel boolean not null default false;
alter table equipment_config add column if not exists doorway boolean not null default false;
alter table equipment_config add column if not exists chair boolean not null default false;
alter table equipment_config add column if not exists stability_ball boolean not null default false;
alter table equipment_config add column if not exists plate boolean not null default false;
alter table equipment_config add column if not exists machine boolean not null default false;
alter table equipment_config add column if not exists cardio boolean not null default false;
