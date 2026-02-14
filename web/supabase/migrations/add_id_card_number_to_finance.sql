-- Add id_card_number column to financial_transactions
ALTER TABLE public.financial_transactions
ADD COLUMN IF NOT EXISTS customer_id_card TEXT;
