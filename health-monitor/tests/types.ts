export type TestStatus = 'pass' | 'fail' | 'warn' | 'skipped';

export type TestContext = {
  // default: true = bypass payment; if false, use Stripe test key
  bypassPayment?: boolean;
  // when using external APIs (Stripe/Shippo), restrict to test keys only
  allowNetwork?: boolean;
  // capture minimal logs for UI
  log?: (msg: string) => void;
};

export type TestResult = {
  id: string;
  name: string;
  status: TestStatus;
  durationMs?: number;
  summary?: string;
  details?: Record<string, unknown>;
  errors?: string[];
  logs?: string[];
};

export type HealthTest = {
  id: string;
  name: string;
  category: 'checkout' | 'catalog' | 'shipping' | 'payments' | 'env' | 'db' | 'admin' | 'content' | 'refunds' | 'notifications' | 'api';
  run(ctx?: TestContext): Promise<TestResult>;
};
