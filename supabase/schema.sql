-- Run this once in Supabase > SQL Editor
create table portfolios (
  id uuid primary key default gen_random_uuid(),
  full_name text not null, email text, contact_number text, address text,
  about text, photo text,
  education jsonb default '[]', skills jsonb default '[]', projects jsonb default '[]',
  experience jsonb default '[]', links jsonb default '[]',
  template int not null default 1 check (template in (1,2,3)),
  created_at timestamptz default now(), updated_at timestamptz default now());
alter table portfolios enable row level security;
create policy "public crud" on portfolios for all using (true) with check (true);
