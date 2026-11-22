'use strict';

const { BeforeAll, After, Status } = require('@cucumber/cucumber');
const { loadConfig } = require('../../support/config');
const { RUN_ID } = require('../../support/world');

BeforeAll(function () {
  const config = loadConfig();
  console.log(`TMF620 BDD run ${RUN_ID}`);
  console.log(`  v4: ${config.baseUrls.v4}`);
  console.log(`  v5: ${config.baseUrls.v5}`);
  if (config.tlsInsecure) console.log('  TLS certificate checks are off (local gateway)');
});

// Deletes what the scenario created, in dependency order. A failed scenario still
// cleans up, unless TMF620_KEEP_DATA=true (useful when debugging).
After(async function (scenario) {
  if (this.config.keepData) {
    if (this.created.length) console.log(`Keeping ${this.created.length} resources from "${scenario.pickle.name}" (TMF620_KEEP_DATA=true)`);
    return;
  }
  const failures = await this.cleanup();
  if (failures.length) {
    const message = `Cleanup could not delete:\n  ${failures.join('\n  ')}`;
    // Report it without hiding the scenario's own result
    if (scenario.result.status === Status.PASSED) throw new Error(message);
    console.warn(message);
  }
});
