create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'landing',
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table subscribers enable row level security;

create index if not exists idx_subscribers_status on subscribers (status);
