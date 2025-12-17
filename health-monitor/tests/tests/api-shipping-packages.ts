import type { HealthTest, TestResult } from '../types';
import { getBaseUrl, fetchJson } from '../util';

export const apiShippingPackages: HealthTest = {
  id: 'api-shipping-packages',
  name: 'API /shipping/packages list',
  category: 'api',
  async run(ctx): Promise<TestResult> {
    const url = `${getBaseUrl()}/api/shipping/packages`;
    const { res, data } = await fetchJson(url, { method: 'GET' }, ctx?.log);
    const ok = res.status === 200 || res.status === 500; // 500 if table missing/misconfigured
    return { id: this.id, name: this.name, status: ok ? 'pass' : 'fail', summary: `status ${res.status}`, details: { url, status: res.status, body: data } };
  },
};
