const express = require('express');
const server = express();
server.use(express.json());
var componentName = process.env.COMPONENT_NAME || 'productusagemanagement';
const metricName = componentName.replace(/-/g, '_');
const client = require('prom-client');
const counter = new client.Counter({
  name: metricName + '_api_counter',
  help: 'Count of Notification Events from TMF635/TMF677 ProductUsageManagement',
  labelNames: ['NotificationEvent']
});

server.post('/listener', function(req, res) {
  const notificationEvent = req.body['@type'] || req.body.eventType || 'unknown';
  counter.inc({NotificationEvent: notificationEvent});
  res.status(204).send();
});

server.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

server.listen(4000, () => console.log('Metrics server listening on port 4000'));
