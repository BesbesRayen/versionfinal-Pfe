CREATE TABLE compatible_stores (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  country VARCHAR(80) NOT NULL DEFAULT 'Tunisie',
  category VARCHAR(80) NOT NULL,
  domain VARCHAR(180) NOT NULL,
  logo_url VARCHAR(500) NULL,
  example_product_url VARCHAR(800) NOT NULL,
  parser_type ENUM(
    'OpenGraphParser',
    'JsonLdParser',
    'MetaTagsParser',
    'DomParser',
    'ShopifyParser',
    'WooCommerceParser',
    'MagentoParser',
    'PrestashopParser',
    'ReactHydrationParser',
    'DynamicSiteParser',
    'ApiParser'
  ) NOT NULL DEFAULT 'JsonLdParser',
  scraping_methods JSON NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard', 'very-hard') NOT NULL DEFAULT 'medium',
  anti_bot BOOLEAN NOT NULL DEFAULT FALSE,
  recommended_backend VARCHAR(255) NOT NULL,
  selectors JSON NOT NULL,
  url_patterns JSON NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_compatible_stores_domain (domain),
  KEY idx_compatible_stores_category (category),
  KEY idx_compatible_stores_country (country),
  KEY idx_compatible_stores_enabled (enabled)
);

CREATE TABLE store_parsers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  store_id VARCHAR(80) NOT NULL,
  parser_type VARCHAR(80) NOT NULL,
  priority INT NOT NULL DEFAULT 100,
  config JSON NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_store_parsers_store
    FOREIGN KEY (store_id) REFERENCES compatible_stores(id)
    ON DELETE CASCADE,
  KEY idx_store_parsers_store_priority (store_id, priority)
);

CREATE TABLE product_import_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source_url VARCHAR(1000) NOT NULL,
  source_url_hash CHAR(64) NOT NULL,
  store_id VARCHAR(80) NULL,
  store_name VARCHAR(160) NULL,
  parser_type VARCHAR(80) NOT NULL,
  parser_method VARCHAR(120) NOT NULL,
  confidence DECIMAL(5,4) NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  product_title VARCHAR(255) NULL,
  product_price DECIMAL(12,3) NULL,
  product_currency VARCHAR(12) NULL,
  main_image VARCHAR(1000) NULL,
  warnings JSON NULL,
  response_time_ms INT UNSIGNED NOT NULL DEFAULT 0,
  imported_by BIGINT UNSIGNED NULL,
  imported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_product_import_logs_store (store_id),
  KEY idx_product_import_logs_hash (source_url_hash),
  KEY idx_product_import_logs_imported_at (imported_at),
  CONSTRAINT fk_import_logs_store
    FOREIGN KEY (store_id) REFERENCES compatible_stores(id)
    ON DELETE SET NULL
);

CREATE TABLE import_cache (
  cache_key CHAR(64) PRIMARY KEY,
  source_url VARCHAR(1000) NOT NULL,
  store_id VARCHAR(80) NULL,
  result_json JSON NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'success',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_import_cache_expires_at (expires_at),
  KEY idx_import_cache_store (store_id),
  CONSTRAINT fk_import_cache_store
    FOREIGN KEY (store_id) REFERENCES compatible_stores(id)
    ON DELETE SET NULL
);
