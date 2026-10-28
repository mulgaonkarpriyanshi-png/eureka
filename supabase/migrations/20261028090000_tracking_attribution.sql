-- Eureka Trips attribution and unified lead capture.
-- Safe to rerun: existing tables/data are preserved and columns use IF NOT EXISTS.

alter table if exists public.callback_requests
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term text,
  add column if not exists utm_content text,
  add column if not exists utm_id text,
  add column if not exists fbclid text;

alter table if exists public.brochure_leads
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term text,
  add column if not exists utm_content text,
  add column if not exists utm_id text,
  add column if not exists fbclid text;

alter table if exists public.custom_trip_enquiries
  add column if not exists utm_id text;

create table if not exists public.website_form_leads (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event_id text,
  source_form text not null,
  name text,
  phone text,
  email text,
  trip text,
  page text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  utm_id text,
  fbclid text
);

create unique index if not exists website_form_leads_event_id_key
  on public.website_form_leads (event_id)
  where event_id is not null;

alter table public.website_form_leads enable row level security;

drop policy if exists "Allow public website lead submissions" on public.website_form_leads;
create policy "Allow public website lead submissions"
  on public.website_form_leads
  for insert
  to anon
  with check (true);

grant insert on table public.website_form_leads to anon;
grant usage, select on sequence public.website_form_leads_id_seq to anon;
revoke select, update, delete on table public.website_form_leads from anon, authenticated;

create or replace view public.website_leads_dashboard
with (security_invoker = true)
as
select
  id,
  created_at,
  source_form,
  name,
  phone,
  email,
  trip,
  page,
  referrer,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_term,
  utm_content,
  utm_id,
  fbclid
from public.website_form_leads;

revoke all on public.website_leads_dashboard from public, anon, authenticated;
grant select on public.website_leads_dashboard to service_role;

