-- =================================================================
-- ADD MISSING COLUMNS TO FINANCIAL_TRANSACTIONS
-- =================================================================
-- The error "Could not find the 'related_order_number' column" indicates
-- we are missing several columns used in the Exchange/Transaction features.

ALTER TABLE public.financial_transactions
ADD COLUMN IF NOT EXISTS related_order_number TEXT,
ADD COLUMN IF NOT EXISTS related_car_id UUID, -- Assuming optional foreign key to car_inventory, or just generic UUID
ADD COLUMN IF NOT EXISTS car_brand TEXT,
ADD COLUMN IF NOT EXISTS car_model TEXT,
ADD COLUMN IF NOT EXISTS car_year NUMERIC,
ADD COLUMN IF NOT EXISTS car_vin TEXT;

-- Recommended: Add foreign key constraint if related_car_id refers to car_inventory
-- Uncomment if you want to enforce integrity:
-- ALTER TABLE public.financial_transactions 
-- ADD CONSTRAINT fk_related_car 
-- FOREIGN KEY (related_car_id) 
-- REFERENCES public.car_inventory(id)
-- ON DELETE SET NULL;
