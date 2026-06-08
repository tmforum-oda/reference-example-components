'use strict';

const MongoClient = require('mongodb').MongoClient;

// Configuration
const POLL_INTERVAL = 5000; // 5 seconds
const PROCESSING_TIME = 10000; // 10 seconds
const COLLECTION_NAME = 'productorder';

let mongodb = null;

/**
 * Connect to MongoDB
 */
async function connectToMongoDB() {
  const database = process.env.MONGODB_DATABASE || 'tmf';
  const host = process.env.MONGODB_HOST || 'localhost';
  const port = process.env.MONGODB_PORT || '27017';
  const credentials_uri = `mongodb://${host}:${port}/${database}`;
  
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
  };

  try {
    const client = await MongoClient.connect(credentials_uri, options);
    mongodb = client.db(database);
    console.log(`Connected to MongoDB at ${credentials_uri}`);
    return mongodb;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    throw err;
  }
}

/**
 * Process a single order
 * Uses findOneAndUpdate with atomic operation to prevent duplicate processing
 * across multiple replicas
 */
async function processNextOrder() {
  try {
    const collection = mongodb.collection(COLLECTION_NAME);
    
    // Atomically find and update the oldest acknowledged order to inProgress
    // This ensures only one replica processes each order
    const result = await collection.findOneAndUpdate(
      { 
        state: 'acknowledged'
      },
      { 
        $set: { 
          state: 'inProgress',
          processingStartedAt: new Date(),
          processorId: process.env.HOSTNAME || 'unknown'
        }
      },
      { 
        sort: { orderDate: 1 }, // Sort by orderDate ascending (oldest first)
        returnOriginal: false
      }
    );

    // If no order was found, just return
    if (!result.value) {
      console.log('No acknowledged orders found to process');
      return;
    }

    const order = result.value;
    console.log(`Started processing order: ${order.id} (orderDate: ${order.orderDate})`);
    
    // Simulate processing time with fake business logic
    await simulateOrderProcessing(order);
    
    // Update order to completed state
    await collection.updateOne(
      { id: order.id },
      { 
        $set: { 
          state: 'completed',
          completionDate: new Date(),
          processingEndedAt: new Date()
        }
      }
    );
    
    console.log(`Completed processing order: ${order.id}`);
    
  } catch (err) {
    console.error('Error processing order:', err);
  }
}

/**
 * Simulate order processing with fake business logic
 * Takes approximately 10 seconds to complete
 */
async function simulateOrderProcessing(order) {
  // Fake processing logic
  console.log(`  Processing order ${order.id}...`);
  console.log(`  - Order items: ${order.productOrderItem ? order.productOrderItem.length : 0}`);
  console.log(`  - Customer: ${order.relatedParty ? order.relatedParty[0]?.name || 'Unknown' : 'Unknown'}`);
  
  // Simulate processing steps
  const steps = [
    'Validating order details',
    'Checking inventory availability',
    'Allocating resources',
    'Scheduling provisioning',
    'Notifying fulfillment systems',
    'Updating order records'
  ];
  
  const stepDuration = PROCESSING_TIME / steps.length;
  
  for (let i = 0; i < steps.length; i++) {
    await sleep(stepDuration);
    console.log(`  [${i + 1}/${steps.length}] ${steps[i]}...`);
  }
}

/**
 * Sleep utility function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main processing loop
 */
async function startProcessingLoop() {
  console.log('Starting Product Order Processor...');
  console.log(`Processor ID: ${process.env.HOSTNAME || 'unknown'}`);
  console.log(`Poll interval: ${POLL_INTERVAL}ms`);
  console.log(`Processing time: ${PROCESSING_TIME}ms`);
  
  while (true) {
    try {
      await processNextOrder();
    } catch (err) {
      console.error('Error in processing loop:', err);
    }
    
    // Wait before next poll
    await sleep(POLL_INTERVAL);
  }
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    if (mongodb) {
      await mongodb.close();
      console.log('MongoDB connection closed');
    }
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Main entry point
 */
async function main() {
  try {
    await connectToMongoDB();
    setupGracefulShutdown();
    await startProcessingLoop();
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

// Start the processor
main();
