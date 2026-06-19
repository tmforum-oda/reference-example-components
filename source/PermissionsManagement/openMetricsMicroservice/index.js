const express = require('express');
const server = express();
server.use(express.json());      
var componentName = process.env.COMPONENT_NAME; 
if (!componentName) {
  componentName = 'productcatalog'
}
console.log('ComponentName:' + componentName);

const client = require('prom-client');
const metricName = componentName.replace(/-/g, '_');
const counter = new client.Counter({
  name: metricName + '_api_counter',
  help: 'Count of Notification Events from ' + componentName + ' API',
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
    const eventType = req.body.eventType
    counter.inc({ NotificationEvent: eventType })

    res.send({success:true})
  })
const port = process.env.PORT || 4000;
console.log(
	`Server listening to ${port}, metrics exposed on /` + componentName + `/metrics endpoint. Listens for Open-API events on /listener (POST) endpoint.`,
);
server.listen(port);
