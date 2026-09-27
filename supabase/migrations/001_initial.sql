-- This CRM is installed in the existing Bd_clientes project. `clientes` remains
-- the canonical customer table; contract data is additive and never duplicates it.
create extension if not exists pgcrypto;

do $$
begin
  create type contract_status as enum (
    'DRAFT', 'PROCESSING', 'READY', 'PENDING', 'SIGNED', 'EXPIRED', 'REVOKED', 'FAILED'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clientes(id) on delete restrict,
  cotizacion_id uuid references cotizaciones(id) on delete set null,
  title text not null,
  status contract_status not null default 'DRAFT',
  -- Test contracts may be erased after signing. Real contracts are retained as evidence.
  is_test boolean not null default false,
  -- A signing snapshot is populated from clientes when the contract is created.
  signer_name text not null,
  signer_email text,
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

create table if not exists contract_events (
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

create index if not exists contracts_client_idx on contracts(client_id);
create index if not exists contracts_cotizacion_idx on contracts(cotizacion_id);
create index if not exists contracts_status_idx on contracts(status);
create index if not exists contracts_token_hash_idx on contracts(token_hash);
create index if not exists contract_events_contract_idx on contract_events(contract_id, id);

alter table contracts enable row level security;
alter table contract_events enable row level security;

-- No public policies: the server accesses contract data only through its secret key.
insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do update set public = false;
