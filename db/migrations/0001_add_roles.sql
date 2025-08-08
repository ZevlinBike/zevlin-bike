-- Migration: Add Roles and User-Roles tables
-- This migration sets up a basic role-based access control (RBAC) system.

-- 1. Create the 'roles' table
-- This table stores the different roles available in the application.
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE roles IS 'Stores the different user roles for RBAC.';
COMMENT ON COLUMN roles.name IS 'The unique name of the role (e.g., admin, customer).';

-- 2. Create the 'user_roles' junction table
-- This table links users from the 'customers' table to their roles.
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (customer_id, role_id) -- Ensures a user can't have the same role twice
);

COMMENT ON TABLE user_roles IS 'Links customers to their assigned roles.';
COMMENT ON COLUMN user_roles.customer_id IS 'Foreign key to the customers table.';
COMMENT ON COLUMN user_roles.role_id IS 'Foreign key to the roles table.';

-- 3. Seed the 'roles' table with initial data
-- Insert the fundamental roles for the application.
INSERT INTO roles (name, description)
VALUES
  ('admin', 'Administrator with full access to the system.'),
  ('customer', 'A standard user who can make purchases.')
ON CONFLICT (name) DO NOTHING;

-- 4. (Optional) Create a helper function to check user roles
-- This can be useful for RLS policies.
CREATE OR REPLACE FUNCTION get_user_roles(user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  user_roles TEXT[];
BEGIN
  SELECT array_agg(r.name)
  INTO user_roles
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.customer_id = user_id;
  RETURN user_roles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_roles(UUID) IS 'Retrieves all role names for a given customer ID.';
