-- Lightweight analytics: counters + referrers + dedupe + RPC

-- 1) Tables
CREATE TABLE IF NOT EXISTS public.analytics_view_counts (
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  day DATE NOT NULL DEFAULT (CURRENT_DATE),
  views BIGINT NOT NULL DEFAULT 0,
  uniques BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT analytics_view_counts_pk PRIMARY KEY (type, slug, day)
);

CREATE TABLE IF NOT EXISTS public.analytics_referrer_counts (
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  referrer_domain TEXT NOT NULL,
  day DATE NOT NULL DEFAULT (CURRENT_DATE),
  views BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT analytics_referrer_counts_pk PRIMARY KEY (type, slug, referrer_domain, day)
);

-- Simple dedupe keys with TTL
CREATE TABLE IF NOT EXISTS public.analytics_dedupe_keys (
  key TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS analytics_view_counts_day_idx ON public.analytics_view_counts(day);
CREATE INDEX IF NOT EXISTS analytics_view_counts_slug_idx ON public.analytics_view_counts(slug);
CREATE INDEX IF NOT EXISTS analytics_referrer_counts_day_idx ON public.analytics_referrer_counts(day);
CREATE INDEX IF NOT EXISTS analytics_referrer_counts_slug_idx ON public.analytics_referrer_counts(slug);

-- 2) Triggers to maintain updated_at
CREATE OR REPLACE FUNCTION public._set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_analytics_view_counts ON public.analytics_view_counts;
CREATE TRIGGER set_updated_at_analytics_view_counts
BEFORE UPDATE ON public.analytics_view_counts
FOR EACH ROW EXECUTE FUNCTION public._set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_analytics_referrer_counts ON public.analytics_referrer_counts;
CREATE TRIGGER set_updated_at_analytics_referrer_counts
BEFORE UPDATE ON public.analytics_referrer_counts
FOR EACH ROW EXECUTE FUNCTION public._set_updated_at();

-- 3) RPC: track_view
-- Performs best-effort dedupe and atomically increments counters.
-- Supply _referrer_domain as already-parsed hostname; use '(direct)' for none.
CREATE OR REPLACE FUNCTION public.track_view(
  _type TEXT,
  _slug TEXT,
  _referrer_domain TEXT DEFAULT NULL,
  _day DATE DEFAULT CURRENT_DATE,
  _pvid TEXT DEFAULT NULL
)
RETURNS TABLE(total_views BIGINT, total_uniques BIGINT) AS $$
DECLARE
  v_domain TEXT;
  v_unique_inc INT := 0;
  v_key TEXT;
  v_views BIGINT;
  v_uniques BIGINT;
BEGIN
  -- normalize inputs
  v_domain := COALESCE(NULLIF(_referrer_domain, ''), '(direct)');
  _type := LOWER(_type);

  -- best-effort dedupe per day per slug per pseudo-visitor
  IF _pvid IS NOT NULL AND _pvid <> '' THEN
    v_key := 'v1:' || _type || ':' || _slug || ':' || _day::TEXT || ':' || _pvid;
    INSERT INTO public.analytics_dedupe_keys(key, expires_at)
    VALUES (v_key, now() + INTERVAL '2 days')
    ON CONFLICT (key) DO NOTHING;
    IF FOUND THEN
      v_unique_inc := 1;
    END IF;
  END IF;

  -- increment view counters (atomic via upsert)
  INSERT INTO public.analytics_view_counts(type, slug, day, views, uniques)
  VALUES (_type, _slug, _day, 1, v_unique_inc)
  ON CONFLICT (type, slug, day)
  DO UPDATE SET
    views = public.analytics_view_counts.views + 1,
    uniques = public.analytics_view_counts.uniques + EXCLUDED.uniques,
    updated_at = now()
  RETURNING views, uniques INTO v_views, v_uniques;

  -- increment referrer domain counters
  INSERT INTO public.analytics_referrer_counts(type, slug, referrer_domain, day, views)
  VALUES (_type, _slug, v_domain, _day, 1)
  ON CONFLICT (type, slug, referrer_domain, day)
  DO UPDATE SET
    views = public.analytics_referrer_counts.views + 1,
    updated_at = now();

  RETURN QUERY SELECT v_views, v_uniques;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4) RLS: keep tables protected; allow RPC to perform inserts under definer
ALTER TABLE public.analytics_view_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_referrer_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_dedupe_keys ENABLE ROW LEVEL SECURITY;

-- Basic read-only policy for analytics to everyone (adjust as needed)
DROP POLICY IF EXISTS analytics_view_counts_select ON public.analytics_view_counts;
CREATE POLICY analytics_view_counts_select ON public.analytics_view_counts
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS analytics_referrer_counts_select ON public.analytics_referrer_counts;
CREATE POLICY analytics_referrer_counts_select ON public.analytics_referrer_counts
  FOR SELECT TO anon, authenticated USING (true);

-- No direct insert/update needed; RPC runs with definer rights.

-- Allow anon/authenticated to execute the RPC
REVOKE ALL ON FUNCTION public.track_view(TEXT, TEXT, TEXT, DATE, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_view(TEXT, TEXT, TEXT, DATE, TEXT) TO anon, authenticated;

-- Optional: housekeeping function to purge expired dedupe keys
CREATE OR REPLACE FUNCTION public.purge_expired_analytics_keys()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.analytics_dedupe_keys WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.purge_expired_analytics_keys() TO anon, authenticated;

