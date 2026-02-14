-- =================================================================
-- ENFORCE INVENTORY RLS
-- =================================================================

-- 1. Enable RLS on car_inventory (Critical step missing previously)
ALTER TABLE public.car_inventory ENABLE ROW LEVEL SECURITY;

-- 2. Ensure added_by column exists (Safety check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_inventory' AND column_name = 'added_by') THEN
        ALTER TABLE public.car_inventory ADD COLUMN added_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.car_inventory;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.car_inventory;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.car_inventory;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.car_inventory;
DROP POLICY IF EXISTS "Staff can only view their own cars" ON public.car_inventory;
DROP POLICY IF EXISTS "Staff can only update their own cars" ON public.car_inventory;
DROP POLICY IF EXISTS "Staff can only delete their own cars" ON public.car_inventory;
DROP POLICY IF EXISTS "Admins have full access" ON public.car_inventory;

-- 4. Create comprehensive policies

-- SELECT: Staff see their own, Admins see all
CREATE POLICY "Inventory Visibility Policy" ON public.car_inventory
    FOR SELECT USING (
        (auth.uid() = added_by) OR public.is_admin()
    );

-- INSERT: Authenticated users can insert (will be marked as theirs via frontend logic)
CREATE POLICY "Inventory Insert Policy" ON public.car_inventory
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

-- UPDATE: Staff update their own, Admins update all
CREATE POLICY "Inventory Update Policy" ON public.car_inventory
    FOR UPDATE USING (
        (auth.uid() = added_by) OR public.is_admin()
    );

-- DELETE: Staff delete their own, Admins delete all
CREATE POLICY "Inventory Delete Policy" ON public.car_inventory
    FOR DELETE USING (
        (auth.uid() = added_by) OR public.is_admin()
    );

-- 5. Backfill existing NULL added_by records to a default admin or leave them visible only to admins?
-- OPTIONAL: If you want existing legacy cars to be visible to EVERYONE, you might need a different policy or backfill them.
-- For now, purely restrictive: NULL added_by cars will only be visible to admins.
