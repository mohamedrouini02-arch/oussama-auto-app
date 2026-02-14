-- Create storage bucket 'car-media' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-media', 'car-media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for car-media
CREATE POLICY "Public Access Media"
ON storage.objects FOR SELECT
USING ( bucket_id = 'car-media' );

CREATE POLICY "Authenticated Upload Media"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'car-media' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Delete Media"
ON storage.objects FOR DELETE
USING ( bucket_id = 'car-media' AND auth.role() = 'authenticated' );

-- Fix car_inventory constraints
-- Drop the restrictive check_location constraint to allow free text
ALTER TABLE car_inventory DROP CONSTRAINT IF EXISTS check_location;

-- Ensure video_url column exists
ALTER TABLE car_inventory ADD COLUMN IF NOT EXISTS video_url text;
