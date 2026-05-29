-- TradeConnect Supabase PostgreSQL Schema & RLS Policies
-- This script sets up the database, relations, automatic triggers, and RLS rules.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =========================================================================
-- 1. TABLES DEFINITIONS
-- =========================================================================

-- profiles: common profile for all users, extends auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('client', 'tradie', 'admin', 'super_admin')),
  full_name text not null,
  email text not null,
  mobile_number text,
  avatar_url text,
  account_status text not null check (account_status in ('active', 'suspended', 'pending')) default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- clients profile details
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  address text,
  city text,
  state text,
  postcode text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- tradies profile details
create table public.tradies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  business_name text,
  abn text,
  business_address text,
  city text,
  state text,
  postcode text,
  service_radius_km integer default 25,
  years_experience integer default 0,
  bio text,
  verification_status text not null check (verification_status in ('not_submitted', 'pending', 'approved', 'rejected')) default 'not_submitted',
  availability_status text not null check (availability_status in ('available', 'busy', 'unavailable')) default 'available',
  rating numeric(3,2) default 0.00,
  total_reviews integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- trade_categories: e.g. Plumbing, Electrical
create table public.trade_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- tradie_categories: maps tradies to the categories they service
create table public.tradie_categories (
  id uuid primary key default gen_random_uuid(),
  tradie_id uuid not null references public.tradies(id) on delete cascade,
  category_id uuid not null references public.trade_categories(id) on delete cascade,
  created_at timestamptz default now(),
  unique(tradie_id, category_id)
);

-- jobs: posted by clients, can be assigned to a tradie
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  assigned_tradie_id uuid references public.tradies(id) on delete set null,
  category_id uuid references public.trade_categories(id) on delete set null,
  title text not null,
  description text not null,
  location_address text,
  city text,
  state text,
  postcode text,
  preferred_date date,
  budget_min numeric,
  budget_max numeric,
  urgency text not null check (urgency in ('flexible', 'within_week', 'urgent', 'emergency')) default 'flexible',
  status text not null check (status in ('draft', 'open', 'quoting', 'assigned', 'in_progress', 'completion_requested', 'completed', 'cancelled', 'disputed')) default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- job_media: photos/videos uploaded for jobs
create table public.job_media (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  file_url text not null,
  file_type text,
  caption text,
  created_at timestamptz default now()
);

-- quotes: submitted by tradies on open jobs
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  tradie_id uuid not null references public.tradies(id) on delete cascade,
  amount numeric not null,
  estimated_duration text,
  available_date date,
  proposal_message text,
  scope_of_work text,
  inclusions text,
  exclusions text,
  terms_notes text,
  status text not null check (status in ('submitted', 'viewed', 'accepted', 'rejected', 'withdrawn')) default 'submitted',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(job_id, tradie_id)
);

-- conversations: job-based chat sessions
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  tradie_id uuid not null references public.tradies(id) on delete cascade,
  created_at timestamptz default now(),
  unique(job_id, client_id, tradie_id)
);

-- messages: inside conversations
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  attachment_url text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- tradie_documents: verification documents uploaded by tradies
create table public.tradie_documents (
  id uuid primary key default gen_random_uuid(),
  tradie_id uuid not null references public.tradies(id) on delete cascade,
  document_type text not null check (document_type in ('license', 'insurance', 'id', 'business_registration', 'certificate', 'other')),
  file_url text not null,
  expiry_date date,
  status text not null check (status in ('pending', 'approved', 'rejected', 'expired')) default 'pending',
  admin_comment text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- job_updates: log updates / milestones during progress
create table public.job_updates (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  status text not null,
  update_message text,
  photo_url text,
  created_at timestamptz default now()
);

-- reviews: submitted by clients after completion
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  tradie_id uuid not null references public.tradies(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  would_recommend boolean,
  created_at timestamptz default now(),
  unique(job_id, client_id, tradie_id)
);

-- disputes: raised by either client or tradie
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  raised_by uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  description text,
  status text not null check (status in ('open', 'under_review', 'awaiting_response', 'resolved', 'closed')) default 'open',
  resolution_notes text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- subscription_plans: tier structures
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric default 0,
  billing_interval text not null check (billing_interval in ('monthly', 'yearly', 'one_time')) default 'monthly',
  max_quotes_per_month integer,
  featured_listing boolean default false,
  priority_matching boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- subscriptions: tradies' active tiers
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tradie_id uuid not null references public.tradies(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  status text not null check (status in ('active', 'cancelled', 'expired', 'past_due')) default 'active',
  start_date date default current_date,
  end_date date,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- payments: log transaction status
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  tradie_id uuid not null references public.tradies(id) on delete cascade,
  amount numeric not null,
  currency text not null default 'AUD',
  payment_status text not null check (payment_status in ('pending', 'paid', 'failed', 'refunded')) default 'pending',
  payment_provider text not null default 'stripe',
  provider_payment_id text,
  created_at timestamptz default now()
);

-- notifications: dashboard alerts
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- audit_logs: logging for administrators
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz default now()
);


-- =========================================================================
-- 2. DB TRIGGERS & FUNCTIONS
-- =========================================================================

-- Trigger function: Update profile on Auth User Signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_role text := 'client';
begin
  -- Check raw user metadata if role was passed on registration
  if new.raw_user_meta_data->>'role' is not null then
    default_role := new.raw_user_meta_data->>'role';
  end if;

  insert into public.profiles (id, role, full_name, email, mobile_number, avatar_url, account_status)
  values (
    new.id,
    default_role,
    coalesce(new.raw_user_meta_data->>'full_name', 'User_' || substring(new.id::text, 1, 8)),
    new.email,
    new.raw_user_meta_data->>'mobile_number',
    new.raw_user_meta_data->>'avatar_url',
    'active'
  );

  -- Initialize role specific detail tables
  if default_role = 'client' then
    insert into public.clients (user_id) values (new.id);
  elsif default_role = 'tradie' then
    insert into public.tradies (user_id) values (new.id);
  end if;

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- Trigger function: Automatically aggregate reviews into tradie average rating
create or replace function public.update_tradie_rating()
returns trigger as $$
declare
  t_id uuid;
  avg_r numeric(3,2);
  cnt_r integer;
begin
  if (TG_OP = 'DELETE') then
    t_id := old.tradie_id;
  else
    t_id := new.tradie_id;
  end if;

  select coalesce(avg(rating), 0.00), count(id)
  into avg_r, cnt_r
  from public.reviews
  where tradie_id = t_id;

  update public.tradies
  set rating = avg_r, total_reviews = cnt_r
  where id = t_id;

  return null;
end;
$$ language plpgsql security definer;

create or replace trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute function public.update_tradie_rating();


-- Trigger function: Auto-create notification log on new notification insert
-- (If you want to push realtime notifications or audit logs)


-- =========================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.tradies enable row level security;
alter table public.trade_categories enable row level security;
alter table public.tradie_categories enable row level security;
alter table public.jobs enable row level security;
alter table public.job_media enable row level security;
alter table public.quotes enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.tradie_documents enable row level security;
alter table public.job_updates enable row level security;
alter table public.reviews enable row level security;
alter table public.disputes enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- PROFILES Policies
create policy "Allow public read of profiles" on public.profiles
  for select using (true);

create policy "Allow users to update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Allow admins to delete or update all profiles" on public.profiles
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

-- CLIENTS Policies
create policy "Allow select for owner and admins" on public.clients
  for select using (
    auth.uid() = user_id or 
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin', 'tradie'))
  );

create policy "Allow update for owner" on public.clients
  for update using (auth.uid() = user_id);

-- TRADIES Policies
create policy "Allow select for everyone" on public.tradies
  for select using (true);

create policy "Allow update for owner" on public.tradies
  for update using (auth.uid() = user_id);

-- TRADE CATEGORIES Policies
create policy "Allow select for everyone" on public.trade_categories
  for select using (true);

create policy "Allow write for admins" on public.trade_categories
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

-- TRADIE CATEGORIES Policies
create policy "Allow select for everyone" on public.tradie_categories
  for select using (true);

create policy "Allow write for owner or admins" on public.tradie_categories
  for all using (
    exists (select 1 from public.tradies t where t.id = tradie_id and t.user_id = auth.uid()) or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

-- JOBS Policies
create policy "Allow select for owner client, assigned/quoting tradies, and admins" on public.jobs
  for select using (
    status = 'open' or status = 'quoting' or
    exists (select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid()) or
    exists (select 1 from public.tradies t where t.id = assigned_tradie_id and t.user_id = auth.uid()) or
    exists (select 1 from public.quotes q join public.tradies t on q.tradie_id = t.id where q.job_id = jobs.id and t.user_id = auth.uid()) or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

create policy "Allow insert for clients" on public.jobs
  for insert with check (
    exists (select 1 from public.clients c where c.user_id = auth.uid())
  );

create policy "Allow update for owner client, assigned tradie (status only), and admins" on public.jobs
  for update using (
    exists (select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid()) or
    exists (select 1 from public.tradies t where t.id = assigned_tradie_id and t.user_id = auth.uid()) or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

-- JOB MEDIA Policies
create policy "Allow select for related job members" on public.job_media
  for select using (
    exists (select 1 from public.jobs j where j.id = job_id)
  );

create policy "Allow insert for related job members" on public.job_media
  for insert with check (
    uploaded_by = auth.uid()
  );

-- QUOTES Policies
create policy "Allow select for job owner, quoting tradie, and admins" on public.quotes
  for select using (
    exists (select 1 from public.tradies t where t.id = tradie_id and t.user_id = auth.uid()) or
    exists (select 1 from public.jobs j join public.clients c on j.client_id = c.id where j.id = job_id and c.user_id = auth.uid()) or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

create policy "Allow insert/update/delete for tradie owner" on public.quotes
  for all using (
    exists (select 1 from public.tradies t where t.id = tradie_id and t.user_id = auth.uid()) or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

-- CONVERSATIONS Policies
create policy "Allow select for participants and admins" on public.conversations
  for select using (
    exists (select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid()) or
    exists (select 1 from public.tradies t where t.id = tradie_id and t.user_id = auth.uid()) or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

create policy "Allow insert for related clients and tradies" on public.conversations
  for insert with check (
    exists (select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid()) or
    exists (select 1 from public.tradies t where t.id = tradie_id and t.user_id = auth.uid())
  );

-- MESSAGES Policies
create policy "Allow messages for conversation participants" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c 
      where c.id = conversation_id and (
        exists (select 1 from public.clients cl where cl.id = c.client_id and cl.user_id = auth.uid()) or
        exists (select 1 from public.tradies tr where tr.id = c.tradie_id and tr.user_id = auth.uid()) or
        exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin', 'super_admin'))
      )
    )
  );

create policy "Allow insert for conversation participants" on public.messages
  for insert with check (
    sender_id = auth.uid() and exists (
      select 1 from public.conversations c 
      where c.id = conversation_id and (
        exists (select 1 from public.clients cl where cl.id = c.client_id and cl.user_id = auth.uid()) or
        exists (select 1 from public.tradies tr where tr.id = c.tradie_id and tr.user_id = auth.uid())
      )
    )
  );

-- TRADIE DOCUMENTS Policies
create policy "Allow select for owning tradie and admins" on public.tradie_documents
  for select using (
    exists (select 1 from public.tradies t where t.id = tradie_id and t.user_id = auth.uid()) or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

create policy "Allow insert/update/delete for owning tradie" on public.tradie_documents
  for all using (
    exists (select 1 from public.tradies t where t.id = tradie_id and t.user_id = auth.uid()) or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

-- REVIEWS Policies
create policy "Allow public read of reviews" on public.reviews
  for select using (true);

create policy "Allow insert for job client" on public.reviews
  for insert with check (
    exists (select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid())
  );

-- DISPUTES Policies
create policy "Allow view for job participants and admins" on public.disputes
  for select using (
    raised_by = auth.uid() or
    exists (
      select 1 from public.jobs j
      left join public.clients c on j.client_id = c.id
      left join public.tradies t on j.assigned_tradie_id = t.id
      where j.id = job_id and (c.user_id = auth.uid() or t.user_id = auth.uid())
    ) or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

create policy "Allow write for participants and admins" on public.disputes
  for all using (
    raised_by = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

-- SUBSCRIPTIONS Policies
create policy "Allow select for owning tradie and admins" on public.subscriptions
  for select using (
    exists (select 1 from public.tradies t where t.id = tradie_id and t.user_id = auth.uid()) or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

create policy "Allow admin write" on public.subscriptions
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

-- PAYMENTS Policies
create policy "Allow select for owning tradie and admins" on public.payments
  for select using (
    exists (select 1 from public.tradies t where t.id = tradie_id and t.user_id = auth.uid()) or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

-- NOTIFICATIONS Policies
create policy "Allow user access to notifications" on public.notifications
  for all using (user_id = auth.uid());

-- AUDIT LOGS Policies
create policy "Only admins can select audit logs" on public.audit_logs
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );


-- =========================================================================
-- 4. SEED DATA
-- =========================================================================

-- Trade Categories Seed
insert into public.trade_categories (name, description) values
  ('Plumbing', 'Plumbing installations, repair of leaks, drain cleaning, and hot water service.'),
  ('Electrical', 'Electrical maintenance, wire routing, safety checks, and lighting fixtures.'),
  ('Carpentry', 'Woodworking, framing, decking, cabinetry, and furniture assembly.'),
  ('Painting', 'Interior and exterior house painting, spray painting, wall patching, and finishing.'),
  ('Roofing', 'Tile roof repairing, guttering, leakage protection, metal roof sheeting, and cleaning.'),
  ('Tiling', 'Bathroom tiling, kitchen splashbacks, floor screeding, and waterproofing.'),
  ('Cleaning', 'Domestic house cleaning, end-of-lease cleaning, commercial disinfection.'),
  ('Landscaping', 'Garden designing, lawn mowing, paving, turf laying, and tree pruning.'),
  ('HVAC', 'Airconditioning unit cleaning, installation, thermostat repair, and general ventilation maintenance.'),
  ('General Maintenance', 'Handyman services, lock replacements, wall mounting, and minor repairs.');

-- Subscription Plans Seed
insert into public.subscription_plans (name, description, price, billing_interval, max_quotes_per_month, featured_listing, priority_matching) values
  ('Free', 'Explore platform, submit up to 3 quotes per month.', 0, 'monthly', 3, false, false),
  ('Basic', 'Browse all jobs and submit up to 10 quotes per month.', 29, 'monthly', 10, false, false),
  ('Pro', 'Unlimited quotes, verified tag, and standard priority visibility.', 59, 'monthly', 999, true, false),
  ('Premium', 'Featured profile at the top of the listings, unlimited quotes, and instant SMS matching alerts.', 99, 'monthly', 999, true, true);
