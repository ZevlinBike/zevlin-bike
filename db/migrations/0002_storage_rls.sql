-- Migration: Add Row Level Security (RLS) for Product Images in Supabase Storage
-- This migration secures the 'products' storage bucket.

-- 1. Create a helper function to get roles from the current authenticated user
-- This is necessary because storage RLS policies operate based on the `auth.uid()`.
CREATE OR REPLACE FUNCTION get_roles_for_auth_user()
RETURNS TEXT[] AS $$
DECLARE
  user_roles TEXT[];
  v_customer_id UUID;
BEGIN
  -- Find the customer_id associated with the current authenticated user
  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE auth_user_id = auth.uid();

  IF v_customer_id IS NULL THEN
    RETURN ARRAY[]::TEXT[];
  END IF;

  -- Get the roles for that customer
  SELECT array_agg(r.name)
  INTO user_roles
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.customer_id = v_customer_id;

  RETURN COALESCE(user_roles, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_roles_for_auth_user() IS 'Retrieves all role names for the currently authenticated user.';


-- 2. Enable RLS on the storage.objects table
-- This is often enabled by default, but it's good to be explicit.
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;


-- 3. Drop existing policies for the 'products' bucket to ensure a clean slate
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can insert product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete product images" ON storage.objects;


-- 4. Create policies for the 'products' bucket

-- Policy: Allow public read access
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'products' );

-- Policy: Allow admin insert access
CREATE POLICY "Admin can insert product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products' AND
  'admin' = ANY(get_roles_for_auth_user())
);

-- Policy: Allow admin update access
CREATE POLICY "Admin can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products' AND
  'admin' = ANY(get_roles_for_auth_user())
);

-- Policy: Allow admin delete access
CREATE POLICY "Admin can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'products' AND
  'admin' = ANY(get_roles_for_auth_user())
);
