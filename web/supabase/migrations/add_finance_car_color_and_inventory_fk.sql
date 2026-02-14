-- Add car_color to financial_transactions if it doesn't exist
ALTER TABLE public.financial_transactions 
ADD COLUMN IF NOT EXISTS car_color TEXT;

-- Add foreign key constraint to car_inventory.added_by if it doesn't exist
-- This assumes public.profiles table exists and id is uuid. 
-- We try to add it; if it fails due to existing constraint, it's fine.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_car_inventory_added_by') THEN 
        ALTER TABLE public.car_inventory 
        ADD CONSTRAINT fk_car_inventory_added_by 
        FOREIGN KEY (added_by) 
        REFERENCES public.profiles(id); 
    END IF; 
END $$;

-- Make added_by NOT NULL to enforce requirement (Optional, based on requirement)
-- ALTER TABLE public.car_inventory ALTER COLUMN added_by SET NOT NULL;
