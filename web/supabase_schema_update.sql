-- Add new columns to financial_transactions table
ALTER TABLE financial_transactions
ADD COLUMN IF NOT EXISTS car_buying_price NUMERIC,
ADD COLUMN IF NOT EXISTS buying_currency TEXT DEFAULT 'DZD',
ADD COLUMN IF NOT EXISTS original_buying_price NUMERIC,
ADD COLUMN IF NOT EXISTS exchange_rate_dzd_usdt NUMERIC,
ADD COLUMN IF NOT EXISTS exchange_rate_usdt_krw NUMERIC,
ADD COLUMN IF NOT EXISTS is_paid_in_korea BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS paid_in_korea_date TIMESTAMP WITH TIME ZONE;

-- Create settings table for exchange rates
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default exchange rates
INSERT INTO settings (key, value)
VALUES
  ('exchange_rate_dzd_usdt', '240'),
  ('exchange_rate_usdt_krw', '1380')
ON CONFLICT (key) DO NOTHING;

-- Grant permissions (optional, depending on your setup)
GRANT ALL ON TABLE settings TO authenticated;
GRANT ALL ON TABLE settings TO service_role;
