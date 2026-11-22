'use strict';

// Test configuration, from environment variables (see README.md).

const RESOURCES = ['catalog', 'category', 'productOffering', 'productOfferingPrice', 'productSpecification'];

// Path segment of each resource per API version. The catalog was renamed in v5
// (compatibility matrix G1).
const RESOURCE_PATHS = {
  v4: {
    catalog: 'catalog',
    category: 'category',
    productOffering: 'productOffering',
    productOfferingPrice: 'productOfferingPrice',
    productSpecification: 'productSpecification'
  },
  v5: {
    catalog: 'productCatalog',
    category: 'category',
    productOffering: 'productOffering',
    productOfferingPrice: 'productOfferingPrice',
    productSpecification: 'productSpecification'
  }
};

// Deletion order for cleanup: things that refer to others go first.
const CLEANUP_ORDER = ['productOffering', 'productOfferingPrice', 'productSpecification', 'category', 'catalog'];

function stripTrailingSlash(url) {
  return url.replace(/\/+$/, '');
}

function isLocalHost(url) {
  try {
    const host = new URL(url).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host.endsWith('.localhost');
  } catch (e) {
    return false;
  }
}

function loadConfig(env) {
  env = env || process.env;
  const gateway = stripTrailingSlash(env.CANVAS_GATEWAY_URL || 'https://localhost');
  const releaseName = env.RELEASE_NAME || 'r1';
  const componentName = env.COMPONENT_NAME || `${releaseName}-productcatalogmanagement`;
  const baseUrls = {
    v4: stripTrailingSlash(env.TMF620_V4_BASE_URL || `${gateway}/${componentName}/tmf-api/productCatalogManagement/v4`),
    v5: stripTrailingSlash(env.TMF620_V5_BASE_URL || `${gateway}/${componentName}/tmf-api/productCatalogManagement/v5`)
  };
  // The local Canvas gateway uses a self-signed certificate, so certificate checks
  // are off by default for localhost only. Set TMF620_TLS_INSECURE to override.
  const tlsInsecure = env.TMF620_TLS_INSECURE !== undefined
    ? env.TMF620_TLS_INSECURE === 'true'
    : (isLocalHost(baseUrls.v4) && isLocalHost(baseUrls.v5));
  return {
    baseUrls,
    metricsUrl: env.PRODCAT_METRICS_URL ? stripTrailingSlash(env.PRODCAT_METRICS_URL) : `${gateway}/${componentName}/metrics`,
    accessToken: env.TMF620_ACCESS_TOKEN || undefined,
    tlsInsecure,
    requestTimeoutMs: parseInt(env.TMF620_TIMEOUT_MS || '15000', 10),
    keepData: env.TMF620_KEEP_DATA === 'true',
    debug: env.DEBUG_LOGS === 'true'
  };
}

function resourceUrl(config, version, resource, id) {
  if (!RESOURCE_PATHS[version]) throw new Error(`Unknown TMF620 API version '${version}' (expected v4 or v5)`);
  const segment = RESOURCE_PATHS[version][resource];
  if (!segment) throw new Error(`Unknown TMF620 resource '${resource}' (expected one of ${RESOURCES.join(', ')})`);
  return `${config.baseUrls[version]}/${segment}${id ? '/' + encodeURIComponent(id) : ''}`;
}

module.exports = { RESOURCES, RESOURCE_PATHS, CLEANUP_ORDER, loadConfig, resourceUrl, isLocalHost };
