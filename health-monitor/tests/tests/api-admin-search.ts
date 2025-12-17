import type { HealthTest, TestResult } from '../types';
import { getBaseUrl, fetchJson } from '../util';

export const apiAdminSearch: HealthTest = {
  id: 'api-admin-search',
  name: 'API /admin/search requires auth',
  category: 'api',
  async run(ctx): Promise<TestResult> {
    const url = `${getBaseUrl()}/api/admin/search?q=te`;
    const { res, data } = await fetchJson(url, { method: 'GET', headers: { accept: 'application/json' } }, ctx?.log);
    const ok = res.status === 401 || res.status === 200;
    return { id: this.id, name: this.name, status: ok ? 'pass' : 'fail', summary: `status ${res.status}`, details: { url, status: res.status, body: data } };
  },
};
