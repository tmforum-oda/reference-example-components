'use strict';

// The telco catalogue (spec 10.2) in either API version's shape:
//   payload('v5', 'productOffering', 'ff500', ctx) -> a v5 create body (before the
//   client adds its version's required defaults)

const catalogue = require('./catalogue');
const BUILDERS = { v4: require('./v4/builders'), v5: require('./v5/builders') };

function payload(version, kind, key, ctx) {
  const builder = BUILDERS[version];
  if (!builder) throw new Error(`Unknown TMF620 API version '${version}' (expected v4 or v5)`);
  const c = Object.assign({ ref: () => undefined, name: n => n }, ctx);
  return builder.build(kind, catalogue.entry(kind, key), c);
}

module.exports = Object.assign({ payload }, catalogue);
