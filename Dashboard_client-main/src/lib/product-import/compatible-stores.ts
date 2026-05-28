import type { CompatibleStore, ParserType, StoreDifficulty, StoreSelectors } from './types';

type StoreSeed = Omit<CompatibleStore, 'logoUrl' | 'selectors'> & {
  selectors?: Partial<StoreSelectors>;
};

const defaultSelectors: StoreSelectors = {
  title: [
    'h1',
    '[itemprop="name"]',
    '.product-title',
    '.product_title',
    '.product-name',
    '[data-testid="product-title"]',
    'meta[property="og:title"]',
  ],
  price: [
    '[itemprop="price"]',
    '[data-price]',
    '.price',
    '.product-price',
    '.regular-price',
    '.current-price',
    '.price-current',
    'meta[property="product:price:amount"]',
  ],
  image: [
    'meta[property="og:image"]',
    '[itemprop="image"]',
    '.product-cover img',
    '.product-image img',
    '.gallery img',
    '.slick-slide img',
  ],
  gallery: [
    '.product-images img',
    '.product-gallery img',
    '.thumb-container img',
    '.slick-slide img',
    '[data-testid="product-gallery"] img',
  ],
  description: [
    '[itemprop="description"]',
    '.product-description',
    '.description',
    '#description',
    '.product-details',
    'meta[name="description"]',
  ],
  stock: [
    '[itemprop="availability"]',
    '.stock',
    '.availability',
    '.product-availability',
    '[data-testid="availability"]',
  ],
  category: [
    '[itemprop="category"]',
    '.breadcrumb',
    '.breadcrumbs',
    'nav[aria-label="breadcrumb"]',
    'meta[property="product:category"]',
  ],
  brand: [
    '[itemprop="brand"]',
    '.brand',
    '.product-brand',
    '.manufacturer',
    'meta[property="product:brand"]',
  ],
};

function selectors(overrides: Partial<StoreSelectors> = {}): StoreSelectors {
  return {
    title: [...(overrides.title ?? []), ...defaultSelectors.title],
    price: [...(overrides.price ?? []), ...defaultSelectors.price],
    image: [...(overrides.image ?? []), ...defaultSelectors.image],
    gallery: [...(overrides.gallery ?? []), ...defaultSelectors.gallery],
    description: [...(overrides.description ?? []), ...defaultSelectors.description],
    stock: [...(overrides.stock ?? []), ...defaultSelectors.stock],
    category: [...(overrides.category ?? []), ...defaultSelectors.category],
    brand: [...(overrides.brand ?? []), ...defaultSelectors.brand],
  };
}

function logo(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function store(seed: StoreSeed): CompatibleStore {
  return {
    ...seed,
    logoUrl: logo(seed.domain),
    selectors: selectors(seed.selectors),
  };
}

function methods(...items: string[]): string[] {
  return ['JSON-LD', 'OpenGraph', ...items, 'Generic DOM', 'Manual fallback'];
}

const tnTechSelectors: Partial<StoreSelectors> = {
  title: ['.page-title h1', '.product-info-main h1', '.product-name h1'],
  price: ['.price-box .price', '.special-price .price', '.regular-price .price'],
  image: ['.fotorama__img', '.product.media img', '#image-main'],
  gallery: ['.fotorama__nav__frame img', '.product.media img'],
  stock: ['.stock.available', '.availability.in-stock', '.product-info-stock-sku'],
  brand: ['.product.attribute.manufacturer', '.brand-name'],
};

const prestashopSelectors: Partial<StoreSelectors> = {
  title: ['.h1', '.product-title', 'h1[itemprop="name"]'],
  price: ['.current-price [content]', '.current-price span', '.product-price', '.price'],
  image: ['.product-cover img', '#zoom_product'],
  gallery: ['.product-images img', '.js-thumb'],
  description: ['#description', '.product-description', '.tabs .product-description'],
  stock: ['#product-availability', '.product-availability'],
  category: ['.breadcrumb'],
};

const shopifySelectors: Partial<StoreSelectors> = {
  title: ['.product__title', '.product-single__title', '[data-product-title]'],
  price: ['.price-item--sale', '.price-item--regular', '[data-product-price]'],
  image: ['.product__media img', '.product-single__media img'],
  gallery: ['.product__media img', '.product-single__thumbnails img'],
  description: ['.product__description', '.rte'],
  stock: ['[data-product-inventory]', '.inventory-status'],
};

const wooSelectors: Partial<StoreSelectors> = {
  title: ['.product_title', '.entry-title'],
  price: ['.summary .price', '.woocommerce-Price-amount'],
  image: ['.woocommerce-product-gallery__image img'],
  gallery: ['.woocommerce-product-gallery__image img', '.flex-control-thumbs img'],
  description: ['.woocommerce-product-details__short-description', '#tab-description'],
  stock: ['.stock'],
  category: ['.posted_in', '.woocommerce-breadcrumb'],
  brand: ['.tagged_as', '.product_meta'],
};

function makeStore(
  id: string,
  name: string,
  country: string,
  category: string,
  domain: string,
  exampleProductUrl: string,
  parserType: ParserType,
  difficulty: StoreDifficulty,
  antiBot: boolean,
  recommendedBackend: string,
  scrapingMethods: string[],
  urlPatterns: string[],
  enabled = true,
  customSelectors?: Partial<StoreSelectors>,
): CompatibleStore {
  return store({
    id,
    name,
    country,
    category,
    domain,
    exampleProductUrl,
    parserType,
    scrapingMethods,
    difficulty,
    antiBot,
    recommendedBackend,
    selectors: customSelectors,
    urlPatterns,
    enabled,
  });
}

export const compatibleStores: CompatibleStore[] = [
  makeStore('mytek-tn', 'MyTek', 'Tunisie', 'Electronics', 'mytek.tn', 'https://www.mytek.tn/pc-portable.html', 'MagentoParser', 'medium', false, 'Axios + Cheerio, Playwright fallback', methods('Magento selectors', 'Price normalization TND'), ['mytek.tn/**', 'mytek.tn/*/*.html'], true, tnTechSelectors),
  makeStore('tunisianet-tn', 'Tunisianet', 'Tunisie', 'Electronics', 'tunisianet.com.tn', 'https://www.tunisianet.com.tn/pc-portable-tunisie', 'PrestashopParser', 'medium', false, 'Axios + Cheerio', methods('Prestashop selectors'), ['tunisianet.com.tn/**'], true, prestashopSelectors),
  makeStore('scoop-tn', 'Scoop Informatique', 'Tunisie', 'Electronics', 'scoop.com.tn', 'https://www.scoop.com.tn/pc-portable', 'PrestashopParser', 'medium', false, 'Axios + Cheerio', methods('Prestashop selectors'), ['scoop.com.tn/**'], true, prestashopSelectors),
  makeStore('zoom-tn', 'Zoom Informatique', 'Tunisie', 'Electronics', 'zoom.com.tn', 'https://www.zoom.com.tn/pc-portable', 'PrestashopParser', 'medium', false, 'Axios + Cheerio', methods('Prestashop selectors'), ['zoom.com.tn/**'], true, prestashopSelectors),
  makeStore('megapc-tn', 'MegaPC', 'Tunisie', 'Gaming', 'megapc.tn', 'https://megapc.tn/shop/', 'WooCommerceParser', 'medium', false, 'Axios + Cheerio', methods('WooCommerce selectors'), ['megapc.tn/**'], true, wooSelectors),
  makeStore('spacenet-tn', 'Spacenet', 'Tunisie', 'Electronics', 'spacenet.tn', 'https://spacenet.tn/pc-portable', 'PrestashopParser', 'medium', false, 'Axios + Cheerio', methods('Prestashop selectors'), ['spacenet.tn/**'], true, prestashopSelectors),
  makeStore('dabchy-tn', 'Dabchy', 'Tunisie', 'Fashion', 'dabchy.com', 'https://www.dabchy.com/', 'ReactHydrationParser', 'hard', true, 'Playwright + hydration JSON extraction', methods('React hydration', 'Dynamic rendering'), ['dabchy.com/**'], true, { title: ['[data-testid="item-title"]'], price: ['[data-testid="item-price"]'] }),
  makeStore('founa-tn', 'Founa', 'Tunisie', 'Food', 'founa.com', 'https://www.founa.com/', 'DynamicSiteParser', 'hard', true, 'Playwright recommended, API discovery if available', methods('Hydration data', 'Dynamic rendering'), ['founa.com/**'], true, { title: ['.product-name'], price: ['.product-price'], stock: ['.availability'] }),
  makeStore('exist-tn', 'Exist', 'Tunisie', 'Fashion', 'exist.com.tn', 'https://www.exist.com.tn/', 'PrestashopParser', 'medium', false, 'Axios + Cheerio', methods('Prestashop selectors'), ['exist.com.tn/**'], true, prestashopSelectors),
  makeStore('zen-tn', 'Zen', 'Tunisie', 'Fashion', 'zen.com.tn', 'https://www.zen.com.tn/', 'PrestashopParser', 'medium', false, 'Axios + Cheerio', methods('Prestashop selectors'), ['zen.com.tn/**'], true, prestashopSelectors),
  makeStore('parashop-tn', 'Parashop', 'Tunisie', 'Beauty', 'parashop.tn', 'https://www.parashop.tn/', 'PrestashopParser', 'medium', false, 'Axios + Cheerio', methods('Prestashop selectors'), ['parashop.tn/**'], true, prestashopSelectors),
  makeStore('fatales-tn', 'Fatales', 'Tunisie', 'Beauty', 'fatales.tn', 'https://www.fatales.tn/', 'MagentoParser', 'medium', false, 'Axios + Cheerio', methods('Magento selectors'), ['fatales.tn/**'], true, tnTechSelectors),
  makeStore('jumia-tn', 'Jumia Tunisie', 'Tunisie', 'Marketplace', 'jumia.com.tn', 'https://www.jumia.com.tn/', 'DynamicSiteParser', 'very-hard', true, 'Playwright + strict rate limit, partial fallback likely', methods('JSON-LD', 'OpenGraph', 'Dynamic rendering'), ['jumia.com.tn/**'], true, { title: ['h1.-fs20', '[data-testid="product-title"]'], price: ['.price', '[data-testid="product-price"]'], gallery: ['.itm img', '.sldr img'] }),
  makeStore('geant-tn', 'Geant Tunisie', 'Tunisie', 'Food', 'geant.tn', 'https://www.geant.tn/', 'DynamicSiteParser', 'hard', true, 'Playwright recommended', methods('Dynamic rendering'), ['geant.tn/**'], true, { title: ['.product-title'], price: ['.product-price'] }),
  makeStore('carrefour-tn', 'Carrefour Tunisie', 'Tunisie', 'Food', 'carrefour.tn', 'https://www.carrefour.tn/', 'DynamicSiteParser', 'hard', true, 'Playwright recommended', methods('Dynamic rendering', 'API discovery'), ['carrefour.tn/**'], true, { title: ['.product-title', '[data-testid="product-name"]'], price: ['.price', '[data-testid="product-price"]'] }),
  makeStore('decathlon-tn', 'Decathlon Tunisie', 'Tunisie', 'Sport', 'decathlon.tn', 'https://www.decathlon.tn/', 'ReactHydrationParser', 'hard', true, 'Playwright + JSON hydration extraction', methods('JSON-LD', 'Hydration data'), ['decathlon.tn/**'], true, { title: ['h1', '[data-testid="product-title"]'], price: ['[data-testid="price"]', '.price'], gallery: ['picture img', '[data-testid="product-images"] img'] }),
  makeStore('zara-tn', 'Zara Tunisie', 'Tunisie', 'Fashion', 'zara.com', 'https://www.zara.com/tn/', 'DynamicSiteParser', 'very-hard', true, 'Playwright only, strong anti-bot', methods('Dynamic rendering', 'Manual fallback'), ['zara.com/tn/**'], false, { title: ['h1', '.product-detail-info__header-name'], price: ['.money-amount__main'] }),
  makeStore('lcwaikiki-tn', 'LC Waikiki Tunisie', 'Tunisie', 'Fashion', 'lcwaikiki.com', 'https://www.lcwaikiki.com/fr-FR/TN', 'ReactHydrationParser', 'hard', true, 'Playwright + hydration data', methods('Hydration data', 'Dynamic rendering'), ['lcwaikiki.com/**/TN/**'], true, { title: ['h1', '.product-title'], price: ['.price', '.product-price'] }),
  makeStore('city-sport-tn', 'City Sport', 'Tunisie', 'Sport', 'citysport.tn', 'https://www.citysport.tn/', 'PrestashopParser', 'medium', false, 'Axios + Cheerio', methods('Prestashop selectors'), ['citysport.tn/**'], true, prestashopSelectors),
  makeStore('tunisia-mall-boutiques', 'Tunisia Mall Boutiques', 'Tunisie', 'Marketplace', 'tunisiamall.com.tn', 'https://www.tunisiamall.com.tn/', 'MetaTagsParser', 'hard', false, 'Store-specific manual mapping, partial import', methods('OpenGraph', 'Meta tags'), ['tunisiamall.com.tn/**'], false),

  makeStore('amazon-global', 'Amazon', 'International', 'Marketplace', 'amazon.com', 'https://www.amazon.com/dp/B0EXAMPLE', 'DynamicSiteParser', 'very-hard', true, 'Playwright + proxy + manual fallback', methods('OpenGraph', 'Dynamic rendering'), ['amazon.*/*/dp/*', 'amazon.*/dp/*'], false, { title: ['#productTitle'], price: ['.a-price .a-offscreen'], image: ['#landingImage'], gallery: ['#altImages img'], stock: ['#availability'] }),
  makeStore('aliexpress-global', 'AliExpress', 'International', 'Marketplace', 'aliexpress.com', 'https://www.aliexpress.com/item/1005000000000000.html', 'DynamicSiteParser', 'very-hard', true, 'Playwright + API discovery', methods('Hydration data', 'Dynamic rendering'), ['aliexpress.com/item/*.html'], false),
  makeStore('ebay-global', 'eBay', 'International', 'Marketplace', 'ebay.com', 'https://www.ebay.com/itm/000000000000', 'OpenGraphParser', 'hard', true, 'Axios + Cheerio, Playwright fallback', methods('OpenGraph', 'JSON-LD'), ['ebay.*/itm/*'], false, { title: ['h1.x-item-title__mainTitle', '#itemTitle'], price: ['.x-price-primary span', '#prcIsum'], image: ['#icImg'] }),
  makeStore('etsy-global', 'Etsy', 'International', 'Marketplace', 'etsy.com', 'https://www.etsy.com/listing/000000000/example', 'JsonLdParser', 'hard', true, 'Axios + Cheerio, Playwright fallback', methods('JSON-LD', 'OpenGraph'), ['etsy.com/listing/*'], false),
  makeStore('shein-global', 'SHEIN', 'International', 'Fashion', 'shein.com', 'https://www.shein.com/', 'DynamicSiteParser', 'very-hard', true, 'Playwright only', methods('Dynamic rendering', 'Manual fallback'), ['shein.com/**'], false),
  makeStore('hm-global', 'H&M', 'International', 'Fashion', 'hm.com', 'https://www2.hm.com/', 'JsonLdParser', 'hard', true, 'Axios + Cheerio, Playwright fallback', methods('JSON-LD'), ['hm.com/**'], false),
  makeStore('nike-global', 'Nike', 'International', 'Sport', 'nike.com', 'https://www.nike.com/t/example', 'ReactHydrationParser', 'hard', true, 'Playwright + hydration extraction', methods('Hydration data', 'OpenGraph'), ['nike.com/**'], false),
  makeStore('adidas-global', 'Adidas', 'International', 'Sport', 'adidas.com', 'https://www.adidas.com/us/example', 'ReactHydrationParser', 'hard', true, 'Playwright + hydration extraction', methods('JSON-LD', 'Hydration data'), ['adidas.com/**'], false),
  makeStore('sephora-global', 'Sephora', 'International', 'Beauty', 'sephora.com', 'https://www.sephora.com/product/example', 'DynamicSiteParser', 'very-hard', true, 'Playwright + proxy option', methods('JSON-LD', 'Dynamic rendering'), ['sephora.com/product/**'], false),
  makeStore('ikea-global', 'IKEA', 'International', 'Home', 'ikea.com', 'https://www.ikea.com/us/en/p/example-00000000/', 'JsonLdParser', 'medium', false, 'Axios + Cheerio', methods('JSON-LD', 'OpenGraph'), ['ikea.com/**/p/**'], false),
  makeStore('bestbuy-global', 'Best Buy', 'International', 'Electronics', 'bestbuy.com', 'https://www.bestbuy.com/site/example/0000000.p', 'JsonLdParser', 'hard', true, 'Axios + Cheerio, Playwright fallback', methods('JSON-LD', 'OpenGraph'), ['bestbuy.com/site/**/*.p'], false),
  makeStore('newegg-global', 'Newegg', 'International', 'Gaming', 'newegg.com', 'https://www.newegg.com/p/N82E16800000000', 'JsonLdParser', 'hard', true, 'Axios + Cheerio, Playwright fallback', methods('JSON-LD', 'OpenGraph'), ['newegg.com/p/**'], false),
  makeStore('apple-global', 'Apple Store', 'International', 'Electronics', 'apple.com', 'https://www.apple.com/shop/product/example', 'MetaTagsParser', 'hard', true, 'Axios + Cheerio, manual price fallback', methods('OpenGraph', 'Meta tags'), ['apple.com/shop/product/**'], false),
  makeStore('steam-global', 'Steam', 'International', 'Gaming', 'store.steampowered.com', 'https://store.steampowered.com/app/000000/example/', 'OpenGraphParser', 'medium', false, 'Axios + Cheerio', methods('OpenGraph', 'DOM selectors'), ['store.steampowered.com/app/**'], false),
  makeStore('autodoc-global', 'Autodoc', 'International', 'Auto', 'autodoc.com', 'https://www.autodoc.com/example', 'JsonLdParser', 'hard', true, 'Axios + Cheerio, Playwright fallback', methods('JSON-LD', 'OpenGraph'), ['autodoc.com/**'], false),
  makeStore('farfetch-global', 'Farfetch', 'International', 'Luxury', 'farfetch.com', 'https://www.farfetch.com/shopping/item-00000000.aspx', 'DynamicSiteParser', 'very-hard', true, 'Playwright + proxy option', methods('JSON-LD', 'Dynamic rendering'), ['farfetch.com/**/item-*.aspx'], false),
  makeStore('netaporter-global', 'NET-A-PORTER', 'International', 'Luxury', 'net-a-porter.com', 'https://www.net-a-porter.com/en/product/example', 'JsonLdParser', 'hard', true, 'Axios + Cheerio, Playwright fallback', methods('JSON-LD', 'OpenGraph'), ['net-a-porter.com/**/product/**'], false),
  makeStore('carrefour-fr', 'Carrefour France', 'International', 'Food', 'carrefour.fr', 'https://www.carrefour.fr/p/example', 'JsonLdParser', 'hard', true, 'Axios + Cheerio, Playwright fallback', methods('JSON-LD', 'OpenGraph'), ['carrefour.fr/p/**'], false),
  makeStore('shopify-generic', 'Shopify Store Generic', 'International', 'Marketplace', 'myshopify.com', 'https://example.myshopify.com/products/example', 'ShopifyParser', 'easy', false, 'Axios + Cheerio + /products/*.js', methods('Shopify product JSON', 'JSON-LD'), ['*/products/*', '*.myshopify.com/products/*'], true, shopifySelectors),
  makeStore('woocommerce-generic', 'WooCommerce Generic', 'International', 'Marketplace', 'woocommerce.com', 'https://example.com/product/example', 'WooCommerceParser', 'easy', false, 'Axios + Cheerio', methods('WooCommerce selectors', 'JSON-LD'), ['*/product/*'], true, wooSelectors),
];

export const storeCategories = Array.from(new Set(compatibleStores.map((item) => item.category))).sort();
export const storeCountries = Array.from(new Set(compatibleStores.map((item) => item.country))).sort();

export const compatibleStoresByCategory = compatibleStores.reduce<Record<string, CompatibleStore[]>>((groups, item) => {
  groups[item.category] = [...(groups[item.category] ?? []), item];
  return groups;
}, {});

export const compatibleStoresByRegion = {
  Tunisie: compatibleStores.filter((item) => item.country === 'Tunisie'),
  International: compatibleStores.filter((item) => item.country !== 'Tunisie'),
};
