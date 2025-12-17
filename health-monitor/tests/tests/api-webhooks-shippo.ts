import type { HealthTest, TestResult } from '../types';
import { getBaseUrl, fetchJson } from '../util';

export const apiWebhooksShippo: HealthTest = {
  id: 'api-webhooks-shippo',
  name: 'API /webhooks/shippo unauthorized without secret',
  category: 'api',
  async run(ctx): Promise<TestResult> {
    const url = `${getBaseUrl()}/api/webhooks/shippo`;
    const { res, data } = await fetchJson(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) }, ctx?.log);
    const ok = res.status === 401 || res.status === 400; // unauthorized or invalid JSON depending
    return { id: this.id, name: this.name, status: ok ? 'pass' : 'fail', summary: `status ${res.status}`, details: { url, status: res.status, body: data } };
  },
};
