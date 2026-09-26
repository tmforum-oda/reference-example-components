'use strict';

/**
 * Unit tests for notificationUtils – focussing on idempotency of register (POST /hub).
 *
 * All external dependencies (MongoDB, swaggerUtils, etc.) are fully mocked so that
 * no running services are required.
 */

// ---------------------------------------------------------------------------
// Helpers / mocks
// ---------------------------------------------------------------------------

function makeMockCollection({ existingDoc = null } = {}) {
  return {
    _inserted: [],
    findOne: jest.fn().mockResolvedValue(existingDoc),
    insertOne: jest.fn().mockImplementation(function (doc) {
      this._inserted.push(doc);
      return Promise.resolve({ insertedId: 'mock-oid' });
    }),
    find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
    deleteOne: jest.fn().mockResolvedValue({ result: { n: 1 } }),
  };
}

function makeMockDb(collection) {
  return { collection: jest.fn().mockReturnValue(collection) };
}

// ---------------------------------------------------------------------------
// Jest mocks – declared before require() of the module under test
// ---------------------------------------------------------------------------

jest.mock('../utils/swaggerUtils', () => ({
  getPayload: jest.fn(),
  getResponseType: jest.fn().mockReturnValue('TMF669EventSubscription'),
  getPayloadSchema: jest.fn().mockReturnValue({}),
  getRequestServiceType: jest.fn().mockReturnValue('EventSubscription'),
  updateQueryServiceType: jest.fn(),
  updatePayloadServiceType: jest.fn(),
  cleanPayloadServiceType: jest.fn(),
}));

jest.mock('../utils/operationsUtils', () => ({
  traverse: jest.fn().mockImplementation((req, schema, payload) => Promise.resolve(payload)),
  processCommonAttributes: jest.fn().mockImplementation((req, type, payload) => Promise.resolve(payload)),
  addHref: jest.fn(),
  setBaseProperties: jest.fn(),
}));

jest.mock('../utils/operations', () => ({
  processAssignmentRulesByType: jest.fn().mockImplementation((req, type, payload) => Promise.resolve(payload)),
}));

jest.mock('../utils/errorUtils', () => ({
  TError: jest.fn().mockImplementation((code, msg) => ({ code, message: msg })),
  TErrorEnum: {
    INTERNAL_SERVER_ERROR: 500,
    RESOURCE_NOT_FOUND: 404,
    MISSING_BODY_FIELD: 400,
  },
  sendError: jest.fn(),
}));

jest.mock('../utils/mongoUtils', () => ({
  connect: jest.fn(),
  getMongoQuery: jest.fn().mockReturnValue({ criteria: {}, options: {} }),
  sendDoc: jest.fn(),
}));

const mongoUtils = require('../utils/mongoUtils');
const swaggerUtils = require('../utils/swaggerUtils');

// sendDoc helper is on mongoUtils in TMF669
const { sendDoc } = mongoUtils;

// ---------------------------------------------------------------------------
// Bring in the module under test AFTER all mocks are in place
// ---------------------------------------------------------------------------
const notificationUtils = require('./notificationUtils');

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const callbackUrl = 'http://example.com/notify';
const queryFilter = 'eventType=PartyRoleCreateNotification';

/** Build a minimal mock request that matches the TMF669 URL pattern */
function makeReq(payload) {
  return {
    method: 'POST',
    url: '/tmf-api/partyRoleManagement/v4/hub',
    headers: { host: 'localhost' },
    swagger: {
      operationPath: ['paths', '/hub', 'post'],
      params: {},
    },
    // Simulate swaggerUtils.getPayload resolving with the given payload
    _mockPayload: payload,
  };
}

/** Minimal mock HTTP response object */
function makeRes() {
  return {
    statusCode: null,
    body: null,
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('notificationUtils.register – idempotency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Wire up swaggerUtils.getPayload to resolve with the request's _mockPayload
   * so the register flow receives a usable payload.
   */
  function setupPayload(req) {
    swaggerUtils.getPayload.mockResolvedValue(req._mockPayload);
  }

  it('creates a new subscription when none exists', async () => {
    const payload = { callback: callbackUrl, query: queryFilter };
    const req = makeReq(payload);
    const res = makeRes();
    setupPayload(req);

    const collection = makeMockCollection({ existingDoc: null });
    mongoUtils.connect.mockResolvedValue(makeMockDb(collection));

    await new Promise(resolve => {
      sendDoc.mockImplementation(() => resolve());
      notificationUtils.register(req, res, () => {});
    });

    // A new document should have been inserted
    expect(collection.insertOne).toHaveBeenCalledTimes(1);
    // sendDoc should have been called with status 201
    expect(sendDoc).toHaveBeenCalledWith(res, 201, expect.objectContaining({ callback: callbackUrl }));
  });

  it('returns the existing subscription without inserting when a duplicate exists', async () => {
    const payload = { callback: callbackUrl, query: queryFilter };
    const req = makeReq(payload);
    const res = makeRes();
    setupPayload(req);

    const existingDoc = {
      id: 'existing-hub-id',
      callback: callbackUrl,
      query: queryFilter,
      _serviceGroup: 'partyRoleManagement/v4',
      _query: '{}',
    };
    const collection = makeMockCollection({ existingDoc });
    mongoUtils.connect.mockResolvedValue(makeMockDb(collection));

    await new Promise(resolve => {
      sendDoc.mockImplementation(() => resolve());
      notificationUtils.register(req, res, () => {});
    });

    // insertOne must NOT have been called – we returned the existing record
    expect(collection.insertOne).not.toHaveBeenCalled();
    // sendDoc must have been called with the existing subscription id
    expect(sendDoc).toHaveBeenCalledWith(res, 201, expect.objectContaining({ id: 'existing-hub-id' }));
  });

  it('strips internal (_-prefixed) fields from the returned existing subscription', async () => {
    const payload = { callback: callbackUrl, query: '' };
    const req = makeReq(payload);
    const res = makeRes();
    setupPayload(req);

    const existingDoc = {
      id: 'hub-abc',
      callback: callbackUrl,
      query: '',
      _serviceGroup: 'partyRoleManagement/v4',
      _query: '{"criteria":{},"options":{}}',
    };
    const collection = makeMockCollection({ existingDoc });
    mongoUtils.connect.mockResolvedValue(makeMockDb(collection));

    let capturedDoc;
    await new Promise(resolve => {
      sendDoc.mockImplementation((res, status, doc) => {
        capturedDoc = doc;
        resolve();
      });
      notificationUtils.register(req, res, () => {});
    });

    // The document sent to the client must not contain any _ fields
    expect(Object.keys(capturedDoc).every(k => !k.startsWith('_'))).toBe(true);
  });
});
