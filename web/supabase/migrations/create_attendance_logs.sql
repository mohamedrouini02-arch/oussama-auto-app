-- Drop the table if it exists (RESETTING DATA structure)
DROP TABLE IF EXISTS public.attendance_logs;

-- Create the table linked to EMPLOYEES
CREATE TABLE public.attendance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Policies: STRICT ADMIN CONTROL
-- Admins can do everything (Select, Insert, Update, Delete)
CREATE POLICY "Admins full control attendance_logs"
on public.attendance_logs
for all
to authenticated
using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
)
with check (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);
