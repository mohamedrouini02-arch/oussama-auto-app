-- ==========================================
-- 1. HELPER FUNCTIONS FOR ROLE CHECKING
-- ==========================================

-- Function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if the current user is staff
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'staff'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. ENABLE RLS ON ALL RELEVANT TABLES
-- ==========================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. POLICIES FOR ORDERS
-- ==========================================

-- DROP existing policies to ensure clean state (optional, can comment out if fresh)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable update for owners and admins" ON public.orders;
DROP POLICY IF EXISTS "Enable delete for owners and admins" ON public.orders;

-- SELECT: Authenticated users (Staff & Admin) can view all orders
CREATE POLICY "Enable read access for authenticated users" ON public.orders
    FOR SELECT USING (auth.role() = 'authenticated');

-- INSERT: Authenticated users can create orders
CREATE POLICY "Enable insert for authenticated users" ON public.orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: Admins map update info. Owners (who added it) can update.
CREATE POLICY "Enable update for owners and admins" ON public.orders
    FOR UPDATE USING (
        (auth.uid() = added_by) OR public.is_admin()
    );

-- DELETE: Admins and Owners can delete.
CREATE POLICY "Enable delete for owners and admins" ON public.orders
    FOR DELETE USING (
        (auth.uid() = added_by) OR public.is_admin()
    );

-- ==========================================
-- 4. POLICIES FOR SHIPPING FORMS
-- ==========================================

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.shipping_forms;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.shipping_forms;
DROP POLICY IF EXISTS "Enable update for owners and admins" ON public.shipping_forms;
DROP POLICY IF EXISTS "Enable delete for owners and admins" ON public.shipping_forms;

CREATE POLICY "Enable read access for authenticated users" ON public.shipping_forms
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.shipping_forms
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for owners and admins" ON public.shipping_forms
    FOR UPDATE USING (
        (auth.uid() = added_by) OR public.is_admin()
    );

CREATE POLICY "Enable delete for owners and admins" ON public.shipping_forms
    FOR DELETE USING (
        (auth.uid() = added_by) OR public.is_admin()
    );

-- ==========================================
-- 5. POLICIES FOR CAR INVENTORY
-- ==========================================

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.car_inventory;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.car_inventory;
DROP POLICY IF EXISTS "Enable update for owners and admins" ON public.car_inventory;
DROP POLICY IF EXISTS "Enable delete for owners and admins" ON public.car_inventory;

CREATE POLICY "Enable read access for authenticated users" ON public.car_inventory
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.car_inventory
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for owners and admins" ON public.car_inventory
    FOR UPDATE USING (
        (auth.uid() = added_by) OR public.is_admin()
    );

CREATE POLICY "Enable delete for owners and admins" ON public.car_inventory
    FOR DELETE USING (
        (auth.uid() = added_by) OR public.is_admin()
    );

-- ==========================================
-- 6. POLICIES FOR FINANCIAL TRANSACTIONS
-- ==========================================

-- Strict Access: Only Admins can access Finance for now (based on UI requirements).
-- If Staff needed to create transactions, we would relax the INSERT policy.

DROP POLICY IF EXISTS "Admins have full access" ON public.financial_transactions;

CREATE POLICY "Admins have full access" ON public.financial_transactions
    FOR ALL USING (public.is_admin());

-- Ensure the added_by column is referenced correctly in other tables
-- (Already added by previous migration, but good to double check)
-- ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES auth.users(id);

