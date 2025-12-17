import type { HealthTest, TestResult } from '../types';
import { getBaseUrl, fetchJson } from '../util';

export const apiShippingLabelProxy: HealthTest = {
  id: 'api-shipping-label-proxy',
  name: 'API /shipping/label-proxy data URL',
  category: 'api',
  async run(ctx): Promise<TestResult> {
    const base = getBaseUrl();
    const dataUrl = 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwKL0xlbmd0aCAxIDAgUgo+PgplbmRvYmoKc3RhcnR4cmVmCjAKJSVFT0YK';
    const url = `${base}/api/shipping/label-proxy?url=${encodeURIComponent(dataUrl)}`;
    const { res } = await fetchJson(url, { method: 'GET' }, ctx?.log);
    const ok = res.status === 200 && (res.headers.get('content-type') || '').includes('application/pdf');
    return { id: this.id, name: this.name, status: ok ? 'pass' : 'fail', summary: `status ${res.status}`, details: { url, status: res.status } };
  },
};
