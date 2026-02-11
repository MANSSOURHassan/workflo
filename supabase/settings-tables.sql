-- Create API Keys table
create table if not exists api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  key text not null, -- Stores the actual key (encrypted in real world, plain for MVP/Demo per UI)
  last_used_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS
alter table api_keys enable row level security;

-- Policies
create policy "Users can view their own api keys"
  on api_keys for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own api keys"
  on api_keys for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own api keys"
  on api_keys for delete
  using ( auth.uid() = user_id );

-- Create Webhooks table
create table if not exists webhooks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  url text not null,
  events text[] not null,
  secret text not null,
  is_active boolean default true,
  last_triggered_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS
alter table webhooks enable row level security;

-- Policies
create policy "Users can view their own webhooks"
  on webhooks for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own webhooks"
  on webhooks for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own webhooks"
  on webhooks for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own webhooks"
  on webhooks for delete
  using ( auth.uid() = user_id );
