-- Add new columns to financial_transactions table
ALTER TABLE public.financial_transactions
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_postal_code TEXT,
ADD COLUMN IF NOT EXISTS shipping_price NUMERIC;
