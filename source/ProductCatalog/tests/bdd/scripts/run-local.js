'use strict';

// Runs cucumber-js against the docker-compose containers (docker-compose.yaml):
//   node scripts/run-local.js --profile smoke
// Environment variables that are already set win over these defaults.

const { spawnSync } = require('child_process');
const path = require('path');

const COMPONENT = 'r1-productcatalogmanagement';
const defaults = {
  TMF620_V4_BASE_URL: `http://localhost:18084/${COMPONENT}/tmf-api/productCatalogManagement/v4`,
  TMF620_V5_BASE_URL: `http://localhost:18085/${COMPONENT}/tmf-api/productCatalogManagement/v5`,
  PRODCAT_METRICS_URL: `http://localhost:14000/${COMPONENT}/metrics`
};
const env = Object.assign({}, defaults, process.env);
const cli = path.join(__dirname, '..', 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber-js');
const r = spawnSync(process.execPath, [cli].concat(process.argv.slice(2)), { stdio: 'inherit', env, cwd: path.join(__dirname, '..') });
process.exit(r.status === null ? 1 : r.status);
