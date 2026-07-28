-- Migración 003 — tipos de rutina más allá de Push/Pull/Legs
-- Correr en el SQL Editor de Supabase. Independiente de las migraciones
-- anteriores, es seguro correrla sobre una base que ya está en uso.

alter table equipment_config add column if not exists training_style text not null default 'ppl';

-- routine_days.split_type pasa a guardar una lista de músculos separada por
-- comas (ej. "chest,shoulders") en vez de solo 'push'/'pull'/'legs', para
-- soportar rutinas por grupo muscular, torso/pierna, full body, etc.
alter table routine_days drop constraint if exists routine_days_split_type_check;
