'use strict';

// Test client 2: TMF620 v5.0.0 paths and payload shapes (/productCatalog, @type on
// every object, RelatedPartyRefOrPartyRoleRef, Category.parent, typed characteristic
// values). Create bodies are FVOs: the builder adds @type and the attributes the
// v5.0.0 OAS requires (lifecycleStatus, lastUpdate, and priceType on prices).
// PATCH uses application/merge-patch+json; MVOs require @type too.

const { Tmf620Client } = require('./Tmf620Client');

const TYPES = {
  catalog: 'ProductCatalog',
  category: 'Category',
  productOffering: 'ProductOffering',
  productOfferingPrice: 'ProductOfferingPrice',
  productSpecification: 'ProductSpecification'
};

// Required by the *_FVO schemas, beyond @type and name
const REQUIRED_DEFAULTS = {
  catalog: {},
  category: {},
  productOffering: { lifecycleStatus: 'In design' },
  productOfferingPrice: { lifecycleStatus: 'In design', priceType: 'recurring' },
  productSpecification: { lifecycleStatus: 'In design' }
};
const HAS_LAST_UPDATE = ['productOffering', 'productOfferingPrice', 'productSpecification'];

class Tmf620V5Client extends Tmf620Client {
  constructor(deps) {
    super('v5', deps);
    this.errorSchema = 'Error';
  }

  build(resource, attributes) {
    const body = Object.assign({ '@type': TYPES[resource] }, REQUIRED_DEFAULTS[resource], attributes);
    if (HAS_LAST_UPDATE.indexOf(resource) >= 0 && body.lastUpdate === undefined) body.lastUpdate = new Date().toISOString();
    return body;
  }

  patchContentType() { return 'application/merge-patch+json'; }

  shapePatch(resource, body) {
    if (body && typeof body === 'object' && !Array.isArray(body) && body['@type'] === undefined) {
      return Object.assign({ '@type': TYPES[resource] }, body);
    }
    return body;
  }
}

module.exports = { Tmf620V5Client, TYPES };
