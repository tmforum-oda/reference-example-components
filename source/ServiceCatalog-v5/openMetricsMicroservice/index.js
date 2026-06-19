'use strict';
const restify = require('restify');
const client  = require('prom-client');

const componentName = process.env.COMPONENT_NAME || 'r1-servicecatalogmanagement';
const metricName    = componentName.replace(/-/g, '_');
const register      = new client.Registry();

const counter = new client.Counter({
  name: metricName + '_api_counter',
  help: 'Count of API calls for ' + componentName,
  registers: [register]
});

const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.post('/listener', function(req, res, next) {
  counter.inc();
  res.send(201, req.body);
  return next();
});

server.get('/' + componentName + '/metrics', async function(req, res) {
  res.setHeader('Content-Type', register.contentType);
  res.sendRaw(200, await register.metrics());
});

server.listen(4000, function() {
  console.log('Metrics server listening on port 4000');
});
