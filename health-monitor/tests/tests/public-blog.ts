import type { HealthTest, TestResult } from '../types';
import { getBaseUrl, fetchJson } from '../util';

export const publicBlog: HealthTest = {
  id: 'public-blog',
  name: 'Public page: Blog (/blog)',
  category: 'content',
  async run(ctx): Promise<TestResult> {
    const url = `${getBaseUrl()}/blog`;
    const { res } = await fetchJson(url, { method: 'GET' }, ctx?.log);
    const ok = res.status === 200 || res.status === 204 || res.status === 404; // allow 404 if blog disabled
    return { id: this.id, name: this.name, status: ok ? 'pass' : 'fail', summary: `status ${res.status}`, details: { url, status: res.status } };
  },
};
