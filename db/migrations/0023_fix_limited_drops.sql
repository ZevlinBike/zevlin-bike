-- Correct backfill: mark gaiter and towel as limited drops
UPDATE products
SET category = 'limited'
WHERE slug IN ('byot-towel', 'zevlin-gaiter');

