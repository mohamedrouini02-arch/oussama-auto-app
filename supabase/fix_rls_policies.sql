-- =========================================
-- SUPABASE RLS POLICIES FIX
-- Run this SQL in your Supabase SQL Editor
-- =========================================

-- 1. Enable RLS on tables if not already enabled
ALTER TABLE shipping_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they conflict
DROP POLICY IF EXISTS "Allow authenticated inserts on shipping_forms" ON shipping_forms;
DROP POLICY IF EXISTS "Allow authenticated selects on shipping_forms" ON shipping_forms;
DROP POLICY IF EXISTS "Allow authenticated updates on shipping_forms" ON shipping_forms;
DROP POLICY IF EXISTS "Allow authenticated deletes on shipping_forms" ON shipping_forms;

DROP POLICY IF EXISTS "Allow authenticated inserts on financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Allow authenticated selects on financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Allow authenticated updates on financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Allow authenticated deletes on financial_transactions" ON financial_transactions;

DROP POLICY IF EXISTS "Allow authenticated inserts on orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated selects on orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated updates on orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated deletes on orders" ON orders;

-- 3. Create new policies for shipping_forms
CREATE POLICY "Allow authenticated inserts on shipping_forms" 
ON shipping_forms
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated selects on shipping_forms" 
ON shipping_forms
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated updates on shipping_forms" 
ON shipping_forms
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated deletes on shipping_forms" 
ON shipping_forms
FOR DELETE 
TO authenticated
USING (true);

-- 4. Create new policies for financial_transactions
CREATE POLICY "Allow authenticated inserts on financial_transactions" 
ON financial_transactions
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated selects on financial_transactions" 
ON financial_transactions
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated updates on financial_transactions" 
ON financial_transactions
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated deletes on financial_transactions" 
ON financial_transactions
FOR DELETE 
TO authenticated
USING (true);

-- 5. Create new policies for orders
CREATE POLICY "Allow authenticated inserts on orders" 
ON orders
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated selects on orders" 
ON orders
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated updates on orders" 
ON orders
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated deletes on orders" 
ON orders
FOR DELETE 
TO authenticated
USING (true);

-- =========================================
-- VERIFICATION
-- Run these queries to verify policies are active:
-- =========================================

-- Check shipping_forms policies
SELECT * FROM pg_policies WHERE tablename = 'shipping_forms';

-- Check financial_transactions policies
SELECT * FROM pg_policies WHERE tablename = 'financial_transactions';

-- Check orders policies
SELECT * FROM pg_policies WHERE tablename = 'orders';
