import type { HealthTest } from './types';
import { checkoutE2E } from './tests/checkout-e2e';
import { apiAdminRecentOrders } from './tests/api-admin-recent-orders';
import { apiAdminActivity } from './tests/api-admin-activity';
import { apiAdminSearch } from './tests/api-admin-search';
import { apiAdminAnalytics } from './tests/api-admin-analytics';
import { apiShippingValidateAddress } from './tests/api-shipping-validate-address';
import { apiShippingRates } from './tests/api-shipping-rates';
import { apiShippingLabels } from './tests/api-shipping-labels';
import { apiShippingLabelProxy } from './tests/api-shipping-label-proxy';
import { apiShippingPackages } from './tests/api-shipping-packages';
import { apiWebhooksStripe } from './tests/api-webhooks-stripe';
import { apiWebhooksShippo } from './tests/api-webhooks-shippo';
import { apiTrackView } from './tests/api-track-view';
import { publicHome } from './tests/public-home';
import { publicBlog } from './tests/public-blog';
import { publicProducts } from './tests/public-products';
import { publicSitemap } from './tests/public-sitemap';
import { publicRss } from './tests/public-rss';
import { publicFavicon } from './tests/public-favicon';
import { publicRobots } from './tests/public-robots';
import { adminPageTests } from './tests/admin-pages';

export const testRegistry: HealthTest[] = [
  // E2E (safe, payment bypass)
  checkoutE2E,
  // API smoke tests (no writes)
  apiAdminRecentOrders,
  apiAdminActivity,
  apiAdminSearch,
  apiAdminAnalytics,
  apiShippingValidateAddress,
  apiShippingRates,
  apiShippingLabels,
  apiShippingLabelProxy,
  apiShippingPackages,
  apiWebhooksStripe,
  apiWebhooksShippo,
  apiTrackView,
  // Public pages and assets (read-only, client-side compatible)
  publicHome,
  publicBlog,
  publicProducts,
  publicSitemap,
  publicRss,
  publicFavicon,
  publicRobots,
  // Admin pages (read-only; expect redirect or 200)
  ...adminPageTests,
];

export default testRegistry;
