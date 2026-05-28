# Product Importer Architecture

## Backend modules

- `ProductImporterService`: validates URLs, detects stores, handles cache, fetch retries, parser selection and partial results.
- `StoreDetector`: maps domains to `compatibleStores` and detects Shopify, WooCommerce, Magento, Prestashop, Next.js, React SPA, Vue SPA, JSON-LD and OpenGraph signals.
- `ParserFactory`: chooses the strongest parser from configured store metadata and platform detection.
- `GenericParser`: fallback parser with JSON-LD, OpenGraph, meta tags, store selectors and generic DOM extraction.
- `ShopifyParser`, `WooCommerceParser`, `MagentoParser`, `PrestashopParser`: store-engine parsers that currently extend `GenericParser` and are ready for engine-specific extraction.
- `DynamicSiteParser`: returns partial results and warnings when a site likely needs Playwright rendering.
- `AntiBotHandler`: rotates browser-like user agents, retries blocked statuses and marks anti-bot cases.
- `ImageValidator`: normalizes and deduplicates image URLs.
- `UrlValidator`: blocks internal/private hosts and non-http protocols.
- `ImportCacheService`: in-memory cache now, replace with Redis or the `import_cache` MySQL table in production.
- `ImportQueueService`: placeholder contract for BullMQ workers.

## Automatic detection

- Shopify: `Shopify.theme`, `/cdn/shop/`, `myshopify.com`, `/cart.js`.
- WooCommerce: `woocommerce`, `wp-content/plugins/woocommerce`, `wc-ajax`.
- Magento: `Magento`, `mage/`, `static/version.../frontend`.
- Prestashop: `prestashop`, `PrestaShop`, `/modules/ps_`, `id_product`.
- Next.js commerce: `#__NEXT_DATA__`, `/_next/static/`.
- React SPA: `#root`, `data-reactroot`, React global hook.
- Vue SPA: `#__nuxt`, `window.__NUXT__`, `data-v-`.
- JSON-LD Product: `<script type="application/ld+json">` with `@type: Product`.
- OpenGraph product tags: `og:title`, `og:image`, `product:price:amount`, `product:price:currency`.

## Fallback order

1. JSON-LD Product schema
2. OpenGraph tags
3. Meta product tags
4. Store-specific DOM selectors
5. Generic DOM parser
6. Dynamic parser with Playwright worker
7. Manual admin completion

## Production strategy

- Cache: Redis for hot imports, MySQL `import_cache` for persistence.
- Queue: BullMQ job per URL, idempotent by SHA-256 URL hash.
- Retry: exponential backoff, max 3 quick attempts in API, deeper retries in worker.
- Timeouts: 15s API fetch, 30-45s Playwright worker fetch.
- Rate limiting: per domain and per admin user.
- User agents: rotate browser profiles, keep language `fr-FR` for Tunisian stores.
- Proxy: optional per-store for hard anti-bot marketplaces.
- URL validation: block private IPs, localhost, non-http protocols and oversized URLs.
- Image validation: normalize absolute URLs and verify MIME/size in worker before saving.
- Sanitization: strip scripts/styles from descriptions before storing.
- Anti-duplication: unique source URL hash plus title/price/store similarity check.
- Logging: persist `product_import_logs` on every attempt, even partial imports.
- Fallback parsing: always return a partial result when a title can be inferred.

## API endpoints

- `GET /api/admin/stores`
- `POST /api/admin/stores`
- `PATCH /api/admin/stores/:id`
- `DELETE /api/admin/stores/:id`
- `POST /api/admin/import-product`
- `POST /api/admin/test-store-url`
- `GET /api/admin/import-logs`

The current implementation uses Next.js route handlers because the CreadiTN dashboard is a Next app. The route contracts match the requested Express endpoints and can be moved to a standalone Express router without changing the React client.
