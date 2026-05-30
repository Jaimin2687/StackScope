create extension if not exists "pgcrypto";

create table if not exists user_legal_consents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  consent_version varchar(10) not null,
  ip_address varchar(45),
  accepted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists user_legal_consents_user_id_idx
  on user_legal_consents(user_id);

alter table user_legal_consents enable row level security;

create policy "legal_consents_select_own"
  on user_legal_consents
  for select
  using (auth.uid() = user_id or auth.role() = 'service_role');

create policy "legal_consents_insert_own"
  on user_legal_consents
  for insert
  with check (auth.uid() = user_id or auth.role() = 'service_role');
