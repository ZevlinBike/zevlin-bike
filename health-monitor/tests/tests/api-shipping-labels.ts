import type { HealthTest, TestResult } from '../types';
import { getBaseUrl, fetchJson } from '../util';

export const apiShippingLabels: HealthTest = {
  id: 'api-shipping-labels',
  name: 'API /shipping/labels requires auth',
  category: 'api',
  async run(ctx): Promise<TestResult> {
    const url = `${getBaseUrl()}/api/shipping/labels`;
    const payload = { orderId: '00000000-0000-0000-0000-000000000000', rateObjectId: 'rate_abc' };
    const { res, data } = await fetchJson(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }, ctx?.log);
    const ok = res.status === 401; // should be unauthorized without admin session
    return { id: this.id, name: this.name, status: ok ? 'pass' : 'fail', summary: `status ${res.status}`, details: { url, status: res.status, body: data } };
  },
};
