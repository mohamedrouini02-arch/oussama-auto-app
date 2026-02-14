-- Add shipping provider, shipment month, and related transaction ID to shipping_forms
-- Run this migration in Supabase SQL Editor

ALTER TABLE shipping_forms ADD COLUMN IF NOT EXISTS shipping_provider TEXT;
ALTER TABLE shipping_forms ADD COLUMN IF NOT EXISTS shipment_month TEXT; -- Format: YYYY-MM (e.g., '2026-02')
ALTER TABLE shipping_forms ADD COLUMN IF NOT EXISTS related_transaction_id TEXT;

-- Create index for faster lookups by transaction ID
CREATE INDEX IF NOT EXISTS idx_shipping_forms_transaction_id ON shipping_forms(related_transaction_id);

-- Create index for faster lookups by shipment month
CREATE INDEX IF NOT EXISTS idx_shipping_forms_shipment_month ON shipping_forms(shipment_month);
