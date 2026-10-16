-- [할일 관리] Supabase 설정. Supabase 대시보드 > SQL Editor 에 통째로 붙여 넣고 Run 하세요.
-- 사용자 한 명당 여러 줄(key)을 저장합니다.
--   day:2026-10-16 (그날 할 일) / someday / routines / settings

create table if not exists public.user_data (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key        text not null,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_data enable row level security;

-- 로그인한 본인의 데이터만 읽고 쓸 수 있습니다.
create policy "own rows: select" on public.user_data
  for select using (auth.uid() = user_id);
create policy "own rows: insert" on public.user_data
  for insert with check (auth.uid() = user_id);
create policy "own rows: update" on public.user_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows: delete" on public.user_data
  for delete using (auth.uid() = user_id);
