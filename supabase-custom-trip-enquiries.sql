create table if not exists public.custom_trip_enquiries (
  id bigint generated always as identity primary key,
  submitted_at timestamptz not null default now(),
  lead_id text,
  partial boolean not null default false,
  name text not null,
  phone text not null,
  email text not null,
  message text,
  trip_type text,
  travel_window text,
  travelling_with text,
  occasion text,
  trip_scope text,
  destination_note text,
  call_time_preference text,
  contact_preference text,
  intent_score integer,
  value_score integer,
  lead_tier text,
  page text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  created_at timestamptz not null default now()
);

alter table public.custom_trip_enquiries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'custom_trip_enquiries'
      and policyname = 'Allow public custom trip enquiry submissions'
  ) then
    create policy "Allow public custom trip enquiry submissions"
      on public.custom_trip_enquiries
      for insert
      to anon
      with check (true);
  end if;
end $$;

grant insert on table public.custom_trip_enquiries to anon;
grant usage, select on sequence public.custom_trip_enquiries_id_seq to anon;
revoke select, update, delete on table public.custom_trip_enquiries from anon;
