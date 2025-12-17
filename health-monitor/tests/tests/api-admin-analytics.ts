import type { HealthTest, TestResult } from '../types';
import { getBaseUrl, fetchJson } from '../util';

export const apiAdminAnalytics: HealthTest = {
  id: 'api-admin-analytics',
  name: 'API /admin/analytics basic query',
  category: 'api',
  async run(ctx): Promise<TestResult> {
    const url = `${getBaseUrl()}/api/admin/analytics`;
    const today = new Date();
    const day = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())).toISOString().slice(0, 10);
    const body = { type: 'page', start: day, end: day, limit: 5 };
    const { res, data } = await fetchJson(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }, ctx?.log);
    const ok = res.status === 200 || res.status === 400; // 400 indicates validation failure; route alive
    return { id: this.id, name: this.name, status: ok ? 'pass' : 'fail', summary: `status ${res.status}`, details: { url, status: res.status, body: data } };
  },
};
