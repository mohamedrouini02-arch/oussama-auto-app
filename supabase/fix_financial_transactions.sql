-- ============================================================================
-- FIX FINANCIAL TRANSACTIONS TABLE
-- Run this script in your Supabase SQL Editor to resolve constraint violations.
-- ============================================================================

-- 1. Drop potential existing conflicting constraints
-- We drop multiple naming variations to be safe
ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS check_payment_status;
ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_payment_status_check;
ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS check_type;
ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_type_check;

-- 2. Add standardized constraints
-- These values match what the application is trying to send.

-- Payment Status: 'Pending', 'Paid', 'Partial' (Capitalized)
ALTER TABLE financial_transactions 
ADD CONSTRAINT check_payment_status 
CHECK (payment_status IN ('Pending', 'Paid', 'Partial'));

-- Type: 'Income', 'Expense' (Capitalized)
ALTER TABLE financial_transactions 
ADD CONSTRAINT check_type 
CHECK (type IN ('Income', 'Expense'));

-- 3. Optional: Set default values if needed
ALTER TABLE financial_transactions 
ALTER COLUMN payment_status SET DEFAULT 'Pending';

-- 4. Verify the table structure (for your information)
-- Column: id (text or uuid)
-- Column: amount (numeric)
-- Column: type (text)
-- Column: payment_status (text)
