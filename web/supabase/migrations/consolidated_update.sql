-- =================================================================
-- CONSOLIDATED MIGRATION SCRIPT
-- 1. Schema Changes (New Columns)
-- 2. Helper Functions (Role Checks)
-- 3. RLS Policies (Security Rules)
-- =================================================================

-- -----------------------------------------------------------------
-- 1. SCHEMA CHANGES: ADD OWNERSHIP COLUMNS
-- -----------------------------------------------------------------

DO $$ 
BEGIN 
    -- Add added_by to orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'added_by') THEN
        ALTER TABLE public.orders ADD COLUMN added_by UUID REFERENCES auth.users(id);
    END IF;

    -- Add added_by to shipping_forms
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipping_forms' AND column_name = 'added_by') THEN
        ALTER TABLE public.shipping_forms ADD COLUMN added_by UUID REFERENCES auth.users(id);
    END IF;

    -- Add added_by to financial_transactions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_transactions' AND column_name = 'added_by') THEN
        ALTER TABLE public.financial_transactions ADD COLUMN added_by UUID REFERENCES auth.users(id);
    END IF;

    -- Add added_by to car_inventory (checking just in case, though it might exist)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_inventory' AND column_name = 'added_by') THEN
        ALTER TABLE public.car_inventory ADD COLUMN added_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- -----------------------------------------------------------------
-- 2. HELPER FUNCTIONS
-- -----------------------------------------------------------------

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

-- -----------------------------------------------------------------
-- 3. ENABLE RLS
-- -----------------------------------------------------------------

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------
-- 4. RLS POLICIES
-- -----------------------------------------------------------------

-- === ORDERS ===
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable update for owners and admins" ON public.orders;
DROP POLICY IF EXISTS "Enable delete for owners and admins" ON public.orders;

CREATE POLICY "Enable read access for authenticated users" ON public.orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for owners and admins" ON public.orders
    FOR UPDATE USING ((auth.uid() = added_by) OR public.is_admin());

CREATE POLICY "Enable delete for owners and admins" ON public.orders
    FOR DELETE USING ((auth.uid() = added_by) OR public.is_admin());

-- === SHIPPING FORMS ===
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.shipping_forms;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.shipping_forms;
DROP POLICY IF EXISTS "Enable update for owners and admins" ON public.shipping_forms;
DROP POLICY IF EXISTS "Enable delete for owners and admins" ON public.shipping_forms;

CREATE POLICY "Enable read access for authenticated users" ON public.shipping_forms
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.shipping_forms
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for owners and admins" ON public.shipping_forms
    FOR UPDATE USING ((auth.uid() = added_by) OR public.is_admin());

CREATE POLICY "Enable delete for owners and admins" ON public.shipping_forms
    FOR DELETE USING ((auth.uid() = added_by) OR public.is_admin());

-- === CAR INVENTORY ===
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.car_inventory;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.car_inventory;
DROP POLICY IF EXISTS "Enable update for owners and admins" ON public.car_inventory;
DROP POLICY IF EXISTS "Enable delete for owners and admins" ON public.car_inventory;

CREATE POLICY "Enable read access for authenticated users" ON public.car_inventory
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.car_inventory
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for owners and admins" ON public.car_inventory
    FOR UPDATE USING ((auth.uid() = added_by) OR public.is_admin());

CREATE POLICY "Enable delete for owners and admins" ON public.car_inventory
    FOR DELETE USING ((auth.uid() = added_by) OR public.is_admin());

-- === FINANCIAL TRANSACTIONS ===
-- Restrict to Admins Only for now, based on strict requirement.
DROP POLICY IF EXISTS "Admins have full access" ON public.financial_transactions;

CREATE POLICY "Admins have full access" ON public.financial_transactions
    FOR ALL USING (public.is_admin());

