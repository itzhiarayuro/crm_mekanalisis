-- Safe to run on the canonical Bd_clientes database after 001_initial.sql.
-- Existing contracts are always real contracts unless deliberately marked otherwise.
alter table contracts add column if not exists is_test boolean not null default false;
