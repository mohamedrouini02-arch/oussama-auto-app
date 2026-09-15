-- =================================================================
-- MIGRATION: ADD BON DE COMMANDE, CONTRACT & BATCH FIELDS
-- =================================================================

-- 1. Add new columns to financial_transactions
ALTER TABLE public.financial_transactions
ADD COLUMN IF NOT EXISTS order_number TEXT,
ADD COLUMN IF NOT EXISTS car_trim TEXT,
ADD COLUMN IF NOT EXISTS car_energy TEXT,
ADD COLUMN IF NOT EXISTS car_transmission TEXT,
ADD COLUMN IF NOT EXISTS country_of_origin TEXT,
ADD COLUMN IF NOT EXISTS delivery_method TEXT,
ADD COLUMN IF NOT EXISTS batch_name TEXT,
ADD COLUMN IF NOT EXISTS batch_archived BOOLEAN DEFAULT FALSE;

-- 2. Add new columns to car_inventory
ALTER TABLE public.car_inventory
ADD COLUMN IF NOT EXISTS trim TEXT,
ADD COLUMN IF NOT EXISTS energy TEXT,
ADD COLUMN IF NOT EXISTS transmission TEXT,
ADD COLUMN IF NOT EXISTS country_of_origin TEXT;

-- 3. Add new columns to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS car_trim TEXT,
ADD COLUMN IF NOT EXISTS car_energy TEXT,
ADD COLUMN IF NOT EXISTS car_transmission TEXT,
ADD COLUMN IF NOT EXISTS country_of_origin TEXT;

-- 4. Create shipment_batches table
CREATE TABLE IF NOT EXISTS public.shipment_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS on shipment_batches
ALTER TABLE public.shipment_batches ENABLE ROW LEVEL SECURITY;

-- Allow public access on shipment_batches
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'shipment_batches' AND policyname = 'Allow public read access on shipment_batches'
    ) THEN
        CREATE POLICY "Allow public read access on shipment_batches" 
        ON public.shipment_batches FOR SELECT 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'shipment_batches' AND policyname = 'Allow all access on shipment_batches'
    ) THEN
        CREATE POLICY "Allow all access on shipment_batches" 
        ON public.shipment_batches FOR ALL 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;
