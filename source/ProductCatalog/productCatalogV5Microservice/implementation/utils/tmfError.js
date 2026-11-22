'use strict';

// TMF Error responses (TMF620 v5 Error schema: @type, code, reason required).

function tmfError(status, code, reason, message, extra) {
  const body = { '@type': 'Error', code, reason, status: String(status) };
  if (message) body.message = message;
  return Object.assign(body, extra || {});
}

function sendError(res, status, code, reason, message, extra) {
  res.status(status).type('application/json').send(tmfError(status, code, reason, message, extra));
}

// Turns an express-openapi-validator error into a TMF Error. The validator gives a
// list of {path, message}; they are joined so the client sees every problem at once.
function fromValidationError(err) {
  const status = err.status || 500;
  const details = (err.errors || [])
    .map(e => (e.path ? `${e.path.replace(/^\/body\/?/, '').replace(/\//g, '.') || 'body'}: ` : '') + e.message)
    .join('; ');
  const reasons = {
    400: 'Request does not match the TMF620 v5.0.0 API specification',
    404: 'Resource or operation not found',
    405: 'Method not allowed on this resource',
    415: 'Unsupported content type',
    500: 'Response does not match the TMF620 v5.0.0 API specification'
  };
  return {
    status,
    body: tmfError(status, `TMF620-V5-${status}`, reasons[status] || err.name || 'Error', details || err.message)
  };
}

module.exports = { tmfError, sendError, fromValidationError };
