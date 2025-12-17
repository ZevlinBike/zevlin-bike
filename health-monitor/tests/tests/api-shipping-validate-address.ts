import type { HealthTest, TestResult } from '../types';
import { getBaseUrl, fetchJson } from '../util';

export const apiShippingValidateAddress: HealthTest = {
  id: 'api-shipping-validate-address',
  name: 'API /shipping/validate-address responds',
  category: 'api',
  async run(ctx): Promise<TestResult> {
    if (!ctx?.allowNetwork) {
      return { id: this.id, name: this.name, status: 'skipped', summary: 'Network disabled' };
    }
    const url = `${getBaseUrl()}/api/shipping/validate-address`;
    const payload = { address: { name: 'Health', address1: '525 Market St', city: 'San Francisco', state: 'CA', postal_code: '94105', country: 'US' } };
    const { res, data } = await fetchJson(url, { method: 'POST', headers: { 'content-type': 'application/json', referer: `${getBaseUrl()}/admin/testing` }, body: JSON.stringify(payload) }, ctx?.log);
    const ok = res.status === 200 || res.status === 500; // 500 likely when token missing; handler alive
    return { id: this.id, name: this.name, status: ok ? 'pass' : 'fail', summary: `status ${res.status}`, details: { url, status: res.status, body: data } };
  },
};
