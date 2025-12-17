import type { HealthTest, TestResult } from '../types';
import { getBaseUrl, fetchJson } from '../util';

export const apiWebhooksStripe: HealthTest = {
  id: 'api-webhooks-stripe',
  name: 'API /webhooks/stripe rejects invalid',
  category: 'api',
  async run(ctx): Promise<TestResult> {
    const url = `${getBaseUrl()}/api/webhooks/stripe`;
    const { res, data } = await fetchJson(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) }, ctx?.log);
    const ok = res.status === 400 || res.status === 501; // 501 if secret missing; 400 invalid signature
    return { id: this.id, name: this.name, status: ok ? 'pass' : 'fail', summary: `status ${res.status}`, details: { url, status: res.status, body: data } };
  },
};
