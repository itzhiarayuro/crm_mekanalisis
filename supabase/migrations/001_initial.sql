create extension if not exists pgcrypto;

create type contract_status as enum (
  'DRAFT', 'PROCESSING', 'READY', 'PENDING', 'SIGNED', 'EXPIRED', 'REVOKED', 'FAILED'
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table contracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete restrict,
  title text not null,
  status contract_status not null default 'DRAFT',
  signer_name text not null,
  signer_email text not null,
  original_path text,
  pdf_path text,
  signed_path text,
  document_hash text,
  final_hash text,
  public_id uuid not null default gen_random_uuid() unique,
  token_hash text unique,
  expires_at timestamptz,
  otp_hash text,
  otp_expires_at timestamptz,
  otp_attempts integer not null default 0,
  otp_blocked boolean not null default false,
  last_otp_sent_at timestamptz,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  view_count integer not null default 0,
  read_at timestamptz,
  verified_at timestamptz,
  signed_at timestamptz,
  revoked_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table contract_events (
  id bigint generated always as identity primary key,
  contract_id uuid not null references contracts(id) on delete cascade,
  type text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip text,
  user_agent text,
  prev_hash text,
  hash text not null,
  created_at timestamptz not null default now()
);

create index contracts_client_idx on contracts(client_id);
create index contracts_status_idx on contracts(status);
create index contracts_token_hash_idx on contracts(token_hash);
create index contract_events_contract_idx on contract_events(contract_id, id);

alter table clients enable row level security;
alter table contracts enable row level security;
alter table contract_events enable row level security;

-- No public policies: the application accesses these tables only with the service-role key.

insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do update set public = false;
