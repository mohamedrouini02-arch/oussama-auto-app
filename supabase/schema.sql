-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text check (role in ('admin', 'manager', 'viewer')) default 'viewer',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CARS (Inventory)
create table public.cars (
  id uuid default uuid_generate_v4() primary key,
  reference_id text unique not null, -- e.g., CAR-1001
  brand text not null,
  model text not null,
  year integer not null,
  vin text unique,
  color text,
  mileage integer default 0,
  location text check (location in ('Korea', 'China')) not null,
  status text check (status in ('Available', 'Reserved', 'Sold', 'In Transit')) default 'Available',
  purchase_price decimal(12,2), -- In original currency
  purchase_currency text default 'KRW',
  selling_price decimal(12,2), -- In DZD
  images text[], -- Array of image URLs
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ORDERS
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  reference_number text unique not null, -- e.g., WA-2025-001
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  customer_city text,
  requested_car_details text, -- "Kia Sportage 2023 White"
  budget_min decimal(12,2),
  budget_max decimal(12,2),
  status text check (status in ('Pending', 'Confirmed', 'Purchased', 'Shipped', 'Customs', 'Ready', 'Delivered')) default 'Pending',
  assigned_car_id uuid references public.cars(id),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. SHIPPING FORMS
create table public.shipping_forms (
  id uuid default uuid_generate_v4() primary key,
  customer_name text not null,
  customer_phone text,
  vehicle_model text not null,
  vin text not null,
  passport_number text,
  address text,
  status text check (status in ('Pending', 'Processed', 'Completed')) default 'Pending',
  pdf_url text,
  linked_order_id uuid references public.orders(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. TRANSACTIONS (Finance)
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  type text check (type in ('Income', 'Expense')) not null,
  category text not null, -- 'Car Sale', 'Shipping', etc.
  description text not null,
  amount decimal(12,2) not null,
  currency text default 'DZD',
  payment_method text,
  payment_status text check (payment_status in ('Paid', 'Partial', 'Pending')) default 'Paid',
  linked_order_id uuid references public.orders(id),
  linked_car_id uuid references public.cars(id),
  created_by uuid references public.profiles(id),
  transaction_date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.cars enable row level security;
alter table public.orders enable row level security;
alter table public.shipping_forms enable row level security;
alter table public.transactions enable row level security;

-- Policies (Simplified for Admin App: Authenticated users can do everything)
create policy "Enable all access for authenticated users" on public.profiles for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.cars for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.orders for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.shipping_forms for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.transactions for all using (auth.role() = 'authenticated');

-- Storage Buckets (You need to create these in Supabase Dashboard > Storage)
-- 'car-images'
-- 'shipping-docs'
