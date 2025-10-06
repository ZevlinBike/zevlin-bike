-- Harden webhook_events: enable RLS, admin read, anon insert-only for webhook endpoints,
-- and helpful indexes for querying and maintenance.

-- Enable RLS
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Admins can read and delete; restrict updates to admins if needed
DROP POLICY IF EXISTS "Admin read webhook_events" ON webhook_events;
CREATE POLICY "Admin read webhook_events" ON webhook_events
  FOR SELECT TO authenticated
  USING ('admin' = ANY(get_roles_for_auth_user()));

DROP POLICY IF EXISTS "Admin manage webhook_events" ON webhook_events;
CREATE POLICY "Admin manage webhook_events" ON webhook_events
  FOR DELETE TO authenticated
  USING ('admin' = ANY(get_roles_for_auth_user()));

-- Allow inserts from anon (webhook routes use service key soon, but this keeps
-- things working in non-service environments). Only permits INSERT.
DROP POLICY IF EXISTS "Anon insert webhook_events" ON webhook_events;
CREATE POLICY "Anon insert webhook_events" ON webhook_events
  FOR INSERT TO anon
  WITH CHECK (true);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS webhook_events_by_source_time
  ON webhook_events (source, received_at DESC);

-- Optionally, consider a TTL via cron separately; not included here

