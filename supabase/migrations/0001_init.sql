-- PayPilot AI initial schema. Money = integer minor units (cents). Every row is owned by a user.
create extension if not exists "pgcrypto";

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  business_name text,
  default_currency text not null default 'USD',
  created_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  email text,
  created_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  client_id uuid not null references clients(id) on delete restrict,
  number text not null,
  status text not null default 'draft' check (status in ('draft','sent','paid','overdue','void')),
  currency text not null default 'USD',
  total_minor bigint not null default 0,
  issue_date date not null default current_date,
  due_date date not null,
  notes text,
  paypal_invoice_id text unique,
  paypal_pay_url text,
  created_at timestamptz not null default now(),
  unique (user_id, number)
);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price_minor bigint not null
);

-- Payments received (synced from PayPal Sandbox via webhook or manual sync)
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  invoice_id uuid references invoices(id) on delete set null,
  paypal_transaction_id text not null unique,
  amount_minor bigint not null,
  fee_minor bigint not null default 0,
  currency text not null default 'USD',
  status text not null check (status in ('completed','pending','refunded','failed')),
  payer_email text,
  received_at timestamptz not null
);

-- Raw webhook log: idempotency + debugging
create table webhook_events (
  id text primary key,                -- PayPal event id
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  received_at timestamptz not null default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','tool')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Actions Gemini proposes (e.g. send reminder). Nothing runs until the user confirms.
create table pending_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  action_type text not null,          -- 'send_invoice' | 'send_reminder' | 'create_invoice' ...
  params jsonb not null,
  status text not null default 'proposed' check (status in ('proposed','confirmed','executed','rejected','failed')),
  result jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index on invoices (user_id, status, due_date);
create index on payments (user_id, received_at desc);
create index on messages (conversation_id, created_at);

-- Row Level Security: users only see their own rows
alter table profiles enable row level security;
alter table clients enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table payments enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table pending_actions enable row level security;
alter table webhook_events enable row level security; -- no policies: service role only

create policy "own profile" on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own clients" on clients for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own invoices" on invoices for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own invoice items" on invoice_items for all
  using (exists (select 1 from invoices i where i.id = invoice_id and i.user_id = auth.uid()))
  with check (exists (select 1 from invoices i where i.id = invoice_id and i.user_id = auth.uid()));
create policy "own payments" on payments for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own conversations" on conversations for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own messages" on messages for all
  using (exists (select 1 from conversations c where c.id = conversation_id and c.user_id = auth.uid()))
  with check (exists (select 1 from conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy "own actions" on pending_actions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
