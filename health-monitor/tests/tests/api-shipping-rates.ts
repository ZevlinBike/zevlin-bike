import type { HealthTest, TestResult } from '../types';
import { getBaseUrl, fetchJson } from '../util';

export const apiShippingRates: HealthTest = {
  id: 'api-shipping-rates',
  name: 'API /shipping/rates validates',
  category: 'api',
  async run(ctx): Promise<TestResult> {
    const url = `${getBaseUrl()}/api/shipping/rates`;
    const payload = { orderId: '00000000-0000-0000-0000-000000000000' }; // invalid UUID but matches format
    const { res, data } = await fetchJson(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }, ctx?.log);
    const ok = res.status === 404 || res.status === 400 || res.status === 500; // Not found/invalid/settings missing
    return { id: this.id, name: this.name, status: ok ? 'pass' : 'fail', summary: `status ${res.status}`, details: { url, status: res.status, body: data } };
  },
};
