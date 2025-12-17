-- Health Monitor: runs and run items
-- Creates enums, tables, indexes, and RLS policies for storing health check results.

-- 1) Enums
DO $$ BEGIN
  CREATE TYPE health_status AS ENUM ('pass','warn','fail','skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE health_category AS ENUM (
    'env','db','catalog','checkout','payments','shipping','refunds','content','notifications','admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Tables
CREATE TABLE IF NOT EXISTS health_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  environment TEXT NOT NULL DEFAULT COALESCE(current_setting('app.environment', true), current_setting('server_version', true)),
  triggered_by TEXT NOT NULL DEFAULT 'manual', -- manual | schedule | deploy | api
  actor_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  actor_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  version TEXT, -- optional app/version tag
  total INT NOT NULL DEFAULT 0,
  passed INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  warn INT NOT NULL DEFAULT 0,
  skipped INT NOT NULL DEFAULT 0,
  overall health_status NOT NULL DEFAULT 'pass',
  notes TEXT,
  meta JSONB
);

COMMENT ON TABLE health_runs IS 'Top-level executions of the Health Monitor with aggregated results.';

CREATE TABLE IF NOT EXISTS health_run_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES health_runs(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  category health_category NOT NULL,
  status health_status NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  duration_ms INT,
  meta JSONB,
  remediate_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, key)
);

COMMENT ON TABLE health_run_items IS 'Per-check results captured during a health run.';

-- 3) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_health_runs_started_at ON health_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_runs_overall ON health_runs(overall);
CREATE INDEX IF NOT EXISTS idx_health_run_items_run ON health_run_items(run_id);
CREATE INDEX IF NOT EXISTS idx_health_run_items_category ON health_run_items(category);

-- 4) RLS (admin-only access; service role bypasses RLS)
ALTER TABLE health_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_run_items ENABLE ROW LEVEL SECURITY;

-- Admins can read all
DROP POLICY IF EXISTS "Admin read health_runs" ON health_runs;
CREATE POLICY "Admin read health_runs" ON health_runs
  FOR SELECT TO authenticated
  USING ('admin' = ANY(get_roles_for_auth_user()));

DROP POLICY IF EXISTS "Admin read health_run_items" ON health_run_items;
CREATE POLICY "Admin read health_run_items" ON health_run_items
  FOR SELECT TO authenticated
  USING (
    'admin' = ANY(get_roles_for_auth_user())
    AND EXISTS (
      SELECT 1 FROM health_runs r WHERE r.id = health_run_items.run_id
    )
  );

-- Admins can insert
DROP POLICY IF EXISTS "Admin insert health_runs" ON health_runs;
CREATE POLICY "Admin insert health_runs" ON health_runs
  FOR INSERT TO authenticated
  WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

DROP POLICY IF EXISTS "Admin insert health_run_items" ON health_run_items;
CREATE POLICY "Admin insert health_run_items" ON health_run_items
  FOR INSERT TO authenticated
  WITH CHECK (
    'admin' = ANY(get_roles_for_auth_user())
    AND EXISTS (
      SELECT 1 FROM health_runs r WHERE r.id = health_run_items.run_id
    )
  );

-- Admins can update/delete
DROP POLICY IF EXISTS "Admin manage health_runs" ON health_runs;
CREATE POLICY "Admin manage health_runs" ON health_runs
  FOR ALL TO authenticated
  USING ('admin' = ANY(get_roles_for_auth_user()))
  WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

DROP POLICY IF EXISTS "Admin manage health_run_items" ON health_run_items;
CREATE POLICY "Admin manage health_run_items" ON health_run_items
  FOR ALL TO authenticated
  USING ('admin' = ANY(get_roles_for_auth_user()))
  WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

-- 5) Optional: view to show latest run summary
CREATE OR REPLACE VIEW health_latest_run AS
SELECT r.*
FROM health_runs r
ORDER BY r.started_at DESC
LIMIT 1;

