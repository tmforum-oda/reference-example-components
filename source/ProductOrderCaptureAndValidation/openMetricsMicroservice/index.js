const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const server = express();
server.use(express.json());      
var componentName = process.env.COMPONENT_NAME; 
if (!componentName) {
  componentName = 'productordercaptureandvalidation'
}
console.log('ComponentName:' + componentName);

// MongoDB connection configuration
const mongoHost = process.env.MONGODB_HOST || 'localhost';
const mongoPort = process.env.MONGODB_PORT || '27017';
const mongoDatabase = process.env.MONGODB_DATABASE || 'tmf';
const mongoUrl = `mongodb://${mongoHost}:${mongoPort}`;
console.log('MongoDB URL:' + mongoUrl);

let db = null;
let mongoClient = null;

// Connect to MongoDB
async function connectToMongo() {
  try {
    mongoClient = await MongoClient.connect(mongoUrl, { 
      useUnifiedTopology: true,
      useNewUrlParser: true 
    });
    db = mongoClient.db(mongoDatabase);
    console.log('Successfully connected to MongoDB');
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return false;
  }
}


const client = require('prom-client');
const metricName = componentName.replace(/-/g, '_');
const counter = new client.Counter({
  name: metricName + '_api_counter',
  help: 'Count of Notification Events from ' + componentName + ' API',
  labelNames: ['NotificationEvent']
});

// Gauge metric for pending orders
const pendingOrdersGauge = new client.Gauge({
  name: metricName + '_pending_orders',
  help: 'Number of product orders in acknowledged state (pending processing)',
  async collect() {
    if (db) {
      try {
        const count = await db.collection('ProductOrder').countDocuments({ state: 'acknowledged' });
        console.log("Pending orders:", count);
        this.set(count);
      } catch (error) {
        console.error('Error querying pending orders:', error);
        this.set(0);
      }
    } else {
      this.set(0);
    }
  }
});


// Gauge metric for completed orders
const completedOrdersGauge = new client.Gauge({
  name: metricName + '_completed_orders',
  help: 'Number of product orders in completed state (processing completed)',
  async collect() {
    if (db) {
      try {
        const count = await db.collection('ProductOrder').countDocuments({ state: 'completed' });
        console.log("completed orders:", count);
        this.set(count);
      } catch (error) {
        console.error('Error querying completed orders:', error);
        this.set(0);
      }
    } else {
      this.set(0);
    }
  }
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

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing MongoDB connection');
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
});

const port = process.env.PORT || 4000;

// Start server and connect to MongoDB with retry logic
async function start() {
  const maxRetries = 5;
  const retryDelayMs = 2000;
  let retries = maxRetries;
  let connected = false;
  
  console.log(`Attempting to connect to MongoDB (max ${maxRetries} retries)...`);
  
  while (retries > 0) {
    connected = await connectToMongo();
    if (connected) {
      console.log('MongoDB connection established successfully');
      break;
    }
    
    retries--;
    if (retries > 0) {
      console.log(`MongoDB connection failed. Retrying in ${retryDelayMs}ms... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
  }
  
  if (!connected) {
    console.warn('WARNING: Failed to connect to MongoDB after ' + maxRetries + ' attempts. Starting server anyway. Pending orders gauge will report 0 until connection is established.');
  }
  
  server.listen(port, () => {
    console.log(
      `Server listening to ${port}, metrics exposed on /` + componentName + `/metrics endpoint. Listens for Open-API events on /listener (POST) endpoint.`,
    );
  });
}

start();
