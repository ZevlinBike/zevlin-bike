import type { HealthTest, TestContext, TestResult } from './types';

export type RunOptions = TestContext & {
  filterIds?: string[];
};

export async function runTests(tests: HealthTest[], opts?: RunOptions): Promise<{ results: (TestResult & { category?: string })[]; summary: { total: number; pass: number; fail: number; warn: number; skipped: number; durationMs: number } }>
{
  const selected = opts?.filterIds?.length ? tests.filter(t => opts!.filterIds!.includes(t.id)) : tests;
  const start = Date.now();
  const results: (TestResult & { category?: string })[] = [];
  for (const t of selected) {
    const t0 = Date.now();
    const logs: string[] = [];
    const logger = (msg: string) => logs.push(`[${new Date().toISOString()}] ${msg}`);
    try {
      const r = await t.run({ bypassPayment: opts?.bypassPayment ?? true, allowNetwork: opts?.allowNetwork ?? false, log: opts?.log ?? logger });
      results.push({ ...r, durationMs: r.durationMs ?? (Date.now() - t0), category: t.category, logs: r.logs ?? logs });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      logs.push(`[ERROR] ${msg}`);
      const isNetworkish = /fetch failed|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|NetworkError/i.test(msg);
      const status = isNetworkish ? 'warn' : 'fail';
      const summary = isNetworkish ? 'Network fetch failed (set APP_URL or run in env with network access)' : 'Uncaught error';
      results.push({ id: t.id, name: t.name, status, durationMs: Date.now() - t0, summary, errors: [msg], category: t.category, logs });
    }
  }
  const durationMs = Date.now() - start;
  const summary = results.reduce((acc, r) => {
    acc.total += 1;
    acc[r.status] += 1 as any;
    return acc;
  }, { total: 0, pass: 0, fail: 0, warn: 0, skipped: 0, durationMs } as any);
  summary.durationMs = durationMs;
  return { results, summary };
}
