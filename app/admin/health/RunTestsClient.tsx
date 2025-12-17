"use client";

import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { HealthCard } from '@/health-monitor/components/HealthCard';
import type { CheckResult } from '@/health-monitor/config/checks';
import type { CheckCategory, CheckStatus } from '@/health-monitor/config/checks';
import type { TestResult } from '@/health-monitor/tests/types';
import { runHealthTests } from './actions';
import { Loader2, Play, Network } from 'lucide-react';

type Grouped<T> = Record<string, T[]>;

function groupBy<T extends { category: string }>(items: T[]): Grouped<T> {
  return items.reduce((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {} as Grouped<T>);
}

type ResultWithCategory = TestResult & { category?: string; details?: (Record<string, unknown> & { __category?: string }) };

function toCheckResult(r: ResultWithCategory, category: CheckCategory): CheckResult {
  const status = r.status as CheckStatus;
  return {
    key: r.id,
    category,
    status,
    title: r.name,
    summary: r.summary,
    durationMs: r.durationMs,
    meta: r.details,
  };
}

export default function RunTestsClient() {
  const [bypassPayment, setBypassPayment] = useState(true);
  const [allowNetwork, setAllowNetwork] = useState(false);
  const [catApi, setCatApi] = useState(true);
  const [catContent, setCatContent] = useState(true);
  const [catCheckout, setCatCheckout] = useState(true);
  const [catAdmin, setCatAdmin] = useState(true);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ResultWithCategory[] | null>(null);
  const [summary, setSummary] = useState<{ total: number; pass: number; fail: number; warn: number; skipped: number; durationMs: number } | null>(null);

  const run = useCallback(async () => {
    setRunning(true);
    try {
      const cats: string[] = [];
      if (catApi) cats.push('api');
      if (catContent) cats.push('content');
      if (catCheckout) cats.push('checkout');
      if (catAdmin) cats.push('admin');
      const { results, summary } = await runHealthTests({ bypassPayment, allowNetwork, filterCategories: cats.length ? cats : undefined });
      setResults(results);
      setSummary(summary);
    } finally {
      setRunning(false);
    }
  }, [bypassPayment, allowNetwork, catApi, catContent, catCheckout, catAdmin]);

  const groups = useMemo(() => {
    if (!results) return null;
    // Need categories from the server? The TestResult doesn’t include category; adjust to include via details
    // For now, infer from details.category if provided, else bucket into 'misc'. The test runner attaches none,
    // so we patch by carrying on TestResult in results array with optional (details.__category).
    // We’ll assume the server action will preserve category inside result.details.__category if set.
    // For checkout-e2e, we know category = 'checkout'.
    const enriched = results.map((r) => ({ ...r, category: r.category || r.details?.__category || (r.id.includes('checkout') ? 'checkout' : 'api') }));
    const grouped = groupBy(enriched as Array<ResultWithCategory & { category: string }>);
    const mapped: Record<CheckCategory, CheckResult[]> = {} as Record<CheckCategory, CheckResult[]>;
    for (const [cat, arr] of Object.entries(grouped)) {
      const catKey = cat as CheckCategory;
      mapped[catKey] = (arr as ResultWithCategory[]).map((r) => toCheckResult(r, catKey));
    }
    return mapped;
  }, [results]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Play className="h-5 w-5" /> Run Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={bypassPayment} onChange={(e) => setBypassPayment(e.target.checked)} />
              Bypass payment (recommended)
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={allowNetwork} onChange={(e) => setAllowNetwork(e.target.checked)} />
              <Network className="h-4 w-4" /> Allow external network (Shippo test)
            </label>
            <Separator orientation="vertical" className="h-6 hidden md:block" />
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={catApi} onChange={(e) => setCatApi(e.target.checked)} /> API routes</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={catContent} onChange={(e) => setCatContent(e.target.checked)} /> Content pages</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={catCheckout} onChange={(e) => setCatCheckout(e.target.checked)} /> Checkout E2E</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={catAdmin} onChange={(e) => setCatAdmin(e.target.checked)} /> Admin pages</label>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Button onClick={run} disabled={running}>
                {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />} Run All
              </Button>
            </div>
          </div>

          {summary && (
            <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 flex flex-wrap items-center gap-3">
              <span>Total: <strong className="tabular-nums">{summary.total}</strong></span>
              <Separator orientation="vertical" className="h-4" />
              <span>Pass: <strong className="tabular-nums">{summary.pass}</strong></span>
              <Separator orientation="vertical" className="h-4" />
              <span>Warn: <strong className="tabular-nums">{summary.warn}</strong></span>
              <Separator orientation="vertical" className="h-4" />
              <span>Fail: <strong className="tabular-nums">{summary.fail}</strong></span>
              <Separator orientation="vertical" className="h-4" />
              <span>Skipped: <strong className="tabular-nums">{summary.skipped}</strong></span>
              <Separator orientation="vertical" className="h-4" />
              <span>Duration: <strong className="tabular-nums">{summary.durationMs}ms</strong></span>
            </div>
          )}
        </CardContent>
      </Card>

      {groups ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(groups).map(([cat, items]) => (
            <HealthCard key={cat} title={cat} items={items} />
          ))}
        </div>
      ) : (
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          No results yet. Click Run All to execute tests.
        </div>
      )}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((r) => (
                <div key={r.id} className="rounded-md border p-3">
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-neutral-500">{r.id} • {r.status.toUpperCase()} • {typeof r.durationMs === 'number' ? `${r.durationMs}ms` : ''}</div>
                  {r.summary && <div className="mt-1 text-sm">{r.summary}</div>}
                  {(r.errors && r.errors.length > 0) && (
                    <div className="mt-2 text-sm text-rose-600 dark:text-rose-400">
                      Errors: {r.errors.join(' | ')}
                    </div>
                  )}
                  {r.logs && r.logs.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm">Logs</summary>
                      <pre className="mt-2 whitespace-pre-wrap text-xs bg-neutral-50 dark:bg-neutral-900 p-2 rounded-md overflow-auto max-h-64">{r.logs.join('\n')}</pre>
                    </details>
                  )}
                  {r.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm">Details</summary>
                      <pre className="mt-2 whitespace-pre-wrap text-xs bg-neutral-50 dark:bg-neutral-900 p-2 rounded-md overflow-auto max-h-64">{JSON.stringify(r.details, null, 2)}</pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
