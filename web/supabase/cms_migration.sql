-- ==========================================
-- CMS Tables for oussamaauto.com
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Website Cars Table
CREATE TABLE IF NOT EXISTS website_cars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL, -- URL-friendly ID like 'chevrolet-spark'
    brand TEXT NOT NULL,
    brand_ar TEXT NOT NULL,
    brand_fr TEXT NOT NULL,
    model TEXT NOT NULL,
    model_ar TEXT NOT NULL,
    model_fr TEXT NOT NULL,
    year INTEGER NOT NULL,
    end_year INTEGER, -- For year range display
    description_ar TEXT NOT NULL,
    description_fr TEXT NOT NULL,
    price_min BIGINT NOT NULL, -- in DZD
    price_max BIGINT NOT NULL, -- in DZD
    image TEXT NOT NULL, -- main image URL
    images TEXT[] DEFAULT '{}', -- additional images
    engine TEXT NOT NULL,
    engine_fr TEXT NOT NULL,
    transmission TEXT NOT NULL,
    transmission_fr TEXT NOT NULL,
    fuel_type TEXT NOT NULL,
    fuel_type_fr TEXT NOT NULL,
    seats INTEGER NOT NULL DEFAULT 5,
    features TEXT[] DEFAULT '{}', -- Arabic features
    features_fr TEXT[] DEFAULT '{}', -- French features
    colors TEXT[] DEFAULT '{}', -- Arabic colors
    colors_fr TEXT[] DEFAULT '{}', -- French colors
    category TEXT NOT NULL CHECK (category IN ('city', 'suv', 'sedan', 'hatchback')),
    is_popular BOOLEAN DEFAULT false,
    origin TEXT NOT NULL CHECK (origin IN ('korean', 'chinese')),
    is_active BOOLEAN DEFAULT true, -- soft delete / hide
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Website Content Table (for editable sections)
CREATE TABLE IF NOT EXISTS website_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section TEXT UNIQUE NOT NULL, -- e.g. 'hero', 'about', 'footer'
    content JSONB NOT NULL DEFAULT '{}', -- flexible JSON for any content
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Website Media Table (for managing uploaded images)
CREATE TABLE IF NOT EXISTS website_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- path in storage bucket
    file_url TEXT NOT NULL, -- public URL
    file_type TEXT NOT NULL, -- 'image/jpeg', 'image/png' etc
    file_size BIGINT DEFAULT 0,
    alt_text TEXT DEFAULT '',
    category TEXT DEFAULT 'general', -- 'car', 'hero', 'gallery' etc
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_website_cars_updated_at
    BEFORE UPDATE ON website_cars
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_website_content_updated_at
    BEFORE UPDATE ON website_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE website_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_media ENABLE ROW LEVEL SECURITY;

-- Public read access (website needs to read without auth)
CREATE POLICY "Public can read active cars" ON website_cars
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read content" ON website_content
    FOR SELECT USING (true);

CREATE POLICY "Public can read media" ON website_media
    FOR SELECT USING (true);

-- Authenticated users can manage (dashboard)
CREATE POLICY "Auth users can manage cars" ON website_cars
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can manage content" ON website_content
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can manage media" ON website_media
    FOR ALL USING (auth.role() = 'authenticated');

-- Create storage bucket for car images
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('website-images', 'website-images', true, 5242880) -- 5MB limit
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public can view website images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'website-images');

CREATE POLICY "Auth users can upload website images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'website-images' AND auth.role() = 'authenticated');

CREATE POLICY "Auth users can update website images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'website-images' AND auth.role() = 'authenticated');

CREATE POLICY "Auth users can delete website images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'website-images' AND auth.role() = 'authenticated');

-- Seed default content sections
INSERT INTO website_content (section, content) VALUES
('hero', '{
    "badge_ar": "🚗 الوكيل الأول في الجزائر",
    "badge_fr": "🚗 Premier importateur en Algérie",
    "title1_ar": "استورد سيارتك الجديدة أو المستعملة مباشرة من",
    "title1_fr": "Importez votre voiture neuve ou d''occasion directement de",
    "title2_ar": "كوريا والصين",
    "title2_fr": "Corée et Chine",
    "subtitle_ar": "خبرة واسعة في استيراد السيارات الكورية والصينية بأفضل الأسعار مع ضمان الجودة والدعم الكامل من الشراء حتى التسليم",
    "subtitle_fr": "Une grande expérience dans l''importation de voitures coréennes et chinoises aux meilleurs prix avec garantie de qualité et support complet de l''achat à la livraison"
}'),
('about', '{
    "story_ar": "بدأت أوسامة أوتو كحلم لتسهيل عملية استيراد السيارات للمواطن الجزائري.",
    "story_fr": "Oussama Auto a commencé comme un rêve pour faciliter l''importation de voitures pour les citoyens algériens.",
    "mission_ar": "تقديم تجربة استيراد سيارات سلسة وشفافة وموثوقة",
    "mission_fr": "Offrir une expérience d''importation de voitures fluide, transparente et fiable",
    "vision_ar": "أن نكون الخيار الأول والأكثر ثقة لاستيراد السيارات في الجزائر",
    "vision_fr": "Devenir le premier choix et le plus fiable pour l''importation de voitures en Algérie"
}'),
('contact', '{
    "phone": "+213782769427",
    "whatsapp": "+821068737079",
    "email": "contact@oussamaauto.com",
    "address_ar": "الميلية، جيجل، الجزائر",
    "address_fr": "El Milia, Jijel, Algérie"
}')
ON CONFLICT (section) DO NOTHING;
