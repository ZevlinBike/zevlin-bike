import type { HealthTest, TestResult } from '../types';
import { getBaseUrl, fetchJson } from '../util';

export const publicSitemap: HealthTest = {
  id: 'public-sitemap',
  name: 'Public XML: Sitemap (/sitemap.xml)',
  category: 'content',
  async run(ctx): Promise<TestResult> {
    const url = `${getBaseUrl()}/sitemap.xml`;
    const { res } = await fetchJson(url, { method: 'GET', headers: { accept: 'application/xml,text/xml' } }, ctx?.log);
    const ok = res.status === 200 || res.status === 404; // pass if generated or not present
    const ctype = res.headers.get('content-type') || '';
    return { id: this.id, name: this.name, status: ok ? 'pass' : 'fail', summary: `status ${res.status}`, details: { url, status: res.status, contentType: ctype } };
  },
};
