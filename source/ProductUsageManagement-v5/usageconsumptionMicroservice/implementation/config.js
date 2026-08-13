'use strict';

const path = require('path');
const fs = require('fs');

const contents = fs.readFileSync(__dirname + '/config.json');
const jsonConfig = JSON.parse(contents);

const config = {
  ROOT_DIR: __dirname,
  URL_PORT: process.env.PORT || 8080,
  CONTROLLER_DIRECTORY: path.join(__dirname, 'controllers'),
  OPENAPI_YAML: '',
  EXTERNAL_URL: '',
  SCHEMA_URL: '',

  DEFAULT_FILTERING_FIELDS: { id: 1, href: 1, '@type': 1 },
  DEFAULT_FILTERING_FIELDS_KEYS: ['id', 'href', '@type'],

  QUERY_LIMIT: 250,

  HUB: 'EventsSubscription',
};

config.OPENAPI_YAML = path.join(config.ROOT_DIR, 'api', 'openapi.yaml');

// import all properties from config.json
Object.keys(jsonConfig).forEach(key => {
  config[key] = jsonConfig[key];
});

if (jsonConfig.servers && jsonConfig.servers.length > 0) {
  config.EXTERNAL_URL = jsonConfig.servers[0].url;
}

module.exports = config;
