-- Migration: Add Row Level Security (RLS) for the 'blog' storage bucket.

-- 1. Drop existing policies for the 'blog' bucket to ensure a clean slate
DROP POLICY IF EXISTS "Public read access for blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can insert blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete blog images" ON storage.objects;


-- 2. Create policies for the 'blog' bucket

-- Policy: Allow public read access
CREATE POLICY "Public read access for blog images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'blog' );

-- Policy: Allow admin insert access
CREATE POLICY "Admin can insert blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blog' AND
  'admin' = ANY(get_roles_for_auth_user())
);

-- Policy: Allow admin update access
CREATE POLICY "Admin can update blog images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'blog' AND
  'admin' = ANY(get_roles_for_auth_user())
);

-- Policy: Allow admin delete access
CREATE POLICY "Admin can delete blog images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog' AND
  'admin' = ANY(get_roles_for_auth_user())
);
