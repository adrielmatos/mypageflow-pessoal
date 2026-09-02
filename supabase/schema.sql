create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text default '',
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  cover_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists presets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  original_name text not null,
  storage_path text not null,
  render_path text,
  thumbnail_path text,
  size_bytes bigint default 0,
  duration_seconds numeric,
  sort_order integer default 0,
  status text not null default 'uploaded' check (status in ('uploading','uploaded','queued','processing','ready','error','scheduled','published')),
  error_message text,
  caption text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists processing_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  video_id uuid not null references videos(id) on delete cascade,
  preset_id uuid references presets(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','processing','done','error')),
  progress integer default 0,
  logs text,
  created_at timestamptz default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists idx_videos_project on videos(project_id, sort_order);
create index if not exists idx_jobs_status on processing_jobs(status, created_at);

alter table profiles enable row level security;
alter table projects enable row level security;
alter table presets enable row level security;
alter table videos enable row level security;
alter table processing_jobs enable row level security;

create policy "profile own" on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "projects own" on projects for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "presets project owner" on presets for all using (exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid())) with check (exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "videos own" on videos for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "jobs own" on processing_jobs for all using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public) values ('videos','videos',false) on conflict (id) do nothing;

create policy "videos upload own folder" on storage.objects for insert to authenticated with check (
  bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "videos read own folder" on storage.objects for select to authenticated using (
  bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "videos delete own folder" on storage.objects for delete to authenticated using (
  bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text
);
