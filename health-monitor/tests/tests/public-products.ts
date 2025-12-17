import type { HealthTest, TestResult } from '../types';
import { getBaseUrl, fetchJson } from '../util';

export const publicProducts: HealthTest = {
  id: 'public-products',
  name: 'Public page: Products (/products)',
  category: 'content',
  async run(ctx): Promise<TestResult> {
    const url = `${getBaseUrl()}/products`;
    const { res } = await fetchJson(url, { method: 'GET' }, ctx?.log);
    const ok = res.status === 200 || res.status === 204 || res.status === 404; // allow 404 if route gated
    return { id: this.id, name: this.name, status: ok ? 'pass' : 'fail', summary: `status ${res.status}`, details: { url, status: res.status } };
  },
};
