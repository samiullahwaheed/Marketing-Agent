
create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  post_date text not null,                 -- "2026-11-04" (author's local date)
  post_time text not null,                 -- "09:00"     (author's local time)
  scheduled_at timestamptz,                -- null when post_now
  post_now boolean not null default false, -- publish as soon as it is approved
  platforms text[] not null,
  image_mode text not null default 'ai' check (image_mode in ('ai', 'upload')),
  image_prompt text,
  image_url text,
  audience text,
  language text,
  content jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  status text not null default 'processing'
    check (status in ('processing', 'waiting_approval', 'scheduled', 'published', 'failed', 'rejected')),
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  last_error text,
  last_attempt_at timestamptz,
  results jsonb not null default '{}'::jsonb,
  rejection_reason text,
  rejection_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_status_idx on public.posts (status);
create index if not exists posts_date_idx on public.posts (post_date, post_time);
create index if not exists posts_updated_idx on public.posts (updated_at desc);

create table if not exists public.accounts (
  platform text primary key check (platform in ('linkedin', 'instagram', 'facebook')),
  label text not null,
  status text not null default 'connected' check (status in ('connected', 'reconnect', 'not_connected')),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id text primary key default 'global',
  ai_credits_percent integer not null default 100,
  ai_credits_posts_left integer not null default 50,
  brand_voice jsonb not null default '{"tone":"","keywords":"","sampleText":"","doNots":""}'::jsonb,
  banned_words text[] not null default '{}'
);

alter table public.posts enable row level security;
alter table public.accounts enable row level security;
alter table public.settings enable row level security;

-- Merges per-platform publish results atomically. n8n reports each platform
-- in its own callback, often in parallel, so a read-modify-write in the app
-- would lose results. The UPDATE row lock serialises concurrent callers.
create or replace function public.apply_publish_results(p_id uuid, p_results jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.posts;
  err text;
  all_resolved boolean;
  all_published boolean;
begin
  select string_agg(e.value->>'error', '; ')
    into err
    from jsonb_each(p_results) as e
   where e.value->>'status' = 'failed' and e.value ? 'error';

  update public.posts
     set results = results || p_results,
         last_error = coalesce(err, last_error),
         updated_at = now()
   where id = p_id
  returning * into r;

  if not found then
    raise exception 'Post not found';
  end if;

  select bool_and(coalesce(r.results->p->>'status', '') in ('published', 'failed')),
         bool_and(coalesce(r.results->p->>'status', '') = 'published')
    into all_resolved, all_published
    from unnest(r.platforms) as p;

  if all_resolved then
    update public.posts
       set status = case when all_published then 'published' else 'failed' end,
           last_error = case when all_published then null else last_error end,
           updated_at = now()
     where id = p_id;
  end if;
end;
$$;

revoke execute on function public.apply_publish_results(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.apply_publish_results(uuid, jsonb) to service_role;

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do update set public = true;
