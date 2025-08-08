-- Migration: Allow multiple images per product
-- This migration removes the unique constraint on the product_id column
-- in the product_images table, allowing for a one-to-many relationship.

ALTER TABLE public.product_images
DROP CONSTRAINT IF EXISTS product_images_product_id_key;

COMMENT ON TABLE public.product_images IS 'Stores multiple images for each product.';
