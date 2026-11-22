'use strict';

// href handling (matrix G4). Stored hrefs to this component's own resources are
// version-neutral: /<resourceKey>/<id> (resourceKey: catalog, category, ...). Each
// API builds its own absolute href at response time.

const { RESOURCES } = require('./model');

const SEGMENT_TO_KEY = {};
for (const [key, r] of Object.entries(RESOURCES)) {
  SEGMENT_TO_KEY[r.v4Segment] = key;
  SEGMENT_TO_KEY[r.v5Segment] = key;
}
const SEGMENTS = Object.keys(SEGMENT_TO_KEY).join('|');
const VERSIONED = new RegExp(`/tmf-api/productCatalogManagement/v[45]/(${SEGMENTS})/([^/?#]+)/?$`);
const NEUTRAL = new RegExp(`^/(${Object.keys(RESOURCES).join('|')})/([^/?#]+)$`);
const HREF_KEYS = ['href', 'parentSpecificationHref'];

// Turns a v4 or v5 href to one of this component's resources into /<key>/<id>.
// Hrefs to other systems, or to another component instance, are left unchanged.
function normaliseHref(href, componentName) {
  if (typeof href !== 'string') return href;
  if (NEUTRAL.test(href)) return href;
  const m = VERSIONED.exec(href);
  if (!m) return href;
  if (componentName && href.indexOf('/' + componentName + '/') < 0) return href;
  return `/${SEGMENT_TO_KEY[m[1]]}/${m[2]}`;
}

// Builds the href a client of `version` should see. baseUrl is that API's base,
// e.g. https://host/r1-productcatalogmanagement/tmf-api/productCatalogManagement/v4
function buildHref(stored, version, baseUrl) {
  if (typeof stored !== 'string') return stored;
  const m = NEUTRAL.exec(stored);
  if (!m) return stored;
  const r = RESOURCES[m[1]];
  const segment = version === 'v4' ? r.v4Segment : r.v5Segment;
  return `${baseUrl.replace(/\/+$/, '')}/${segment}/${m[2]}`;
}

// Applies fn to every href-like property in a document, in place.
function mapHrefs(doc, fn) {
  if (Array.isArray(doc)) { doc.forEach(d => mapHrefs(d, fn)); return doc; }
  if (!doc || typeof doc !== 'object') return doc;
  for (const k of Object.keys(doc)) {
    if (HREF_KEYS.indexOf(k) >= 0 && typeof doc[k] === 'string') doc[k] = fn(doc[k]);
    else if (doc[k] && typeof doc[k] === 'object') mapHrefs(doc[k], fn);
  }
  return doc;
}

module.exports = { normaliseHref, buildHref, mapHrefs, SEGMENT_TO_KEY };
