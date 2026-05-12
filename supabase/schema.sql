create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  cadence text not null check (cadence in ('daily', 'weekly')),
  target integer not null default 1,
  color text not null default '#a78bfa',
  created_at timestamptz not null default now()
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  logged_for date not null,
  value integer not null default 1,
  created_at timestamptz not null default now(),
  unique (habit_id, logged_for)
);

create table public.task_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#a78bfa',
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.task_projects(id) on delete set null,
  parent_task_id uuid references public.tasks(id) on delete cascade,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  due_date date,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  split text,
  created_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  muscle_group text,
  created_at timestamptz not null default now()
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete set null,
  started_at timestamptz not null default now(),
  notes text
);

create table public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  sets integer not null,
  reps integer not null,
  weight numeric(8, 2) not null,
  created_at timestamptz not null default now()
);

create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_on date not null,
  weight numeric(6, 2),
  waist numeric(6, 2),
  body_fat numeric(5, 2),
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('expense', 'income')),
  color text not null default '#a78bfa'
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(10, 2) not null,
  spent_on date not null,
  note text,
  recurring boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  month date not null,
  limit_amount numeric(10, 2) not null,
  unique (user_id, category_id, month)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  horizon text not null check (horizon in ('quarter', 'year')),
  progress numeric(5, 2) not null default 0,
  target_date date,
  created_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'Europe/Warsaw',
  notification_hour time not null default '08:00',
  push_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.task_projects enable row level security;
alter table public.tasks enable row level security;
alter table public.workouts enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.exercise_logs enable row level security;
alter table public.body_metrics enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;
alter table public.notes enable row level security;
alter table public.settings enable row level security;

create policy "profiles owner access" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "habits owner access" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "habit logs owner access" on public.habit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "task projects owner access" on public.task_projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tasks owner access" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "workouts owner access" on public.workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "exercises owner access" on public.exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "workout sessions owner access" on public.workout_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "exercise logs owner access" on public.exercise_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "body metrics owner access" on public.body_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "categories owner access" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "expenses owner access" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "budgets owner access" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goals owner access" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notes owner access" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "settings owner access" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
