'use strict';

const plugins = {};
plugins.db = require('./mongo');

// stub queue — replace with a real queue plugin (e.g. kafka) if event fan-out is required
plugins.queue = { publish: () => {} };

module.exports = plugins;
