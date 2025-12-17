import type { HealthTest, TestResult } from '../types';
import { getBaseUrl, fetchJson } from '../util';

export const publicFavicon: HealthTest = {
  id: 'public-favicon',
  name: 'Public asset: Favicon (/favicon.ico)',
  category: 'content',
  async run(ctx): Promise<TestResult> {
    const url = `${getBaseUrl()}/favicon.ico`;
    const { res } = await fetchJson(url, { method: 'GET' }, ctx?.log);
    const ok = res.status === 200;
    return { id: this.id, name: this.name, status: ok ? 'pass' : 'fail', summary: `status ${res.status}`, details: { url, status: res.status } };
  },
};
