'use strict';

const TErrorEnum = {
  INTERNAL_SERVER_ERROR: '1',
  UNPROCESSABLE_ENTITY: '2',

  INVALID_URL_PARAMETER_VALUE: '20',
  MISSING_BODY: '21',
  INVALID_BODY: '22',
  MISSING_BODY_FIELD: '23',
  INVALID_BODY_FIELD: '24',
  MISSING_HEADER: '25',
  INVALID_HEADER_VALUE: '26',
  MISSING_QUERY_STRING_PARAMETER: '27',
  INVALID_QUERY_STRING_PARAMETER_VALUE: '28',

  MISSING_CREDENTIALS: '40',
  INVALID_CREDENTIALS: '41',
  EXPIRED_CREDENTIALS: '42',

  ACCESS_DENIED: '50',
  FORBIDDEN_REQUESTER: '51',
  FORBIDDEN_USER: '52',
  TOO_MANY_REQUESTS: '53',

  RESOURCE_NOT_FOUND: '60',
  METHOD_NOT_ALLOWED: '61',

  properties: {
    '1':  { statusCode: 500, name: 'Internal Server Error' },
    '2':  { statusCode: 422, name: 'Unprocessable entity' },
    '20': { statusCode: 400, name: 'Invalid URL parameter value' },
    '21': { statusCode: 400, name: 'Missing body' },
    '22': { statusCode: 400, name: 'Invalid body' },
    '23': { statusCode: 400, name: 'Missing body field' },
    '24': { statusCode: 400, name: 'Invalid body field' },
    '25': { statusCode: 400, name: 'Missing header' },
    '26': { statusCode: 400, name: 'Invalid header value' },
    '27': { statusCode: 400, name: 'Missing query-string parameter' },
    '28': { statusCode: 400, name: 'Invalid query-string parameter value' },
    '40': { statusCode: 401, name: 'Missing credentials' },
    '41': { statusCode: 401, name: 'Invalid credentials' },
    '42': { statusCode: 401, name: 'Expired credentials' },
    '50': { statusCode: 403, name: 'Access denied' },
    '51': { statusCode: 403, name: 'Forbidden requester' },
    '52': { statusCode: 403, name: 'Forbidden user' },
    '53': { statusCode: 429, name: 'Too many requests' },
    '60': { statusCode: 404, name: 'Resource not found' },
    '61': { statusCode: 405, name: 'Method not allowed' },
  }
};

class TError {
  constructor(code, reason, req) {
    this.req = req;
    this.code = code;
    this.reason = reason;
    this.message = getMessage(code);
  }

  get statusCode() {
    if (this.code && TErrorEnum.properties[this.code]) {
      return TErrorEnum.properties[this.code].statusCode || 500;
    }
    return 500;
  }

  toString() {
    return this.reason + ' ' + JSON.stringify(this.message);
  }
}

function getMessage(code) {
  if (code && TErrorEnum.properties[code]) {
    return TErrorEnum.properties[code].name;
  }
  return TErrorEnum.properties[TErrorEnum.INTERNAL_SERVER_ERROR].name;
}

const internalError      = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, 'Internal database error');
const notFoundError      = new TError(TErrorEnum.RESOURCE_NOT_FOUND, 'Not found');
const notImplemented     = new TError(TErrorEnum.UNPROCESSABLE_ENTITY, 'Not implemented');
const missingBody        = new TError(TErrorEnum.MISSING_BODY, 'Empty or missing payload (body)');
const accessDenied       = new TError(TErrorEnum.ACCESS_DENIED, 'Access denied for user');

module.exports = {
  TError,
  TErrorEnum,
  internalError,
  notFoundError,
  notImplemented,
  missingBody,
  accessDenied
};
