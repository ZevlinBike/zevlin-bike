"use server";

import { runTests } from '@/health-monitor/tests/runner';
import testRegistry from '@/health-monitor/tests/registry';

export async function runHealthTests(options?: { bypassPayment?: boolean; allowNetwork?: boolean; filterIds?: string[]; filterCategories?: string[] }) {
  const filtered = options?.filterCategories?.length
    ? testRegistry.filter((t) => options!.filterCategories!.includes(t.category))
    : testRegistry;
  const { results, summary } = await runTests(filtered, {
    bypassPayment: options?.bypassPayment ?? true,
    allowNetwork: options?.allowNetwork ?? false,
    filterIds: options?.filterIds,
  });
  return { results, summary };
}
