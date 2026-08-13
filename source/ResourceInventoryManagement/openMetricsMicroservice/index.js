const express = require('express');
const server = express();
server.use(express.json());      
var componentName = process.env.COMPONENT_NAME; 
if (!componentName) {
  componentName = 'serviceinventory'
}
console.log('ComponentName:'+componentName);

const client = require('prom-client');
const counter = new client.Counter({
  name: 'service_inventory_api_counter',
  help: 'Count of Notification Events from TMF 638 Service Inventory Management API',
  labelNames: ['NotificationEvent']
});

server.get('/' + componentName + '/', async function(req, res) {
    res.send('Microservice to report prometheus metrics from ODA Components. Go to /metrics to see the metrics')
  })
server.get('/' + componentName + '/metrics', async function(req, res) {
    res.set('Content-Type', client.register.contentType);
    const metrics = await client.register.metrics()
    res.send(metrics)
  })
server.post('/listener', async function(req, res) {
    console.log(req.body)
    const notificationEvent = req.body.eventType;
    console.log('Received event: ' + notificationEvent)
    counter.inc({NotificationEvent: notificationEvent});
    res.sendStatus(200)
  })

server.listen(4000, () => console.log(`Metrics server running on port 4000`))
