-- =================================================================
-- FIX: UUID = CHARACTER VARYING ERROR & MISSING FUNCTIONS
-- =================================================================

-- -----------------------------------------------------------------
-- 0. DEFINE HELPER FUNCTIONS (To ensure they exist)
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
-- 1. DROP POLICIES
-- -----------------------------------------------------------------

DROP POLICY IF EXISTS "Enable update for owners and admins" ON public.orders;
DROP POLICY IF EXISTS "Enable delete for owners and admins" ON public.orders;

DROP POLICY IF EXISTS "Enable update for owners and admins" ON public.shipping_forms;
DROP POLICY IF EXISTS "Enable delete for owners and admins" ON public.shipping_forms;

DROP POLICY IF EXISTS "Enable update for owners and admins" ON public.car_inventory;
DROP POLICY IF EXISTS "Enable delete for owners and admins" ON public.car_inventory;

-- -----------------------------------------------------------------
-- 2. CONVERT COLUMNS TO UUID
-- -----------------------------------------------------------------

-- Orders
ALTER TABLE public.orders 
ALTER COLUMN added_by TYPE UUID USING added_by::uuid;

-- Shipping Forms
ALTER TABLE public.shipping_forms 
ALTER COLUMN added_by TYPE UUID USING added_by::uuid;

-- Car Inventory
ALTER TABLE public.car_inventory 
ALTER COLUMN added_by TYPE UUID USING added_by::uuid;

-- Financial Transactions (just in case)
ALTER TABLE public.financial_transactions 
ALTER COLUMN added_by TYPE UUID USING added_by::uuid;

-- -----------------------------------------------------------------
-- 3. RE-APPLY POLICIES
-- -----------------------------------------------------------------

-- === ORDERS ===
CREATE POLICY "Enable update for owners and admins" ON public.orders
    FOR UPDATE USING ((auth.uid() = added_by) OR public.is_admin());

CREATE POLICY "Enable delete for owners and admins" ON public.orders
    FOR DELETE USING ((auth.uid() = added_by) OR public.is_admin());

-- === SHIPPING FORMS ===
CREATE POLICY "Enable update for owners and admins" ON public.shipping_forms
    FOR UPDATE USING ((auth.uid() = added_by) OR public.is_admin());

CREATE POLICY "Enable delete for owners and admins" ON public.shipping_forms
    FOR DELETE USING ((auth.uid() = added_by) OR public.is_admin());

-- === CAR INVENTORY ===
CREATE POLICY "Enable update for owners and admins" ON public.car_inventory
    FOR UPDATE USING ((auth.uid() = added_by) OR public.is_admin());

CREATE POLICY "Enable delete for owners and admins" ON public.car_inventory
    FOR DELETE USING ((auth.uid() = added_by) OR public.is_admin());
