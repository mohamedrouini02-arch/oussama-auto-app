-- Update sort_order for prioritized Chinese brands
-- MG first, then Geely, then Liven

-- First, set a high default for all Chinese cars to ensure they don't interfere
UPDATE website_cars
SET sort_order = 100
WHERE origin = 'chinese';

-- Set specific orders
UPDATE website_cars
SET sort_order = 10
WHERE brand = 'MG' AND origin = 'chinese';

UPDATE website_cars
SET sort_order = 20
WHERE brand = 'Geely' AND origin = 'chinese';

UPDATE website_cars
SET sort_order = 30
WHERE brand = 'Liven' AND origin = 'chinese';
