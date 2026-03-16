'use strict';

/**
 * Unit tests for EventsSubscriptionService – focussing on idempotency of createHub.
 *
 * MongoDB is fully mocked so no running database is required.
 */

// ---------------------------------------------------------------------------
// Helpers / mocks
// ---------------------------------------------------------------------------

// Build a mock MongoDB collection that tracks calls and can be configured per test.
function makeMockCollection({ existingDoc = null } = {}) {
  return {
    _inserted: [],
    findOne: jest.fn().mockResolvedValue(existingDoc),
    insertOne: jest.fn().mockImplementation(function (doc) {
      this._inserted.push(doc);
      return Promise.resolve({ insertedId: doc._id || 'mock-oid' });
    }),
  };
}

function makeMockDb(collection) {
  return { collection: jest.fn().mockReturnValue(collection) };
}

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const mockReq = { url: '/r1-productcatalogmanagement/rolesAndPermissionsManagement/v5/hub' };

const payload = { callback: 'http://example.com/callback', query: 'name=test' };

// ---------------------------------------------------------------------------
// Jest mocks – must be declared before require() of the module under test
// ---------------------------------------------------------------------------

jest.mock('../utils/mongoUtils', () => ({
  connect: jest.fn(),
  getMongoQuery: jest.fn().mockReturnValue({ criteria: {}, options: {} }),
}));

jest.mock('uuid', () => ({ v4: jest.fn().mockReturnValue('mock-uuid') }));

const mongoUtils = require('../utils/mongoUtils');
const EventsSubscriptionService = require('./EventsSubscriptionService');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EventsSubscriptionService.createHub – idempotency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new subscription when none exists', async () => {
    const collection = makeMockCollection({ existingDoc: null });
    mongoUtils.connect.mockResolvedValue(makeMockDb(collection));

    const result = await EventsSubscriptionService.createHub(mockReq, { ...payload });

    // insertOne must have been called exactly once
    expect(collection.insertOne).toHaveBeenCalledTimes(1);
    // The returned document must contain the generated id and callback
    expect(result.id).toBe('mock-uuid');
    expect(result.callback).toBe(payload.callback);
    // Internal (_-prefixed) fields must be stripped from the response
    expect(Object.keys(result).every(k => !k.startsWith('_'))).toBe(true);
  });

  it('returns the existing subscription without inserting when a duplicate exists', async () => {
    const existingDoc = {
      id: 'existing-id',
      callback: payload.callback,
      query: payload.query,
      _serviceGroup: 'r1-productcatalogmanagement/rolesAndPermissionsManagement/v5',
      _query: '{}',
    };

    const collection = makeMockCollection({ existingDoc });
    mongoUtils.connect.mockResolvedValue(makeMockDb(collection));

    const result = await EventsSubscriptionService.createHub(mockReq, { ...payload });

    // insertOne must NOT have been called – we returned the existing record
    expect(collection.insertOne).not.toHaveBeenCalled();
    // The returned id must match the existing subscription
    expect(result.id).toBe('existing-id');
    // Internal (_-prefixed) fields must be stripped from the response
    expect(Object.keys(result).every(k => !k.startsWith('_'))).toBe(true);
  });

  it('returns the same response for two identical POST /hub requests (end-to-end idempotency)', async () => {
    // First call – no existing subscription
    const collection1 = makeMockCollection({ existingDoc: null });
    mongoUtils.connect.mockResolvedValueOnce(makeMockDb(collection1));

    const firstResult = await EventsSubscriptionService.createHub(mockReq, { ...payload });
    expect(collection1.insertOne).toHaveBeenCalledTimes(1);

    // Second call – simulate the subscription now existing in the DB
    const storedDoc = {
      ...firstResult,
      _serviceGroup: 'r1-productcatalogmanagement/rolesAndPermissionsManagement/v5',
      _query: '{}',
    };
    const collection2 = makeMockCollection({ existingDoc: storedDoc });
    mongoUtils.connect.mockResolvedValueOnce(makeMockDb(collection2));

    const secondResult = await EventsSubscriptionService.createHub(mockReq, { ...payload });
    expect(collection2.insertOne).not.toHaveBeenCalled();

    // Both calls must yield the same subscription id
    expect(secondResult.id).toBe(firstResult.id);
  });

  it('rejects with 400 when no body is provided', async () => {
    await expect(EventsSubscriptionService.createHub(mockReq, null)).rejects.toMatchObject({
      code: 400,
    });
  });
});
