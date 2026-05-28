import { compatibleStores } from './compatible-stores';
import type { CompatibleStore, ParserType, ProductImportResult, StoreSelectors } from './types';

type ImportProduct = ProductImportResult['product'];
type ParserWarnings = ProductImportResult['parser']['warnings'];
type PlatformType =
  | 'shopify'
  | 'woocommerce'
  | 'magento'
  | 'prestashop'
  | 'nextjs'
  | 'react-spa'
  | 'vue-spa'
  | 'json-ld'
  | 'opengraph'
  | 'unknown';

const MAX_HTML_BYTES = 2_000_000;
const REQUEST_TIMEOUT_MS = 15_000;

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
];

function emptyProduct(): ImportProduct {
  return {
    title: '',
    price: 0,
    currency: 'TND',
    oldPrice: null,
    brand: '',
    category: '',
    description: '',
    stock: '',
    availability: '',
    mainImage: '',
    gallery: [],
  };
}

function defaultResult(sourceUrl: string, store?: CompatibleStore): ProductImportResult {
  return {
    success: false,
    sourceUrl,
    store: {
      name: store?.name ?? '',
      domain: store?.domain ?? '',
      country: store?.country ?? '',
      category: store?.category ?? '',
    },
    product: emptyProduct(),
    parser: {
      type: store?.parserType ?? 'ManualFallback',
      method: 'manual-admin-completion',
      confidence: 0,
      warnings: [],
    },
    metadata: {
      importedAt: new Date().toISOString(),
      cacheHit: false,
      responseTimeMs: 0,
    },
  };
}

function cleanText(value: string | null | undefined, max = 2000): string {
  if (!value) return '';
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function parsePrice(raw: string | null | undefined): number {
  if (!raw) return 0;
  const cleaned = decodeHtml(raw)
    .replace(/[^\d.,]/g, '')
    .trim();
  if (!cleaned) return 0;
  const normalized = /\d{1,3}(\.\d{3})+,\d{1,3}$/.test(cleaned)
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(',', '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

function detectCurrency(raw: string | null | undefined): string {
  const text = (raw ?? '').toUpperCase();
  if (text.includes('TND') || text.includes('DT') || text.includes('د.ت')) return 'TND';
  if (text.includes('EUR') || text.includes('€')) return 'EUR';
  if (text.includes('USD') || text.includes('$')) return 'USD';
  if (text.includes('GBP') || text.includes('£')) return 'GBP';
  if (text.includes('MAD')) return 'MAD';
  if (text.includes('DZD')) return 'DZD';
  return 'TND';
}

function absoluteUrl(value: string, baseUrl: string): string {
  const src = cleanText(value, 1000);
  if (!src || src.startsWith('data:')) return '';
  try {
    return new URL(src, baseUrl).toString();
  } catch {
    return '';
  }
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function metaContent(html: string, ...attrs: string[]): string {
  for (const attr of attrs) {
    const escaped = attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']{1,2000})["']`, 'i');
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']{1,2000})["'][^>]+(?:property|name)=["']${escaped}["']`, 'i');
    const match = re1.exec(html) ?? re2.exec(html);
    if (match?.[1]) return cleanText(match[1], 2000);
  }
  return '';
}

function attrValue(tag: string, attr: string): string {
  const escaped = attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escaped}=["']([^"']+)["']`, 'i').exec(tag);
  return match?.[1] ?? '';
}

function classRegex(className: string): RegExp {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`<([a-z0-9]+)[^>]*class=["'][^"']*${escaped}[^"']*["'][^>]*>([\\s\\S]{0,3000}?)<\\/\\1>`, 'i');
}

function extractBySelector(html: string, selector: string, baseUrl: string): string {
  const trimmed = selector.trim();
  if (trimmed.startsWith('meta[')) {
    const property = /\[(?:property|name)=["']([^"']+)["']\]/i.exec(trimmed)?.[1];
    return property ? metaContent(html, property) : '';
  }
  if (trimmed.startsWith('#')) {
    const id = trimmed.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`<([a-z0-9]+)[^>]*id=["']${id}["'][^>]*>([\\s\\S]{0,3000}?)<\\/\\1>`, 'i').exec(html);
    return cleanText(match?.[2] ?? '', 500);
  }
  if (trimmed.startsWith('.')) {
    const match = classRegex(trimmed.slice(1)).exec(html);
    if (!match?.[0]) return '';
    if (/\bimg\b/i.test(match[0])) return absoluteUrl(attrValue(match[0], 'src') || attrValue(match[0], 'data-src'), baseUrl);
    return cleanText(match[2], 500);
  }
  if (trimmed.includes('[itemprop=')) {
    const prop = /\[itemprop=["']([^"']+)["']\]/i.exec(trimmed)?.[1];
    if (!prop) return '';
    const match = new RegExp(`<([a-z0-9]+)[^>]*itemprop=["']${prop}["'][^>]*>([\\s\\S]{0,3000}?)<\\/\\1>`, 'i').exec(html);
    if (match?.[0] && /\bimg\b/i.test(match[0])) return absoluteUrl(attrValue(match[0], 'src'), baseUrl);
    return cleanText(match?.[2] ?? attrValue(match?.[0] ?? '', 'content'), 500);
  }
  if (/^[a-z0-9]+$/i.test(trimmed)) {
    const match = new RegExp(`<${trimmed}[^>]*>([\\s\\S]{0,3000}?)<\\/${trimmed}>`, 'i').exec(html);
    return cleanText(match?.[1] ?? '', 500);
  }
  return '';
}

function extractGalleryBySelector(html: string, selector: string, baseUrl: string): string[] {
  const images: string[] = [];
  if (selector.includes('img') || selector.includes('image')) {
    const className = /\.([a-zA-Z0-9_-]+)/.exec(selector)?.[1];
    const scopedHtml = className ? classRegex(className).exec(html)?.[0] ?? html : html;
    const imageRegex = /<img[^>]+(?:src|data-src|data-original)=["']([^"']+)["'][^>]*>/gi;
    let match: RegExpExecArray | null;
    while ((match = imageRegex.exec(scopedHtml)) !== null && images.length < 12) {
      const url = absoluteUrl(match[1], baseUrl);
      if (url) images.push(url);
    }
  } else {
    const single = extractBySelector(html, selector, baseUrl);
    if (single) images.push(single);
  }
  return unique(images);
}

function mergeProduct(base: ImportProduct, patch: Partial<ImportProduct>): ImportProduct {
  return {
    ...base,
    ...Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== '' && value !== 0 && value !== null)),
    gallery: unique([...(base.gallery ?? []), ...(patch.gallery ?? [])]).slice(0, 12),
    oldPrice: patch.oldPrice ?? base.oldPrice,
  };
}

function looksUseful(product: ImportProduct): boolean {
  return Boolean(product.title && (product.price || product.mainImage || product.gallery.length > 0));
}

function extractSlugFallback(url: URL, store?: CompatibleStore): Partial<ImportProduct> {
  const segments = url.pathname.split('/').filter(Boolean);
  const rawSlug = (segments[segments.length - 1] ?? '')
    .replace(/\.(html?|php|aspx)$/i, '')
    .replace(/^\d+[-_]/, '')
    .replace(/^\d+-\d+-/, '');
  const title = rawSlug
    .split(/[-_]/)
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(' ');
  return {
    title: title.slice(0, 160),
    brand: store?.name ?? '',
    category: store?.category ?? '',
  };
}

export class UrlValidator {
  static validate(raw: string): URL {
    const value = raw.trim();
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('URL invalide. Utilisez une URL http/https.');
    }
    if (UrlValidator.isBlockedHost(url.hostname)) {
      throw new Error('URL refusee pour proteger le serveur.');
    }
    return url;
  }

  static isBlockedHost(hostname: string): boolean {
    const host = hostname.toLowerCase();
    if (['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(host)) return true;
    return [
      /^10\.\d+\.\d+\.\d+$/,
      /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
      /^192\.168\.\d+\.\d+$/,
      /^169\.254\.\d+\.\d+$/,
      /^fc[0-9a-f]{2}:/i,
    ].some((pattern) => pattern.test(host));
  }
}

export class ImageValidator {
  static normalizeGallery(gallery: string[], baseUrl: string): string[] {
    return unique(gallery.map((item) => absoluteUrl(item, baseUrl))).filter((item) => /^https?:\/\//i.test(item)).slice(0, 12);
  }
}

export class AntiBotHandler {
  static headers(attempt = 0): HeadersInit {
    return {
      'User-Agent': userAgents[attempt % userAgents.length],
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      'Upgrade-Insecure-Requests': '1',
    };
  }

  static isBlockedStatus(status: number): boolean {
    return [401, 403, 407, 408, 429, 503].includes(status);
  }
}

export class StoreDetector {
  static detect(url: URL): CompatibleStore | undefined {
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    return compatibleStores.find((item) => {
      const domain = item.domain.replace(/^www\./, '').toLowerCase();
      return host === domain || host.endsWith(`.${domain}`);
    });
  }

  static detectById(id?: string): CompatibleStore | undefined {
    if (!id) return undefined;
    return compatibleStores.find((item) => item.id === id);
  }

  static detectPlatform(html: string): PlatformType[] {
    const found: PlatformType[] = [];
    if (/<script[^>]+type=["']application\/ld\+json["']/i.test(html)) found.push('json-ld');
    if (/<meta[^>]+property=["']og:/i.test(html)) found.push('opengraph');
    if (/Shopify\.theme|cdn\/shop\/|myshopify\.com|\/cart\.js/i.test(html)) found.push('shopify');
    if (/woocommerce|wp-content\/plugins\/woocommerce|wc-ajax/i.test(html)) found.push('woocommerce');
    if (/Magento_|Magento\\|static\/version\d+\/frontend|requirejs-config[^<]+mage|(?:^|[\s"'/>])\/?mage\//i.test(html)) found.push('magento');
    if (/prestashop|PrestaShop|\/modules\/ps_|id_product/i.test(html)) found.push('prestashop');
    if (/id=["']__NEXT_DATA__["']|\/_next\/static\//i.test(html)) found.push('nextjs');
    if (/id=["']root["']|data-reactroot|__REACT_DEVTOOLS_GLOBAL_HOOK__/i.test(html)) found.push('react-spa');
    if (/id=["']__nuxt["']|window\.__NUXT__|data-v-/i.test(html)) found.push('vue-spa');
    return found.length ? unique(found) as PlatformType[] : ['unknown'];
  }
}

export class ImportCacheService {
  private static cache = new Map<string, { expiresAt: number; value: ProductImportResult }>();

  static get(url: string): ProductImportResult | null {
    const cached = ImportCacheService.cache.get(url);
    if (!cached || cached.expiresAt < Date.now()) return null;
    return {
      ...cached.value,
      metadata: { ...cached.value.metadata, cacheHit: true },
    };
  }

  static set(url: string, value: ProductImportResult, ttlMs = 15 * 60 * 1000): void {
    ImportCacheService.cache.set(url, { value, expiresAt: Date.now() + ttlMs });
  }
}

export class ImportQueueService {
  static enqueue(url: string): { queued: boolean; url: string; backend: string } {
    return {
      queued: true,
      url,
      backend: 'BullMQ recommended for production workers',
    };
  }
}

export class GenericParser {
  constructor(protected parserType: ParserType = 'DomParser') {}

  parse(html: string, sourceUrl: string, store?: CompatibleStore): ProductImportResult {
    const result = defaultResult(sourceUrl, store);
    result.parser.type = this.parserType;
    const warnings: ParserWarnings = [];
    let product = emptyProduct();

    const jsonLd = this.parseJsonLd(html, sourceUrl);
    if (jsonLd.title) {
      product = mergeProduct(product, jsonLd);
      result.parser.method = 'json-ld-product-schema';
      result.parser.confidence = 0.92;
    }

    const openGraph = this.parseOpenGraph(html, sourceUrl);
    product = mergeProduct(product, openGraph);
    if (!result.parser.confidence && openGraph.title) {
      result.parser.method = 'open-graph-tags';
      result.parser.confidence = 0.78;
    }

    const meta = this.parseMetaTags(html);
    product = mergeProduct(product, meta);
    if (!result.parser.confidence && meta.title) {
      result.parser.method = 'meta-product-tags';
      result.parser.confidence = 0.68;
    }

    if (store) {
      const specific = this.parseDomSelectors(html, sourceUrl, store.selectors);
      product = mergeProduct(product, specific);
      if (!result.parser.confidence && specific.title) {
        result.parser.method = 'store-specific-dom-selectors';
        result.parser.confidence = 0.62;
      }
    }

    const generic = this.parseDomSelectors(html, sourceUrl, {
      title: ['h1', '.product-title', '.product_title'],
      price: ['.price', '[itemprop="price"]'],
      image: ['meta[property="og:image"]', '[itemprop="image"]'],
      gallery: ['.product-gallery img', '.product-images img'],
      description: ['meta[name="description"]', '.description', '.product-description'],
      stock: ['.stock', '.availability'],
      category: ['.breadcrumb'],
      brand: ['.brand'],
    });
    product = mergeProduct(product, generic);
    if (!result.parser.confidence && generic.title) {
      result.parser.method = 'generic-dom-parser';
      result.parser.confidence = 0.48;
    }

    product.gallery = ImageValidator.normalizeGallery(unique([product.mainImage, ...product.gallery]), sourceUrl);
    product.mainImage = product.gallery[0] ?? '';
    if (!product.availability && product.stock) product.availability = product.stock;
    if (!product.currency) product.currency = 'TND';

    if (!looksUseful(product)) {
      warnings.push('Extraction partielle uniquement. Completion manuelle admin recommandee.');
      const slug = extractSlugFallback(new URL(sourceUrl), store);
      product = mergeProduct(product, slug);
      result.parser.method = result.parser.method || 'manual-admin-completion';
      result.parser.confidence = Math.max(result.parser.confidence, product.title ? 0.28 : 0);
    }

    result.product = product;
    result.success = Boolean(product.title);
    result.parser.warnings = warnings;
    return result;
  }

  protected parseJsonLd(html: string, sourceUrl: string): Partial<ImportProduct> {
    const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ?? [];
    for (const script of scripts) {
      const raw = script.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '').trim();
      try {
        const parsed = JSON.parse(raw) as unknown;
        const nodes = this.flattenJsonLd(parsed);
        const productNode = nodes.find((node) => String(node['@type'] ?? '').toLowerCase().includes('product'));
        if (!productNode) continue;

        const offers = Array.isArray(productNode.offers) ? productNode.offers[0] : productNode.offers;
        const offer = (offers ?? {}) as Record<string, unknown>;
        const brand = productNode.brand as Record<string, unknown> | string | undefined;
        const images = this.extractJsonLdImages(productNode.image, sourceUrl);
        const priceRaw = String(offer.price ?? productNode.price ?? '');
        return {
          title: cleanText(String(productNode.name ?? ''), 180),
          price: parsePrice(priceRaw),
          currency: String(offer.priceCurrency ?? detectCurrency(priceRaw) ?? 'TND'),
          brand: typeof brand === 'string' ? brand : cleanText(String(brand?.name ?? ''), 100),
          category: cleanText(String(productNode.category ?? ''), 120),
          description: cleanText(String(productNode.description ?? ''), 2500),
          stock: cleanText(String(offer.availability ?? ''), 200),
          availability: cleanText(String(offer.availability ?? ''), 200),
          mainImage: images[0] ?? '',
          gallery: images,
        };
      } catch {
        // Some stores inject invalid JSON-LD. Continue to the next block.
      }
    }
    return {};
  }

  protected parseOpenGraph(html: string, sourceUrl: string): Partial<ImportProduct> {
    const image = absoluteUrl(metaContent(html, 'og:image', 'twitter:image'), sourceUrl);
    const priceRaw = metaContent(html, 'product:price:amount', 'og:price:amount', 'twitter:data1');
    return {
      title: metaContent(html, 'og:title', 'twitter:title'),
      description: metaContent(html, 'og:description', 'twitter:description'),
      price: parsePrice(priceRaw),
      currency: metaContent(html, 'product:price:currency') || detectCurrency(priceRaw),
      brand: metaContent(html, 'product:brand', 'og:brand'),
      category: metaContent(html, 'product:category'),
      mainImage: image,
      gallery: image ? [image] : [],
    };
  }

  protected parseMetaTags(html: string): Partial<ImportProduct> {
    const priceRaw = metaContent(html, 'price', 'product:price', 'twitter:data1');
    return {
      title: metaContent(html, 'title', 'product:title'),
      description: metaContent(html, 'description'),
      price: parsePrice(priceRaw),
      currency: detectCurrency(priceRaw),
      brand: metaContent(html, 'brand'),
      category: metaContent(html, 'category'),
    };
  }

  protected parseDomSelectors(html: string, sourceUrl: string, selectors: StoreSelectors): Partial<ImportProduct> {
    const title = this.firstSelectorValue(html, selectors.title, sourceUrl);
    const priceRaw = this.firstSelectorValue(html, selectors.price, sourceUrl);
    const mainImage = this.firstSelectorValue(html, selectors.image, sourceUrl);
    const gallery = selectors.gallery.flatMap((selector) => extractGalleryBySelector(html, selector, sourceUrl));
    return {
      title,
      price: parsePrice(priceRaw),
      currency: detectCurrency(priceRaw),
      mainImage: absoluteUrl(mainImage, sourceUrl) || mainImage,
      gallery: ImageValidator.normalizeGallery([mainImage, ...gallery], sourceUrl),
      description: this.firstSelectorValue(html, selectors.description, sourceUrl),
      stock: this.firstSelectorValue(html, selectors.stock, sourceUrl),
      category: this.firstSelectorValue(html, selectors.category, sourceUrl),
      brand: this.firstSelectorValue(html, selectors.brand, sourceUrl),
    };
  }

  protected firstSelectorValue(html: string, selectors: string[], sourceUrl: string): string {
    for (const selector of selectors) {
      const value = extractBySelector(html, selector, sourceUrl);
      if (value) return value;
    }
    return '';
  }

  private flattenJsonLd(value: unknown): Record<string, unknown>[] {
    const queue = Array.isArray(value) ? value : [value];
    const output: Record<string, unknown>[] = [];
    for (const item of queue) {
      if (!item || typeof item !== 'object') continue;
      const node = item as Record<string, unknown>;
      output.push(node);
      if (Array.isArray(node['@graph'])) {
        output.push(...this.flattenJsonLd(node['@graph']));
      }
    }
    return output;
  }

  private extractJsonLdImages(value: unknown, sourceUrl: string): string[] {
    const images: string[] = [];
    if (typeof value === 'string') images.push(absoluteUrl(value, sourceUrl));
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') images.push(absoluteUrl(item, sourceUrl));
        if (item && typeof item === 'object') images.push(absoluteUrl(String((item as Record<string, unknown>).url ?? ''), sourceUrl));
      }
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      images.push(absoluteUrl(String((value as Record<string, unknown>).url ?? ''), sourceUrl));
    }
    return unique(images);
  }
}

export class ShopifyParser extends GenericParser {
  constructor() {
    super('ShopifyParser');
  }
}

export class WooCommerceParser extends GenericParser {
  constructor() {
    super('WooCommerceParser');
  }
}

export class MagentoParser extends GenericParser {
  constructor() {
    super('MagentoParser');
  }
}

export class PrestashopParser extends GenericParser {
  constructor() {
    super('PrestashopParser');
  }
}

export class DynamicSiteParser extends GenericParser {
  constructor() {
    super('DynamicSiteParser');
  }

  parse(html: string, sourceUrl: string, store?: CompatibleStore): ProductImportResult {
    const result = super.parse(html, sourceUrl, store);
    if (!result.success) {
      result.parser.warnings.push('Site dynamique ou anti-bot detecte. Brancher Playwright dans un worker BullMQ pour le rendu complet.');
    }
    return result;
  }
}

export class ParserFactory {
  static create(type: ParserType, html?: string): GenericParser {
    const platforms = html ? StoreDetector.detectPlatform(html) : [];
    const detected = platforms.includes('shopify')
      ? 'ShopifyParser'
      : platforms.includes('woocommerce')
        ? 'WooCommerceParser'
        : platforms.includes('magento')
          ? 'MagentoParser'
          : platforms.includes('prestashop')
            ? 'PrestashopParser'
            : type;

    switch (detected) {
      case 'ShopifyParser':
        return new ShopifyParser();
      case 'WooCommerceParser':
        return new WooCommerceParser();
      case 'MagentoParser':
        return new MagentoParser();
      case 'PrestashopParser':
        return new PrestashopParser();
      case 'DynamicSiteParser':
      case 'ReactHydrationParser':
      case 'ApiParser':
        return new DynamicSiteParser();
      default:
        return new GenericParser(detected);
    }
  }
}

export class ProductImporterService {
  static async importFromUrl(rawUrl: string, options: { storeId?: string; useCache?: boolean } = {}): Promise<ProductImportResult> {
    const start = Date.now();
    let sourceUrl = rawUrl;
    let store: CompatibleStore | undefined;

    try {
      const url = UrlValidator.validate(rawUrl);
      sourceUrl = url.toString();
      store = StoreDetector.detectById(options.storeId) ?? StoreDetector.detect(url);

      const cached = options.useCache === false ? null : ImportCacheService.get(sourceUrl);
      if (cached) return cached;

      const html = await ProductImporterService.fetchHtmlWithRetry(url);
      const parser = ParserFactory.create(store?.parserType ?? 'DomParser', html);
      const result = parser.parse(html, sourceUrl, store);
      result.metadata.responseTimeMs = Date.now() - start;
      result.parser.warnings.push(...ProductImporterService.platformWarnings(html));
      ImportCacheService.set(sourceUrl, result);
      return result;
    } catch (error) {
      const result = defaultResult(sourceUrl, store);
      result.metadata.responseTimeMs = Date.now() - start;
      result.product = mergeProduct(result.product, ProductImporterService.safeSlugFallback(sourceUrl, store));
      result.success = Boolean(result.product.title);
      result.parser.confidence = result.success ? 0.22 : 0;
      result.parser.warnings.push(error instanceof Error ? error.message : 'Erreur inconnue pendant l import.');
      result.parser.warnings.push('Resultat partiel retourne pour completion manuelle admin.');
      return result;
    }
  }

  private static async fetchHtmlWithRetry(url: URL): Promise<string> {
    let lastError = '';
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(url.toString(), {
          headers: AntiBotHandler.headers(attempt),
          redirect: 'follow',
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!response.ok) {
          lastError = `HTTP ${response.status}`;
          if (!AntiBotHandler.isBlockedStatus(response.status)) break;
          await ProductImporterService.delay(350 * 2 ** attempt);
          continue;
        }
        return await ProductImporterService.readLimited(response);
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Erreur reseau';
        await ProductImporterService.delay(350 * 2 ** attempt);
      }
    }
    throw new Error(`Impossible de charger la page produit (${lastError}).`);
  }

  private static async readLimited(response: Response): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) return response.text();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      total += value.byteLength;
      if (total >= MAX_HTML_BYTES) {
        await reader.cancel();
        break;
      }
    }
    const buffer = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0));
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder().decode(buffer);
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private static platformWarnings(html: string): string[] {
    const platforms = StoreDetector.detectPlatform(html);
    const warnings: string[] = [`Detection technique: ${platforms.join(', ')}`];
    if (platforms.includes('nextjs')) warnings.push('Next.js commerce detecte: extraire __NEXT_DATA__ en phase worker pour augmenter la precision.');
    if (platforms.includes('react-spa') || platforms.includes('vue-spa')) warnings.push('SPA detectee: Playwright peut etre necessaire si le HTML serveur est vide.');
    return warnings;
  }

  private static safeSlugFallback(rawUrl: string, store?: CompatibleStore): Partial<ImportProduct> {
    try {
      return extractSlugFallback(new URL(rawUrl), store);
    } catch {
      return {};
    }
  }
}
