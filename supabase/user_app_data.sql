create table if not exists public.user_app_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

alter table public.user_app_data enable row level security;

create policy "Users can read own app data"
on public.user_app_data
for select
using (auth.uid() = user_id);

create policy "Users can insert own app data"
on public.user_app_data
for insert
with check (auth.uid() = user_id);

create policy "Users can update own app data"
on public.user_app_data
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own app data"
on public.user_app_data
for delete
using (auth.uid() = user_id);
