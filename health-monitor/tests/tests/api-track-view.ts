import type { HealthTest, TestResult } from '../types';
import { getBaseUrl, fetchJson } from '../util';

export const apiTrackView: HealthTest = {
  id: 'api-track-view',
  name: 'API /track-view rejects invalid',
  category: 'api',
  async run(ctx): Promise<TestResult> {
    const url = `${getBaseUrl()}/api/track-view`;
    const body = { type: 'invalid', slug: '' }; // invalid to avoid writes
    const { res, data } = await fetchJson(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }, ctx?.log);
    const ok = res.status === 400; // invalid request should be 400
    return { id: this.id, name: this.name, status: ok ? 'pass' : 'fail', summary: `status ${res.status}`, details: { url, status: res.status, body: data } };
  },
};
