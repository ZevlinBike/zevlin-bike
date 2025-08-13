-- Fix RLS policies for newsletters to allow admin users (authenticated) to manage

ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

-- Clean up old policy if it exists
DROP POLICY IF EXISTS "Allow all for admin users" ON newsletters;

-- Allow admin role read access
DROP POLICY IF EXISTS "Allow admin read on newsletters" ON newsletters;
CREATE POLICY "Allow admin read on newsletters" ON newsletters
  FOR SELECT
  TO authenticated
  USING ('admin' = ANY(get_roles_for_auth_user()));

-- Allow admin role insert
DROP POLICY IF EXISTS "Allow admin insert on newsletters" ON newsletters;
CREATE POLICY "Allow admin insert on newsletters" ON newsletters
  FOR INSERT
  TO authenticated
  WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

-- Allow admin role update
DROP POLICY IF EXISTS "Allow admin update on newsletters" ON newsletters;
CREATE POLICY "Allow admin update on newsletters" ON newsletters
  FOR UPDATE
  TO authenticated
  USING ('admin' = ANY(get_roles_for_auth_user()))
  WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

-- Allow admin role delete
DROP POLICY IF EXISTS "Allow admin delete on newsletters" ON newsletters;
CREATE POLICY "Allow admin delete on newsletters" ON newsletters
  FOR DELETE
  TO authenticated
  USING ('admin' = ANY(get_roles_for_auth_user()));

