-- ============================================================
--  Gym Tracker — database schema
--  Run this in the Supabase SQL Editor (one paste, top to bottom).
--  Safe to re-run: drops and recreates policies/triggers.
-- ============================================================

-- ----- Tables ------------------------------------------------

-- One row per user, linked to the built-in auth.users table.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null,
  created_at  timestamptz not null default now()
);

-- The catalogue of movements. Defaults are shared; users can add their own.
create table if not exists public.exercises (
  id           bigint generated always as identity primary key,
  name         text not null,
  muscle_group text,
  is_default   boolean not null default false,
  created_by   uuid references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now()
);

-- A single training session.
create table if not exists public.workouts (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  date        date not null default current_date,
  notes       text,
  created_at  timestamptz not null default now()
);

-- The actual logged work: one row per set.
create table if not exists public.sets (
  id           bigint generated always as identity primary key,
  workout_id   bigint not null references public.workouts (id) on delete cascade,
  exercise_id  bigint not null references public.exercises (id),
  weight       numeric(6,2) not null,   -- in whatever unit you decide (kg here)
  reps         integer not null,
  set_order    integer not null default 1,
  created_at   timestamptz not null default now()
);

create index if not exists sets_workout_idx   on public.sets (workout_id);
create index if not exists workouts_user_date on public.workouts (user_id, date);

-- ----- Auto-create a profile when someone signs up ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----- Row-level security -----------------------------------
-- Model for a friends-only group: everyone in the project can READ
-- everyone's data (that's the shared feed), but can only WRITE their own.

alter table public.profiles  enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts  enable row level security;
alter table public.sets      enable row level security;

-- profiles: readable by any signed-in user; you edit only your own row.
drop policy if exists "profiles read"   on public.profiles;
drop policy if exists "profiles update" on public.profiles;
create policy "profiles read"   on public.profiles for select to authenticated using (true);
create policy "profiles update" on public.profiles for update to authenticated using (auth.uid() = id);

-- exercises: everyone reads. You may add custom ones and manage your own.
drop policy if exists "exercises read"   on public.exercises;
drop policy if exists "exercises insert" on public.exercises;
drop policy if exists "exercises modify" on public.exercises;
drop policy if exists "exercises delete" on public.exercises;
create policy "exercises read"   on public.exercises for select to authenticated using (true);
create policy "exercises insert" on public.exercises for insert to authenticated with check (auth.uid() = created_by);
create policy "exercises modify" on public.exercises for update to authenticated using (auth.uid() = created_by);
create policy "exercises delete" on public.exercises for delete to authenticated using (auth.uid() = created_by);

-- workouts: everyone reads (shared feed); you write only your own.
drop policy if exists "workouts read"   on public.workouts;
drop policy if exists "workouts insert" on public.workouts;
drop policy if exists "workouts modify" on public.workouts;
drop policy if exists "workouts delete" on public.workouts;
create policy "workouts read"   on public.workouts for select to authenticated using (true);
create policy "workouts insert" on public.workouts for insert to authenticated with check (auth.uid() = user_id);
create policy "workouts modify" on public.workouts for update to authenticated using (auth.uid() = user_id);
create policy "workouts delete" on public.workouts for delete to authenticated using (auth.uid() = user_id);

-- sets: readable by all; writable only when the parent workout is yours.
drop policy if exists "sets read"   on public.sets;
drop policy if exists "sets insert" on public.sets;
drop policy if exists "sets modify" on public.sets;
drop policy if exists "sets delete" on public.sets;
create policy "sets read" on public.sets for select to authenticated using (true);
create policy "sets insert" on public.sets for insert to authenticated
  with check (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));
create policy "sets modify" on public.sets for update to authenticated
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));
create policy "sets delete" on public.sets for delete to authenticated
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));

-- ----- Seed a starter set of common lifts --------------------

insert into public.exercises (name, muscle_group, is_default) values
  ('Back Squat',        'Legs',      true),
  ('Front Squat',       'Legs',      true),
  ('Deadlift',          'Back',      true),
  ('Romanian Deadlift', 'Hamstrings',true),
  ('Bench Press',       'Chest',     true),
  ('Incline Bench',     'Chest',     true),
  ('Overhead Press',    'Shoulders', true),
  ('Barbell Row',       'Back',      true),
  ('Pull-up',           'Back',      true),
  ('Lat Pulldown',      'Back',      true),
  ('Leg Press',         'Legs',      true),
  ('Lunge',             'Legs',      true),
  ('Bicep Curl',        'Arms',      true),
  ('Tricep Pushdown',   'Arms',      true),
  ('Lateral Raise',     'Shoulders', true)
on conflict do nothing;
