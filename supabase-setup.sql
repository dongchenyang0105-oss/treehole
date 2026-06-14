-- 在 Supabase SQL Editor 中执行以下内容

-- 用户消息表
create table messages (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  mode text default 'listen',
  created_at timestamptz default now()
);

-- 复盘报告表
create table reports (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  range_label text not null,
  message_count int default 0,
  created_at timestamptz default now()
);

-- 开启 Row Level Security（确保用户只能看到自己的数据）
alter table messages enable row level security;
alter table reports enable row level security;

-- RLS 策略：用户只能读写自己的数据
create policy "Users read own messages"
  on messages for select using (auth.uid() = user_id);

create policy "Users insert own messages"
  on messages for insert with check (auth.uid() = user_id);

create policy "Users delete own messages"
  on messages for delete using (auth.uid() = user_id);

create policy "Users read own reports"
  on reports for select using (auth.uid() = user_id);

create policy "Users insert own reports"
  on reports for insert with check (auth.uid() = user_id);

create policy "Users delete own reports"
  on reports for delete using (auth.uid() = user_id);
