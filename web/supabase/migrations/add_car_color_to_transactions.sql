-- Add car_color column to financial_transactions
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS car_color TEXT;

-- Backfill car_color from car_inventory based on related_car_id
UPDATE financial_transactions
SET car_color = car_inventory.color
FROM car_inventory
WHERE financial_transactions.related_car_id = car_inventory.id;
