-- SQL Script to Identify and Fix Shipping Form Image Link Issues
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: View all shipping forms with their images
-- ============================================
SELECT 
    id,
    name,
    vehicle_model,
    pdf_url,
    passport_photo_url,
    id_card_url,
    id_card_back_url,
    vehicle_photos_urls,
    created_at
FROM shipping_forms
ORDER BY created_at DESC;

-- ============================================
-- STEP 2: Find specific record (CHERABTA AYAD)
-- ============================================
SELECT 
    id,
    name,
    vehicle_model,
    passport_photo_url,
    id_card_url,
    id_card_back_url,
    vehicle_photos_urls
FROM shipping_forms
WHERE name ILIKE '%CHERABTA%' OR name ILIKE '%AYAD%';

-- ============================================
-- STEP 3: Check for potential issues
-- ============================================

-- Check records with missing passport but have ID card (might be swapped)
SELECT 
    id,
    name,
    passport_photo_url,
    id_card_url
FROM shipping_forms
WHERE passport_photo_url IS NULL AND id_card_url IS NOT NULL;

-- Check records where URLs might contain wrong bucket names
SELECT 
    id,
    name,
    'passport' as field_name,
    passport_photo_url as url
FROM shipping_forms
WHERE passport_photo_url IS NOT NULL
    AND passport_photo_url NOT LIKE '%documents/passport%'

UNION ALL

SELECT 
    id,
    name,
    'id_card' as field_name,
    id_card_url as url
FROM shipping_forms
WHERE id_card_url IS NOT NULL
    AND id_card_url NOT LIKE '%documents/id-cards%';

-- ============================================
-- STEP 4: FIX EXAMPLES (Uncomment and modify as needed)
-- ============================================

-- Example 1: Swap passport and ID card URLs for a specific record
/*
UPDATE shipping_forms
SET 
    passport_photo_url = id_card_url,
    id_card_url = passport_photo_url
WHERE id = YOUR_RECORD_ID_HERE;
*/

-- Example 2: Fix CHERABTA AYAD record if URLs are swapped
/*
UPDATE shipping_forms
SET 
    passport_photo_url = id_card_url,
    id_card_url = passport_photo_url
WHERE name ILIKE '%CHERABTA%AYAD%';
*/

-- Example 3: Set a specific URL for a field
/*
UPDATE shipping_forms
SET passport_photo_url = 'https://your-supabase-url/storage/v1/object/public/documents/passport-photos/yourfile.jpg'
WHERE id = YOUR_RECORD_ID_HERE;
*/

-- ============================================
-- STEP 5: Verify the fix
-- ============================================
/*
SELECT 
    id,
    name,
    passport_photo_url,
    id_card_url,
    id_card_back_url
FROM shipping_forms
WHERE id = YOUR_RECORD_ID_HERE;
*/

-- ============================================
-- HELPFUL QUERIES
-- ============================================

-- Count records by image field population
SELECT 
    COUNT(*) as total_records,
    COUNT(passport_photo_url) as has_passport,
    COUNT(id_card_url) as has_id_card_front,
    COUNT(id_card_back_url) as has_id_card_back,
    COUNT(vehicle_photos_urls) as has_vehicle_photos
FROM shipping_forms;

-- List all unique bucket paths used
SELECT DISTINCT
    SUBSTRING(passport_photo_url FROM 'https://[^/]+/storage/v1/object/public/([^/]+)/') as bucket
FROM shipping_forms
WHERE passport_photo_url IS NOT NULL

UNION

SELECT DISTINCT
    SUBSTRING(id_card_url FROM 'https://[^/]+/storage/v1/object/public/([^/]+)/') as bucket
FROM shipping_forms
WHERE id_card_url IS NOT NULL;
