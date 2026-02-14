-- Add id_card_back_url column to shipping_forms table
ALTER TABLE shipping_forms ADD COLUMN IF NOT EXISTS id_card_back_url text;

-- Reload the schema cache to ensure the API picks up the new column
NOTIFY pgrst, 'reload config';
