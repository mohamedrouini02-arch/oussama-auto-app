-- Create a table for public profiles
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text default 'staff' check (role in ('admin', 'manager', 'staff')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Trigger to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'staff');
  return new;
end;
$$ language plpgsql security definer;

-- Drop the trigger if it exists to avoid duplication errors on re-run
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Insert a profile for the existing admin user (Replace with your actual admin email if different)
-- This is just an example, you might need to manually update the role for your existing user in the Supabase dashboard
-- UPDATE profiles SET role = 'admin' WHERE email = 'contact@wahid-auto.com';
