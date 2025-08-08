-- Migration: Add unique constraint to product_images table
-- This ensures that a product can only have one "featured" image entry,
-- which is required for the ON CONFLICT upsert logic to work correctly.

-- Drop the existing constraint if it exists, to make this script re-runnable
ALTER TABLE public.product_images DROP CONSTRAINT IF EXISTS product_images_product_id_key;

-- Add the unique constraint to the product_id column
ALTER TABLE public.product_images
ADD CONSTRAINT product_images_product_id_key UNIQUE (product_id);

COMMENT ON CONSTRAINT product_images_product_id_key ON public.product_images IS 'Ensures each product can only have one primary image entry in this table.';
