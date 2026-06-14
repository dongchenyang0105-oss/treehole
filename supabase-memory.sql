-- 用户记忆摘要表（在 Supabase SQL Editor 中执行）
create table user_memory (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  summary text not null default '',
  updated_at timestamptz default now()
);

alter table user_memory enable row level security;

create policy "Users read own memory"
  on user_memory for select using (auth.uid() = user_id);

create policy "Users insert own memory"
  on user_memory for insert with check (auth.uid() = user_id);

create policy "Users update own memory"
  on user_memory for update using (auth.uid() = user_id);

create policy "Users delete own memory"
  on user_memory for delete using (auth.uid() = user_id);
