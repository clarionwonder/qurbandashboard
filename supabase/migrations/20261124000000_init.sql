-- GERMY Qurban: initial schema
create extension if not exists pgcrypto;

-- Admins: auth users allowed into the organiser dashboard
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create type public.campaign_type as enum ('qurban', 'aqiqah');
create type public.campaign_status as enum ('draft', 'open', 'closed');
create type public.animal_kind as enum ('cow', 'buffalo', 'camel', 'goat', 'sheep');
create type public.animal_status as enum ('filling', 'full', 'slaughtered', 'distributed');
create type public.order_status as enum ('pending', 'awaiting_verification', 'paid', 'failed', 'cancelled');
create type public.payment_method as enum ('billplz', 'toyyibpay', 'bayarcash', 'senangpay', 'manual', 'demo');

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  type public.campaign_type not null default 'qurban',
  description text,
  location text,
  event_date date,
  status public.campaign_status not null default 'draft',
  bank_name text,
  bank_account_name text,
  bank_account_no text,
  created_at timestamptz not null default now()
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null,
  description text,
  animal_kind public.animal_kind not null default 'cow',
  shares_per_animal int not null default 7 check (shares_per_animal between 1 and 7),
  price_per_share numeric(10,2) not null check (price_per_share >= 0),
  max_animals int check (max_animals is null or max_animals > 0),
  code_prefix text not null default 'A',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.packages(campaign_id);

create table public.animals (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete cascade,
  seq int not null,
  code text not null,
  status public.animal_status not null default 'filling',
  notes text,
  slaughtered_at timestamptz,
  distributed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (package_id, seq)
);
create index on public.animals(campaign_id);

create sequence public.order_ref_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default ('GQ' || to_char(now(), 'YY') || lpad(nextval('public.order_ref_seq')::text, 5, '0')),
  campaign_id uuid not null references public.campaigns(id) on delete restrict,
  package_id uuid not null references public.packages(id) on delete restrict,
  buyer_name text not null,
  buyer_phone text not null,
  buyer_email text not null,
  buyer_address text,
  quantity int not null check (quantity between 1 and 50),
  participants jsonb not null default '[]'::jsonb,
  amount numeric(10,2) not null,
  status public.order_status not null default 'pending',
  payment_method public.payment_method not null,
  gateway_bill_id text,
  gateway_txn_id text,
  proof_path text,
  paid_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now()
);
create index on public.orders(campaign_id, status);
create index on public.orders(gateway_bill_id);

create table public.shares (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete restrict,
  slot int not null,
  participant_name text not null,
  created_at timestamptz not null default now(),
  unique (animal_id, slot)
);
create index on public.shares(order_id);

create table public.payment_events (
  id bigint generated always as identity primary key,
  order_id uuid references public.orders(id) on delete set null,
  provider text not null,
  kind text not null,
  verified boolean not null default false,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

-- Capacity view: shares sold and remaining per package
create or replace view public.package_availability with (security_invoker = true) as
select p.id as package_id,
       p.campaign_id,
       p.shares_per_animal,
       p.max_animals,
       coalesce((select count(*) from public.shares s join public.animals a on a.id = s.animal_id where a.package_id = p.id), 0)::int as shares_sold,
       case when p.max_animals is null then null
            else (p.max_animals * p.shares_per_animal)
                 - coalesce((select count(*) from public.shares s join public.animals a on a.id = s.animal_id where a.package_id = p.id), 0)::int
       end as shares_remaining
from public.packages p;

-- Mark an order paid and allocate its shares to animals.
-- Keeps one order's shares together on the same animal when possible,
-- otherwise fills the oldest animal that still has space, then opens new ones.
create or replace function public.mark_order_paid(p_order_id uuid, p_method public.payment_method, p_txn_id text default null)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  pkg public.packages;
  names text[];
  remaining int;
  idx int := 1;
  an public.animals;
  used int;
  free int;
  take int;
  next_seq int;
  i int;
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if o.status = 'paid' then return o; end if;

  select * into pkg from public.packages where id = o.package_id for update;

  select array_agg(coalesce(nullif(trim(v), ''), o.buyer_name) order by ord)
    into names
    from jsonb_array_elements_text(o.participants) with ordinality as t(v, ord);
  if names is null then names := array[]::text[]; end if;
  while coalesce(array_length(names, 1), 0) < o.quantity loop
    names := names || o.buyer_name;
  end loop;

  remaining := o.quantity;
  while remaining > 0 loop
    an := null;
    -- 1) an existing filling animal that fits the whole remainder
    select a.* into an from public.animals a
     where a.package_id = pkg.id and a.status = 'filling'
       and pkg.shares_per_animal - (select count(*) from public.shares s where s.animal_id = a.id) >= remaining
     order by a.seq limit 1 for update;
    -- 2) for a whole-animal booking, prefer a fresh animal over splitting
    if an.id is null and remaining >= pkg.shares_per_animal then
      an := null;
    elsif an.id is null then
      select a.* into an from public.animals a
       where a.package_id = pkg.id and a.status = 'filling'
       order by a.seq limit 1 for update;
    end if;
    -- 3) open a new animal
    if an.id is null then
      select coalesce(max(seq), 0) + 1 into next_seq from public.animals where package_id = pkg.id;
      insert into public.animals (campaign_id, package_id, seq, code)
      values (pkg.campaign_id, pkg.id, next_seq, pkg.code_prefix || '-' || lpad(next_seq::text, 3, '0'))
      returning * into an;
    end if;

    select count(*) into used from public.shares where animal_id = an.id;
    free := pkg.shares_per_animal - used;
    take := least(free, remaining);
    for i in 1..take loop
      insert into public.shares (order_id, animal_id, slot, participant_name)
      values (o.id, an.id,
              (select min(g) from generate_series(1, pkg.shares_per_animal) g
                where g not in (select slot from public.shares where animal_id = an.id)),
              names[idx]);
      idx := idx + 1;
    end loop;
    remaining := remaining - take;
    if used + take >= pkg.shares_per_animal then
      update public.animals set status = 'full' where id = an.id and status = 'filling';
    end if;
  end loop;

  update public.orders
     set status = 'paid', paid_at = now(), payment_method = p_method,
         gateway_txn_id = coalesce(p_txn_id, gateway_txn_id)
   where id = o.id
   returning * into o;
  return o;
end;
$$;
revoke all on function public.mark_order_paid(uuid, public.payment_method, text) from public, anon, authenticated;

-- RLS
alter table public.admins enable row level security;
alter table public.campaigns enable row level security;
alter table public.packages enable row level security;
alter table public.animals enable row level security;
alter table public.orders enable row level security;
alter table public.shares enable row level security;
alter table public.payment_events enable row level security;

create policy "admins read self" on public.admins for select to authenticated using (user_id = auth.uid());

create policy "public read open campaigns" on public.campaigns for select to anon, authenticated using (status <> 'draft' or public.is_admin());
create policy "admin write campaigns" on public.campaigns for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "public read active packages" on public.packages for select to anon, authenticated
  using ((active and exists (select 1 from public.campaigns c where c.id = campaign_id and c.status <> 'draft')) or public.is_admin());
create policy "admin write packages" on public.packages for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin all animals" on public.animals for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all orders" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all shares" on public.shares for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read payment events" on public.payment_events for select to authenticated using (public.is_admin());

-- Private bucket for manual-transfer proof uploads (written by the server only)
insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;
