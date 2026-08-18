'use strict';

const assert = require('assert');
const Service = require('../services/Service');
const ProductService = require('../services/ProductService');


async function testRetrievePreservesStructuredNotFound() {
  const originalServe = Service.serve;
  Service.serve = async () => {
    throw {
      error: {
        code: '60',
        reason: 'Not found',
        message: 'Resource not found',
        statusCode: 404,
      },
      code: 404,
    };
  };

  try {
    const result = await ProductService.retrieveProduct(
      { id: 'missing-id' },
      { request: { originalUrl: '/product/missing-id' } },
    );
    assert.strictEqual(result.code, 404);
    assert.strictEqual(result.error.code, '60');
  } finally {
    Service.serve = originalServe;
  }
}


testRetrievePreservesStructuredNotFound()
  .then(() => console.log('product-service-errors: ok'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
