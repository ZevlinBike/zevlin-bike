import type { HealthTest, TestResult } from '../types';
import { getBaseUrl, fetchJson } from '../util';

export const publicRss: HealthTest = {
  id: 'public-rss',
  name: 'Public XML: RSS (/rss.xml)',
  category: 'content',
  async run(ctx): Promise<TestResult> {
    const url = `${getBaseUrl()}/rss.xml`;
    const { res } = await fetchJson(url, { method: 'GET', headers: { accept: 'application/xml,text/xml' } }, ctx?.log);
    const ok = res.status === 200 || res.status === 404;
    const ctype = res.headers.get('content-type') || '';
    return { id: this.id, name: this.name, status: ok ? 'pass' : 'fail', summary: `status ${res.status}`, details: { url, status: res.status, contentType: ctype } };
  },
};
