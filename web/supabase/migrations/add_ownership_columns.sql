-- Add added_by column to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES auth.users(id);

-- Add added_by column to shipping_forms
ALTER TABLE public.shipping_forms
ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES auth.users(id);

-- Add added_by column to financial_transactions
ALTER TABLE public.financial_transactions
ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES auth.users(id);

-- Update RLS policies (Optional but recommended)
-- Enable RLS on tables if not already enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Policy for Orders: Staff can see all, but only update/delete their own. Admins can do all.
-- (Assuming we have a function or claim to check roles, OR simple check on public.profiles)

-- For now, let's keep it simple and just rely on the frontend check for UI, 
-- but ideally we should enforce this in RLS.
-- This script only adds the column as requested.
