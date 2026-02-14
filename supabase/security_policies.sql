-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_forms ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Table
-- Allow authenticated users to view all profiles (e.g. for team lists)
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
CREATE POLICY "Authenticated users can view all profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

-- Allow users to insert their own profile (usually handled by triggers, but good to have)
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING ((select auth.uid()) = id);

-- 2. Financial Transactions Table
-- Allow authenticated users to perform all operations (internal dashboard)
DROP POLICY IF EXISTS "Authenticated users can manage financial_transactions" ON financial_transactions;
CREATE POLICY "Authenticated users can manage financial_transactions" ON financial_transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Car Inventory Table
-- Allow authenticated users to perform all operations
DROP POLICY IF EXISTS "Authenticated users can manage car_inventory" ON car_inventory;
CREATE POLICY "Authenticated users can manage car_inventory" ON car_inventory
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Orders Table
-- Allow authenticated users to perform all operations
DROP POLICY IF EXISTS "Authenticated users can manage orders" ON orders;
CREATE POLICY "Authenticated users can manage orders" ON orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Shipping Forms Table
-- Allow authenticated users to perform all operations
DROP POLICY IF EXISTS "Authenticated users can manage shipping_forms" ON shipping_forms;
CREATE POLICY "Authenticated users can manage shipping_forms" ON shipping_forms
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
