'use strict';

// Test client 1: TMF620 v4.0.0 paths and payload shapes (/catalog, plain
// relatedParty, Category.parentId, productSpecCharacteristicValue, string ranges).
// Create bodies need only a name; the service fills in id, href, @type and the
// default lifecycleStatus. Plain JSON PATCH (merge semantics).

const { Tmf620Client } = require('./Tmf620Client');

class Tmf620V4Client extends Tmf620Client {
  constructor(deps) {
    super('v4', deps);
    // The v4 service's own errors ({code: 24, ...}) predate the TMF Error schema,
    // so only compatibility errors would pass a check; error bodies are not checked.
    this.errorSchema = undefined;
  }

  build(resource, attributes) {
    return Object.assign({}, attributes);
  }
}

module.exports = { Tmf620V4Client };
