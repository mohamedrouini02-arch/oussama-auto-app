-- Migration: Allow public read access for car_inventory and verify car-media bucket
-- Date: 2026-09-15
-- Purpose: Connect dashboard car inventory with the public website

-- 1. Enable RLS on car_inventory if not already enabled
ALTER TABLE car_inventory ENABLE ROW LEVEL SECURITY;

-- 2. Allow public (anon and authenticated) to SELECT from car_inventory
DROP POLICY IF EXISTS "Public can view car inventory" ON car_inventory;
CREATE POLICY "Public can view car inventory" ON car_inventory
    FOR SELECT TO anon, authenticated
    USING (true);

-- 3. Ensure car-media storage bucket is public and allows public downloads
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-media', 'car-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. Storage policy: Anyone can view/download car-media assets
DROP POLICY IF EXISTS "Public Access car-media" ON storage.objects;
CREATE POLICY "Public Access car-media" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'car-media');
