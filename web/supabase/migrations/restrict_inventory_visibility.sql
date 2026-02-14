-- =================================================================
-- RESTRICT INVENTORY VISIBILITY
-- =================================================================
-- This script updates the RLS policy for car_inventory to ensure
-- Staff can ONLY see cars they added.
-- Admins can see ALL cars.

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.car_inventory;

CREATE POLICY "Enable read access for authenticated users" ON public.car_inventory
    FOR SELECT USING (
        (auth.uid() = added_by) OR public.is_admin()
    );
