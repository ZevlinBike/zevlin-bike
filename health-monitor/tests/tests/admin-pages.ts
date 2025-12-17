import type { HealthTest, TestResult } from '../types';
import { getBaseUrl, fetchJson } from '../util';

function createAdminPageTest(path: string, display: string): HealthTest {
  const idSafe = path.replace(/\W+/g, '-').replace(/^-+|-+$/g, '');
  return {
    id: `admin-page-${idSafe || 'root'}`,
    name: `Admin page: ${display} (${path})`,
    category: 'admin',
    async run(ctx): Promise<TestResult> {
      const url = `${getBaseUrl()}${path}`;
      const { res, data } = await fetchJson(url, { method: 'GET', headers: { accept: 'text/html' } }, ctx?.log);
      // Treat as OK if page loads (200/204) or redirects (res.redirected true or 3xx). Redirects to login/home are fine without session.
      const okStatuses = new Set([200, 204, 301, 302, 303, 307, 308]);
      const ok = okStatuses.has(res.status) || (res as any).redirected === true;
      return {
        id: this.id,
        name: this.name,
        status: ok ? 'pass' : 'fail',
        summary: `status ${res.status}${(res as any).redirected ? ' (redirected)' : ''}`,
        details: { url, status: res.status, redirected: (res as any).redirected || false, finalUrl: (res as any).url || undefined, body: data },
      };
    },
  };
}

export const adminPageTests: HealthTest[] = [
  createAdminPageTest('/admin', 'Dashboard'),
  createAdminPageTest('/admin/orders', 'Orders'),
  createAdminPageTest('/admin/fulfillment', 'Fulfillment'),
  createAdminPageTest('/admin/refunds', 'Refunds'),
  createAdminPageTest('/admin/invoices', 'Invoices'),
  createAdminPageTest('/admin/activity', 'Activity'),
  createAdminPageTest('/admin/customers', 'Customers'),
  createAdminPageTest('/admin/newsletter', 'Newsletter'),
  createAdminPageTest('/admin/products', 'Products'),
  createAdminPageTest('/admin/categories', 'Categories'),
  createAdminPageTest('/admin/discounts', 'Discounts'),
  createAdminPageTest('/admin/analytics', 'Analytics'),
  createAdminPageTest('/admin/blog', 'Blog'),
  createAdminPageTest('/admin/announcements', 'Announcements'),
  createAdminPageTest('/admin/functions', 'Functions'),
  createAdminPageTest('/admin/testing', 'Testing'),
  createAdminPageTest('/admin/settings', 'Settings'),
  createAdminPageTest('/admin/health', 'Health'),
];

