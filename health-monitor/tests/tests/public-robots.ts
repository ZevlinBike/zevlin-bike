import type { HealthTest, TestResult } from '../types';
import { getBaseUrl, fetchJson } from '../util';

export const publicRobots: HealthTest = {
  id: 'public-robots',
  name: 'Public text: robots.txt',
  category: 'content',
  async run(ctx): Promise<TestResult> {
    const url = `${getBaseUrl()}/robots.txt`;
    const { res } = await fetchJson(url, { method: 'GET' }, ctx?.log);
    const ok = res.status === 200 || res.status === 404; // optional
    return { id: this.id, name: this.name, status: ok ? 'pass' : 'fail', summary: `status ${res.status}`, details: { url, status: res.status } };
  },
};
