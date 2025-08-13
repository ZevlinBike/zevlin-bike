-- Allow public to insert into newsletter_signups (RLS)
-- Inserts should be allowed for both unauthenticated (anon) and authenticated users.

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE newsletter_signups ENABLE ROW LEVEL SECURITY;

-- Allow anonymous (unauthenticated) users to insert their email
DROP POLICY IF EXISTS "Allow anon insert on newsletter_signups" ON newsletter_signups;
CREATE POLICY "Allow anon insert on newsletter_signups"
  ON newsletter_signups
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert their email as well
DROP POLICY IF EXISTS "Allow authenticated insert on newsletter_signups" ON newsletter_signups;
CREATE POLICY "Allow authenticated insert on newsletter_signups"
  ON newsletter_signups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

