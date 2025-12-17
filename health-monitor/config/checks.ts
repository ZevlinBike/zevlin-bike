// Health Monitor — check types and example configuration

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'skipped';

export type CheckCategory =
  | 'env'
  | 'db'
  | 'catalog'
  | 'checkout'
  | 'payments'
  | 'shipping'
  | 'refunds'
  | 'content'
  | 'notifications'
  | 'admin'
  | 'api';

export type CheckResult = {
  key: string;
  category: CheckCategory;
  status: CheckStatus;
  title: string;
  summary?: string;
  durationMs?: number;
  meta?: Record<string, unknown>;
  remediateUrl?: string;
};

export type CheckDefinition = {
  key: string;
  category: CheckCategory;
  title: string;
  // optional guard to skip in certain envs
  when?: (env: NodeJS.ProcessEnv) => boolean;
  // the check executor (server-side)
  run: () => Promise<CheckResult> | CheckResult;
};

export type HealthConfig = {
  env: 'development' | 'test' | 'production';
  // global timeout per check (ms)
  timeoutMs?: number;
  // disable external network calls unless explicitly allowed
  allowNetwork?: boolean;
  // list of included categories; omitted means all
  include?: CheckCategory[];
  // list of excluded categories
  exclude?: CheckCategory[];
};

export const defaultConfig: HealthConfig = {
  env: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
  timeoutMs: 10_000,
  allowNetwork: false, // enable explicitly for Stripe/Shippo live checks
  include: undefined,
  exclude: [],
};
