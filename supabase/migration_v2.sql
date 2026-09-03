-- V2: contas sociais, agendamento e unicidade de presets
create table if not exists social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('instagram','facebook','youtube','tiktok')),
  account_id text not null,
  username text default '',
  access_token text,
  token_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, platform, account_id)
);

create table if not exists scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  video_id uuid not null references videos(id) on delete cascade,
  platform text not null,
  publish_at timestamptz not null,
  caption text default '',
  status text not null default 'scheduled' check (status in ('scheduled','processing','published','error','cancelled')),
  external_id text,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_scheduled_posts_due on scheduled_posts(status,publish_at);

alter table social_accounts enable row level security;
alter table scheduled_posts enable row level security;
-- Social access tokens are server-only. No authenticated SELECT/INSERT/UPDATE/DELETE policy is created for this table.
drop policy if exists "scheduled posts own" on scheduled_posts;
create policy "scheduled posts own" on scheduled_posts for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create unique index if not exists ux_presets_project_name on presets(project_id,name);
