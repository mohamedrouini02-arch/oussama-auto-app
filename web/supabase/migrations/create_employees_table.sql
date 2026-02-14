-- Create employees table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'Staff',
    status TEXT DEFAULT 'active',
    hourly_rate NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Policies: Admin Full Control
CREATE POLICY "Admins full control employees" ON public.employees
    FOR ALL
    TO authenticated
    USING ((select role from public.profiles where id = auth.uid()) = 'admin')
    WITH CHECK ((select role from public.profiles where id = auth.uid()) = 'admin');
