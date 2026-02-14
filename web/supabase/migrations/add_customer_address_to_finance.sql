-- Add customer_address to financial_transactions table
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS customer_address TEXT;

-- Refresh the schema cache if needed
notify pgrst, 'reload config';
