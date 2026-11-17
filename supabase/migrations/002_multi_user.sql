-- Moves an existing single-company database to per-user data.
-- Run once in Supabase → SQL Editor, AFTER the first user has signed up:
-- existing posts and settings are handed to the oldest user (the owner).

begin;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);
alter table public.users enable row level security;

do $$
begin
  if not exists (select 1 from public.users) then
    raise exception 'No users yet. Sign up on /signup first, then run this migration again.';
  end if;
end $$;

-- Posts belong to a user.
alter table public.posts add column if not exists user_id uuid references public.users (id) on delete cascade;
update public.posts
   set user_id = (select id from public.users order by created_at limit 1)
 where user_id is null;
alter table public.posts alter column user_id set not null;
create index if not exists posts_user_idx on public.posts (user_id, updated_at desc);

-- Settings: one row per user (id = user uuid). Copy the old global row to the owner.
alter table public.settings alter column id drop default;
insert into public.settings (id, ai_credits_percent, ai_credits_posts_left, brand_voice, banned_words)
select (select id::text from public.users order by created_at limit 1),
       ai_credits_percent, ai_credits_posts_left, brand_voice, banned_words
  from public.settings
 where id = 'global'
on conflict (id) do nothing;
delete from public.settings where id = 'global';

-- Connected social accounts replace the old fixed accounts table.
create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  platform text not null check (platform in ('linkedin', 'instagram', 'facebook')),
  account_id text not null,
  account_name text not null,
  access_token text not null,
  expires_at timestamptz,
  status text not null default 'connected' check (status in ('connected', 'reconnect')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform)
);
alter table public.social_connections enable row level security;

drop table if exists public.accounts;

commit;
