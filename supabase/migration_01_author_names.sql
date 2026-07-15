-- Fix workouts.user_id FK to reference public.profiles instead of auth.users.
-- PostgREST resolves relationships from FK constraints, so it couldn't find
-- the author:profiles(...) join when the FK pointed at auth.users directly.
-- profiles.id is 1:1 with auth.users.id, so the data stays the same.

alter table public.workouts
  drop constraint workouts_user_id_fkey;

alter table public.workouts
  add constraint workouts_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;
