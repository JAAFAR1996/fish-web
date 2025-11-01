-- Supabase schema definition for authentication & account management tables
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

do 
begin
  if not exists (
    select 1 from pg_proc where proname = 'set_updated_at'
  ) then
    create function public.set_updated_at()
    returns trigger
    language plpgsql
    as 
    begin
      new.updated_at = timezone('utc', now());
      return new;
    end;
    ;
  end if;
end;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  phone text,
  loyalty_points_balance integer not null default 0,
  referral_code text unique,
  referred_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

  -- Ensure marketing columns exist on profiles table for existing deployments
  alter table public.profiles
    add column if not exists loyalty_points_balance integer default 0,
    add column if not exists referral_code text unique,
    add column if not exists referred_by uuid references public.profiles(id) on delete set null;

  alter table public.profiles
    alter column loyalty_points_balance set not null,
    alter column loyalty_points_balance set default 0;

  -- Add notification preferences columns to profiles table
  alter table public.profiles
    add column if not exists email_order_updates boolean default true,
    add column if not exists email_shipping_updates boolean default true,
    add column if not exists email_stock_alerts boolean default true,
    add column if not exists email_marketing boolean default false,
    add column if not exists inapp_notifications_enabled boolean default true;

  -- Create notifications table
  create table if not exists public.notifications (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    type text not null check (type in ('order_confirmation', 'shipping_update', 'stock_alert', 'special_offer')),
    title text not null check (char_length(title) <= 200),
    message text not null check (char_length(message) <= 500),
    data jsonb,
    link text,
    read_at timestamptz,
    created_at timestamptz not null default timezone('utc', now())
  );

  -- Create notification indexes
  create index if not exists idx_notifications_user_id on public.notifications(user_id);
  create index if not exists idx_notifications_user_id_unread on public.notifications(user_id, read_at) where read_at is null;
  create index if not exists idx_notifications_user_id_created on public.notifications(user_id, created_at desc);
  create index if not exists idx_notifications_type on public.notifications(type);

  -- Enable RLS for notifications table
  alter table public.notifications enable row level security;

  -- RLS policies for notifications
  create policy "Users can view own notifications"
    on public.notifications
    for select
    using (auth.uid() = user_id);

  create policy "Users can update own notifications"
    on public.notifications
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

  create policy "Users can delete own notifications"
    on public.notifications
    for delete
    using (auth.uid() = user_id);

  drop policy if exists "Users can create own notifications" on public.notifications;

  create policy "Service role can create notifications"
    on public.notifications
    for insert
    with check (auth.role() = 'service_role');


create table if not exists public.carts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','converted','abandoned')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, status) where status = 'active'
);

create table if not exists public.cart_items (
  id uuid primary key default uuid_generate_v4(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (cart_id, product_id)
);

create index if not exists idx_cart_items_cart_product on public.cart_items(cart_id, product_id);

create table if not exists public.saved_addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  recipient_name text not null,
  phone text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  governorate text not null,
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id) where is_default
);

create table if not exists public.saved_calculations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  calculator_type text not null,
  inputs jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wishlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, product_id)
);

create table if not exists public.notify_me_requests (
  id uuid primary key default uuid_generate_v4(),
  product_id text not null,
  email text,
  user_id uuid references auth.users(id) on delete cascade,
  notified boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  constraint valid_email_or_user check (email is not null or user_id is not null)
);

create index if not exists idx_wishlists_user_id on public.wishlists(user_id);
create index if not exists idx_wishlists_product_id on public.wishlists(product_id);

create index if not exists idx_notify_me_product_id on public.notify_me_requests(product_id);
create index if not exists idx_notify_me_notified on public.notify_me_requests(notified) where notified = false;
create unique index if not exists idx_notify_me_product_email on public.notify_me_requests(product_id, email) where email is not null;
create unique index if not exists idx_notify_me_product_user on public.notify_me_requests(product_id, user_id) where user_id is not null;

create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text not null check (char_length(title) <= 100 and char_length(title) > 0),
  comment text not null check (char_length(comment) >= 10 and char_length(comment) <= 1000),
  images jsonb not null default '[]'::jsonb,
  is_approved boolean not null default false,
  helpful_count integer not null default 0,
  not_helpful_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, product_id)
);

create table if not exists public.helpful_votes (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote_type text not null check (vote_type in ('helpful','not_helpful')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, review_id)
);

create index if not exists idx_reviews_product_id on public.reviews(product_id);
create index if not exists idx_reviews_user_id on public.reviews(user_id);
create index if not exists idx_reviews_is_approved on public.reviews(is_approved) where is_approved = true;
create index if not exists idx_reviews_created_at on public.reviews(created_at desc);

create index if not exists idx_helpful_votes_review_id on public.helpful_votes(review_id);
create index if not exists idx_helpful_votes_user_id on public.helpful_votes(user_id);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  guest_email text,
  shipping_address_id uuid references public.saved_addresses(id) on delete set null,
  shipping_address jsonb not null,
  payment_method text not null check (payment_method in ('cod','zaincash','fastpay','bank_transfer')),
  status text not null default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  subtotal numeric not null,
  shipping_cost numeric not null default 0,
  discount numeric not null default 0,
  loyalty_discount numeric not null default 0,
  loyalty_points_used integer not null default 0,
  total numeric not null,
  coupon_code text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint valid_user_or_email check (user_id is not null or guest_email is not null)
);

alter table public.orders
  add column if not exists loyalty_discount numeric not null default 0,
  add column if not exists loyalty_points_used integer not null default 0;

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_snapshot jsonb not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric not null,
  subtotal numeric not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.coupons (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percentage','fixed')),
  discount_value numeric not null check (discount_value > 0),
  min_order_value numeric,
  max_discount numeric,
  expiry_date timestamptz,
  usage_limit integer,
  used_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.shipping_rates (
  id uuid primary key default uuid_generate_v4(),
  governorate text unique not null,
  base_rate numeric not null,
  free_shipping_threshold numeric not null default 100000,
  estimated_delivery_days integer not null default 3,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_order_number on public.orders(order_number);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_coupons_code on public.coupons(code) where is_active = true;

create trigger trg_profiles_updated
  before update on public.profiles
  for each row
  execute procedure public.set_updated_at();

create trigger trg_carts_updated
  before update on public.carts
  for each row
  execute procedure public.set_updated_at();

create trigger trg_cart_items_updated
  before update on public.cart_items
  for each row
  execute procedure public.set_updated_at();

create trigger trg_saved_addresses_updated
  before update on public.saved_addresses
  for each row
  execute procedure public.set_updated_at();

create trigger trg_orders_updated
  before update on public.orders
  for each row
  execute procedure public.set_updated_at();

create trigger trg_coupons_updated
  before update on public.coupons
  for each row
  execute procedure public.set_updated_at();

create trigger trg_shipping_rates_updated
  before update on public.shipping_rates
  for each row
  execute procedure public.set_updated_at();

create trigger trg_reviews_updated
  before update on public.reviews
  for each row
  execute procedure public.set_updated_at();

create or replace function public.refresh_review_helpful_counts()
returns trigger
language plpgsql
as 
declare
  target uuid;
begin
  target := coalesce(new.review_id, old.review_id);

  update public.reviews
  set helpful_count = (
        select count(*) from public.helpful_votes
        where review_id = target and vote_type = 'helpful'
      ),
      not_helpful_count = (
        select count(*) from public.helpful_votes
        where review_id = target and vote_type = 'not_helpful'
      )
  where id = target;

  return null;
end;
;

create trigger trg_helpful_votes_refresh_counts
  after insert or update or delete on public.helpful_votes
  for each row
  execute procedure public.refresh_review_helpful_counts();

-- auto create profile when a new auth user is inserted
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
as 
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
;

do 
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
  end if;
end;

alter table public.profiles enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.saved_addresses enable row level security;
alter table public.saved_calculations enable row level security;
alter table public.wishlists enable row level security;
alter table public.notify_me_requests enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.coupons enable row level security;
alter table public.shipping_rates enable row level security;
alter table public.reviews enable row level security;
alter table public.helpful_votes enable row level security;

create or replace view public.profiles_public as
  select id, full_name, avatar_url
  from public.profiles;

grant select on public.profiles_public to anon, authenticated;

create policy "Profiles are readable by owner"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles
  for update
  using (auth.uid() = id);

create policy "Carts are user scoped"
  on public.carts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Cart items inherit cart access"
  on public.cart_items
  for all
  using (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  );

create policy "Addresses are user scoped"
  on public.saved_addresses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Saved calculations are user scoped"
  on public.saved_calculations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Wishlists are user scoped"
  on public.wishlists
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Notify me requests can be inserted"
  on public.notify_me_requests
  for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Notify me requests selectable by owner"
  on public.notify_me_requests
  for select
  using (auth.uid() = user_id);

create policy "Notify me requests deletable by owner"
  on public.notify_me_requests
  for delete
  using (auth.uid() = user_id);

create policy "Users can view own orders"
  on public.orders
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own orders"
  on public.orders
  for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Order items inherit order access"
  on public.order_items
  for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and (orders.user_id = auth.uid() or orders.user_id is null)
    )
  );

create policy "Order items can be inserted"
  on public.order_items
  for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and (orders.user_id = auth.uid() or orders.user_id is null)
    )
  );

create policy "Coupons are publicly readable"
  on public.coupons
  for select
  using (is_active = true);

create policy "Shipping rates are publicly readable"
  on public.shipping_rates
  for select
  using (is_active = true);

create policy "Reviews are readable when approved or owner"
  on public.reviews
  for select
  using (is_approved = true or auth.uid() = user_id);

create policy "Reviews can be inserted by owner"
  on public.reviews
  for insert
  with check (auth.uid() = user_id);

create policy "Reviews can be updated by owner"
  on public.reviews
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Reviews can be deleted by owner"
  on public.reviews
  for delete
  using (auth.uid() = user_id);

create policy "Helpful votes are readable by owner"
  on public.helpful_votes
  for select
  using (auth.uid() = user_id);

create policy "Helpful votes can be inserted by owner"
  on public.helpful_votes
  for insert
  with check (auth.uid() = user_id);

create policy "Helpful votes can be updated by owner"
  on public.helpful_votes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Helpful votes can be deleted by owner"
  on public.helpful_votes
  for delete
  using (auth.uid() = user_id);

-- Marketing tables (Phase 16)

-- Flash sales table
create table if not exists public.flash_sales (
  id uuid primary key default uuid_generate_v4(),
  product_id text not null,
  flash_price numeric not null check (flash_price > 0),
  original_price numeric not null check (original_price > 0),
  stock_limit integer not null check (stock_limit > 0),
  stock_sold integer not null default 0 check (stock_sold >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint flash_price_less_than_original check (flash_price < original_price),
  constraint ends_after_starts check (ends_at > starts_at)
);

create index if not exists idx_flash_sales_product_id on public.flash_sales(product_id);
create index if not exists idx_flash_sales_active on public.flash_sales(is_active) where is_active = true;
create index if not exists idx_flash_sales_dates on public.flash_sales(starts_at, ends_at);

-- Bundles table
create table if not exists public.bundles (
  id uuid primary key default uuid_generate_v4(),
  name text not null check (char_length(name) > 0),
  description text,
  product_ids jsonb not null,
  discount_type text not null check (discount_type in ('percentage','fixed')),
  discount_value numeric not null check (discount_value > 0),
  bundle_price numeric not null check (bundle_price > 0),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint valid_ends_at check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index if not exists idx_bundles_active on public.bundles(is_active) where is_active = true;
create index if not exists idx_bundles_dates on public.bundles(starts_at, ends_at);

-- Loyalty points transactions table
create table if not exists public.loyalty_points (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('earned','redeemed','expired')),
  points integer not null,
  order_id uuid references public.orders(id) on delete set null,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_loyalty_points_user_id on public.loyalty_points(user_id);
create index if not exists idx_loyalty_points_type on public.loyalty_points(transaction_type);
create index if not exists idx_loyalty_points_created on public.loyalty_points(created_at desc);
create index if not exists idx_loyalty_points_order_id on public.loyalty_points(order_id) where order_id is not null;

-- Referrals table
create table if not exists public.referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referee_id uuid not null references auth.users(id) on delete cascade,
  referral_code text not null,
  status text not null default 'pending' check (status in ('pending','completed','rewarded')),
  reward_type text not null default 'points' check (reward_type in ('points','discount')),
  reward_value numeric not null,
  referee_first_order_id uuid references public.orders(id) on delete set null,
  rewarded_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(referee_id)
);

create index if not exists idx_referrals_referrer_id on public.referrals(referrer_id);
create index if not exists idx_referrals_referee_id on public.referrals(referee_id);
create index if not exists idx_referrals_code on public.referrals(referral_code);
create index if not exists idx_referrals_status on public.referrals(status);

-- Newsletter subscribers table
create table if not exists public.newsletter_subscribers (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  subscribed_at timestamptz not null default timezone('utc', now()),
  unsubscribed_at timestamptz,
  preferences jsonb default '{}'::jsonb,
  unsubscribe_token text not null default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_newsletter_email on public.newsletter_subscribers(email);
create index if not exists idx_newsletter_user_id on public.newsletter_subscribers(user_id) where user_id is not null;
create index if not exists idx_newsletter_subscribed on public.newsletter_subscribers(subscribed_at) where unsubscribed_at is null;

-- Admin dashboard schema extensions
alter table public.profiles
  add column if not exists is_admin boolean default false;

create index if not exists idx_profiles_is_admin on public.profiles(is_admin) where is_admin = true;

create table if not exists public.products (
  id text primary key,
  slug text unique not null,
  name text not null,
  brand text not null,
  category text not null,
  subcategory text not null,
  description text not null,
  price numeric not null check (price >= 0),
  original_price numeric check (original_price is null or original_price > price),
  currency text not null default 'IQD',
  images jsonb not null default '[]'::jsonb,
  thumbnail text not null,
  rating numeric not null default 0 check (rating >= 0 and rating <= 5),
  review_count integer not null default 0 check (review_count >= 0),
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  is_new boolean not null default false,
  is_best_seller boolean not null default false,
  specifications jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_brand on public.products(brand);
create index if not exists idx_products_stock on public.products(stock);
create index if not exists idx_products_is_new on public.products(is_new) where is_new = true;
create index if not exists idx_products_is_best_seller on public.products(is_best_seller) where is_best_seller = true;

create trigger trg_products_updated
  before update on public.products
  for each row
  execute procedure public.set_updated_at();

create table if not exists public.admin_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  changes jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_audit_logs_admin_id on public.admin_audit_logs(admin_id);
create index if not exists idx_audit_logs_entity on public.admin_audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_created_at on public.admin_audit_logs(created_at desc);

alter table public.products enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Setup Gallery (Phase 18)
create table if not exists public.gallery_setups (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) > 0 and char_length(title) <= 100),
  description text check (description is null or char_length(description) <= 500),
  tank_size integer not null check (tank_size >= 1 and tank_size <= 10000),
  style text not null,
  media_urls jsonb not null default '[]'::jsonb,
  hotspots jsonb not null default '[]'::jsonb,
  is_approved boolean not null default false,
  featured boolean not null default false,
  view_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_gallery_setups_user_id on public.gallery_setups(user_id);
create index if not exists idx_gallery_setups_is_approved on public.gallery_setups(is_approved);
create index if not exists idx_gallery_setups_style on public.gallery_setups(style);
create index if not exists idx_gallery_setups_tank_size on public.gallery_setups(tank_size);
create index if not exists idx_gallery_setups_featured on public.gallery_setups(featured) where featured = true;
create index if not exists idx_gallery_setups_created_at on public.gallery_setups(created_at desc);

create trigger trg_gallery_setups_updated
  before update on public.gallery_setups
  for each row
  execute procedure public.set_updated_at();

alter table public.gallery_setups enable row level security;

-- Atomic view count increment helper
create or replace function public.increment_gallery_view_count(p_id uuid)
returns void
language sql
as $$
  update public.gallery_setups
     set view_count = view_count + 1
   where id = p_id;
$$;

grant execute on function public.increment_gallery_view_count(uuid) to anon, authenticated, service_role;

create policy "Public can view approved gallery setups"
  on public.gallery_setups
  for select
  using (is_approved = true);

create policy "Users can manage own gallery setups"
  on public.gallery_setups
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage bucket for gallery images
DO
$$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'gallery-images'
  ) THEN
    PERFORM storage.create_bucket(
      'gallery-images',
      jsonb_build_object(
        'public', true,
        'file_size_limit', 10485760,
        'allowed_mime_types', jsonb_build_array('image/jpeg','image/png','image/webp','video/mp4')
      )
    );
  END IF;
END;
$$;

create policy "Public can read gallery images"
  on storage.objects
  for select
  using (bucket_id = 'gallery-images');

create policy "Users can upload gallery images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'gallery-images'
    and auth.uid()::text = split_part(name, '/', 1)
  );

create policy "Users can update gallery images"
  on storage.objects
  for update
  using (
    bucket_id = 'gallery-images'
    and auth.uid()::text = split_part(name, '/', 1)
  )
  with check (
    bucket_id = 'gallery-images'
    and auth.uid()::text = split_part(name, '/', 1)
  );

create policy "Users can delete gallery images"
  on storage.objects
  for delete
  using (
    bucket_id = 'gallery-images'
    and auth.uid()::text = split_part(name, '/', 1)
  );

create policy "Products are publicly readable"
  on public.products for select using (true);

create policy "Admins can manage products"
  on public.products for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

create policy "Admins can view audit logs"
  on public.admin_audit_logs for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

do
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_audit_logs'
      and polname = 'System can create audit logs'
  ) then
    drop policy "System can create audit logs" on public.admin_audit_logs;
  end if;
end;

create policy "Admins can create audit logs"
  on public.admin_audit_logs for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

do
begin
  if not exists (
    select 1 from storage.buckets where name = 'product-images'
  ) then
    perform storage.create_bucket(
      'product-images',
      jsonb_build_object(
        'public', true,
        'file_size_limit', 5242880,
        'allowed_mime_types', jsonb_build_array('image/jpeg','image/png','image/webp')
      )
    );
  end if;
end;

create policy "Public can read product images"
  on storage.objects
  for select
  using (bucket_id = 'product-images');

create policy "Admins can upload product images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

create policy "Admins can update product images"
  on storage.objects
  for update
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  )
  with check (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

create policy "Admins can delete product images"
  on storage.objects
  for delete
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

alter table public.orders
  add column if not exists tracking_number text,
  add column if not exists carrier text;

alter table public.newsletter_subscribers
  add column if not exists unsubscribe_token text;

update public.newsletter_subscribers
   set unsubscribe_token = encode(gen_random_bytes(32), 'hex')
 where unsubscribe_token is null;

alter table public.newsletter_subscribers
  alter column unsubscribe_token set not null,
  alter column unsubscribe_token set default encode(gen_random_bytes(32), 'hex');

-- Create indexes for profiles marketing columns
create index if not exists idx_profiles_referral_code on public.profiles(referral_code) where referral_code is not null;
create index if not exists idx_profiles_referred_by on public.profiles(referred_by) where referred_by is not null;

-- Marketing SQL helpers and RPC functions
create or replace function public.increment_loyalty_balance(p_user_id uuid, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_balance integer;
begin
  if p_user_id is null then
    raise exception 'User id is required';
  end if;

  update public.profiles
     set loyalty_points_balance = greatest(0, coalesce(loyalty_points_balance, 0) + coalesce(p_amount, 0)),
         updated_at = timezone('utc', now())
   where id = p_user_id
   returning loyalty_points_balance into v_new_balance;

  if not found then
    raise exception 'Profile % not found', p_user_id;
  end if;

  return v_new_balance;
end;
$$;

create or replace function public.increment_flash_sale_stock(p_sale_id uuid, p_qty integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock_sold integer;
  v_stock_limit integer;
  v_new_total integer;
begin
  if p_sale_id is null then
    raise exception 'Sale id is required';
  end if;

  select stock_sold, stock_limit
    into v_stock_sold, v_stock_limit
  from public.flash_sales
  where id = p_sale_id
  for update;

  if not found then
    raise exception 'Flash sale % not found', p_sale_id;
  end if;

  v_new_total := coalesce(v_stock_sold, 0) + coalesce(p_qty, 0);

  if v_new_total < 0 then
    raise exception 'Resulting stock cannot be negative';
  end if;

  if v_new_total > v_stock_limit then
    raise exception 'Stock limit exceeded for flash sale %', p_sale_id;
  end if;

  update public.flash_sales
     set stock_sold = v_new_total,
         updated_at = timezone('utc', now())
   where id = p_sale_id;

  return v_new_total;
end;
$$;

create or replace function public.newsletter_is_subscribed(p_email text)
returns table(subscriber_id uuid, is_subscribed boolean, unsubscribed_at timestamptz, unsubscribe_token text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  if coalesce(trim(p_email), '') = '' then
    return;
  end if;

  v_email := lower(trim(p_email));

  return query
  select n.id,
         n.unsubscribed_at is null as is_subscribed,
         n.unsubscribed_at,
         n.unsubscribe_token
    from public.newsletter_subscribers n
   where n.email = v_email;
end;
$$;

create or replace function public.newsletter_reactivate(p_email text, p_user_id uuid default null)
returns table(subscriber_id uuid, unsubscribe_token text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_subscriber_id uuid;
  v_token text;
begin
  if coalesce(trim(p_email), '') = '' then
    raise exception 'Email is required';
  end if;

  v_email := lower(trim(p_email));

  update public.newsletter_subscribers
     set unsubscribed_at = null,
         subscribed_at = timezone('utc', now()),
         updated_at = timezone('utc', now()),
         user_id = coalesce(user_id, p_user_id),
         unsubscribe_token = encode(gen_random_bytes(32), 'hex')
   where email = v_email
   returning id, unsubscribe_token into v_subscriber_id, v_token;

  if v_subscriber_id is null then
    return;
  end if;

  subscriber_id := v_subscriber_id;
  unsubscribe_token := v_token;
  return next;
end;
$$;

create or replace function public.newsletter_unsubscribe(p_email text, p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_expected_token text;
  v_current_token text;
  v_updated integer;
begin
  if coalesce(trim(p_email), '') = '' then
    return false;
  end if;

  v_email := lower(trim(p_email));
  select unsubscribe_token
    into v_current_token
  from public.newsletter_subscribers
  where email = v_email
  for update;

  if not found then
    return false;
  end if;

  v_expected_token := coalesce(v_current_token, '');

  if v_expected_token <> p_token then
    return false;
  end if;

  update public.newsletter_subscribers
     set unsubscribed_at = timezone('utc', now()),
         updated_at = timezone('utc', now()),
         unsubscribe_token = encode(gen_random_bytes(32), 'hex')
   where email = v_email;

  get diagnostics v_updated = row_count;

  return v_updated > 0;
end;
$$;

grant execute on function public.increment_loyalty_balance(uuid, integer) to anon, authenticated, service_role;
grant execute on function public.increment_flash_sale_stock(uuid, integer) to anon, authenticated, service_role;
grant execute on function public.newsletter_is_subscribed(text) to anon, authenticated, service_role;
grant execute on function public.newsletter_reactivate(text, uuid) to anon, authenticated, service_role;
grant execute on function public.newsletter_unsubscribe(text, text) to anon, authenticated, service_role;

-- Enable RLS for marketing tables
alter table public.flash_sales enable row level security;
alter table public.bundles enable row level security;
alter table public.loyalty_points enable row level security;
alter table public.referrals enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- RLS policies for flash_sales
create policy "Flash sales are publicly readable"
  on public.flash_sales
  for select
  using (true);

-- RLS policies for bundles
create policy "Bundles are publicly readable"
  on public.bundles
  for select
  using (is_active = true);

-- RLS policies for loyalty_points
create policy "Users can view own loyalty transactions"
  on public.loyalty_points
  for select
  using (auth.uid() = user_id);

-- RLS policies for referrals
create policy "Users can view referrals where they are referrer"
  on public.referrals
  for select
  using (auth.uid() = referrer_id);

-- RLS policies for newsletter_subscribers
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'newsletter_subscribers'
      and policyname = 'Anyone can subscribe to newsletter'
  ) then
    drop policy "Anyone can subscribe to newsletter" on public.newsletter_subscribers;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'newsletter_subscribers'
      and policyname = 'Users can view own subscription'
  ) then
    drop policy "Users can view own subscription" on public.newsletter_subscribers;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'newsletter_subscribers'
      and policyname = 'Users can update own subscription'
  ) then
    drop policy "Users can update own subscription" on public.newsletter_subscribers;
  end if;
end;
$$;

create policy "Anyone can subscribe to newsletter"
  on public.newsletter_subscribers
  for insert
  with check (true);

create policy "Authenticated users can view own subscription"
  on public.newsletter_subscribers
  for select
  using (auth.uid() = user_id);

create policy "Authenticated users can update own subscription"
  on public.newsletter_subscribers
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create triggers for updated_at
create trigger set_flash_sales_updated_at
  before update on public.flash_sales
  for each row execute function public.set_updated_at();

create trigger set_bundles_updated_at
  before update on public.bundles
  for each row execute function public.set_updated_at();

create trigger set_referrals_updated_at
  before update on public.referrals
  for each row execute function public.set_updated_at();

create trigger set_newsletter_subscribers_updated_at
  before update on public.newsletter_subscribers
  for each row execute function public.set_updated_at();

insert into public.shipping_rates (governorate, base_rate, estimated_delivery_days)
values
  ('Baghdad', 5000, 2),
  ('Basra', 10000, 4),
  ('Nineveh', 8000, 3),
  ('Erbil', 8000, 3),
  ('Sulaymaniyah', 10000, 4),
  ('Dohuk', 10000, 4),
  ('Anbar', 12000, 5),
  ('Diyala', 8000, 3),
  ('Saladin', 8000, 3),
  ('Kirkuk', 8000, 3),
  ('Najaf', 8000, 3),
  ('Karbala', 8000, 3),
  ('Wasit', 10000, 4),
  ('Maysan', 12000, 5),
  ('Dhi Qar', 10000, 4),
  ('Muthanna', 12000, 5),
  ('Qadisiyyah', 10000, 4),
  ('Babil', 8000, 3)
on conflict (governorate) do nothing;

do 
begin
  if not exists (
    select 1 from storage.buckets where name = 'review-images'
  ) then
    perform storage.create_bucket(
      'review-images',
      jsonb_build_object(
        'public', true,
        'file_size_limit', 5242880,
        'allowed_mime_types', jsonb_build_array('image/jpeg','image/png','image/webp')
      )
    );
  end if;
end;

create policy "Public can read review images"
  on storage.objects
  for select
  using (bucket_id = 'review-images');

create policy "Users can upload review images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'review-images'
    and auth.uid()::text = split_part(name, '/', 1)
  );

create policy "Users can update review images"
  on storage.objects
  for update
  using (
    bucket_id = 'review-images'
    and auth.uid()::text = split_part(name, '/', 1)
  )
  with check (
    bucket_id = 'review-images'
    and auth.uid()::text = split_part(name, '/', 1)
  );

create policy "Users can delete review images"
  on storage.objects
  for delete
  using (
    bucket_id = 'review-images'
    and auth.uid()::text = split_part(name, '/', 1)
  );
