export type ParserType =
  | 'OpenGraphParser'
  | 'JsonLdParser'
  | 'MetaTagsParser'
  | 'DomParser'
  | 'ShopifyParser'
  | 'WooCommerceParser'
  | 'MagentoParser'
  | 'PrestashopParser'
  | 'ReactHydrationParser'
  | 'DynamicSiteParser'
  | 'ApiParser';

export type StoreDifficulty = 'easy' | 'medium' | 'hard' | 'very-hard';

export interface StoreSelectors {
  title: string[];
  price: string[];
  image: string[];
  gallery: string[];
  description: string[];
  stock: string[];
  category: string[];
  brand: string[];
}

export interface CompatibleStore {
  id: string;
  name: string;
  country: string;
  category: string;
  domain: string;
  logoUrl?: string;
  exampleProductUrl: string;
  parserType: ParserType;
  scrapingMethods: string[];
  difficulty: StoreDifficulty;
  antiBot: boolean;
  recommendedBackend: string;
  selectors: StoreSelectors;
  urlPatterns: string[];
  enabled: boolean;
}

export interface ProductImportResult {
  success: boolean;
  sourceUrl: string;
  store: {
    name: string;
    domain: string;
    country: string;
    category: string;
  };
  product: {
    title: string;
    price: number;
    currency: string;
    oldPrice: number | null;
    brand: string;
    category: string;
    description: string;
    stock: string;
    availability: string;
    mainImage: string;
    gallery: string[];
  };
  parser: {
    type: ParserType | 'ManualFallback';
    method: string;
    confidence: number;
    warnings: string[];
  };
  metadata: {
    importedAt: string;
    cacheHit: boolean;
    responseTimeMs: number;
  };
}
