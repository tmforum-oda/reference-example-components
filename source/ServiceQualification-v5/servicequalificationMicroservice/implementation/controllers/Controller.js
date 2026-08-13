'use strict';

const logger = require('../logger');

class Controller {
  static sendResponse(response, payload) {
    response.status(payload.code || 200);

    const headers = payload.headerParams;
    if (headers) {
      headers.forEach((item) => {
        const key = Object.keys(item)[0];
        const val = item[key];
        response.setHeader(key, val);
      });
    }

    // Success responses from Service.successResponse() have { payload, code, headerParams }.
    // Error responses from Service.rejectResponse() have { error, code } with no payload key.
    // Unwrap errors so the TError body (with @type) is sent directly, not wrapped in an outer object.
    let responsePayload;
    if ('payload' in payload) {
      responsePayload = payload.payload;
    } else if (payload.error !== undefined) {
      responsePayload = payload.error;
    } else {
      responsePayload = payload;
    }

    if (responsePayload == null || payload?.code == 204) {
      response.end();
    } else if (responsePayload instanceof Object) {
      response.json(responsePayload);
    } else {
      response.end(responsePayload);
    }
  }

  static sendError(response, error) {
    try {
      logger.debug('sendError: error=' + JSON.stringify(error, null, 2));

      if (error?.error) error = error.error;

      if (error?.statusCode) {
        response.status(error.statusCode);
      } else {
        response.status(500);
      }

      if (error instanceof Object) {
        response.json(error);
      } else {
        response.end(error?.message || '');
      }
    } catch (e) {
      logger.info('sendError: catch error=' + e);
    }
  }

  static collectRequestParams(request) {
    const requestParams = {};

    try {
      if (request.openapi.schema.requestBody) {
        requestParams.body = request.body;
      }
      if (request.openapi.schema.parameters) {
        request.openapi.schema.parameters.forEach((param) => {
          if (param.in === 'path') {
            requestParams[param.name] = request.openapi.pathParams[param.name];
          } else if (param.in === 'query') {
            requestParams[param.name] = request.query[param.name];
          }
        });
      }

      // When validateRequests: false, schema.parameters may contain unresolved $ref objects
      // (param.in is undefined), so path params won't be extracted above. Always merge
      // pathParams directly since the metadata middleware populates them regardless.
      if (request.openapi.pathParams) {
        Object.keys(request.openapi.pathParams).forEach(key => {
          if (requestParams[key] === undefined) {
            requestParams[key] = request.openapi.pathParams[key];
          }
        });
      }

      // add other query params to dynamic element
      if (request.query) {
        Object.keys(request.query).forEach((param) => {
          if (!requestParams[param]) {
            if (!requestParams.dynamic) requestParams.dynamic = {};
            requestParams.dynamic[param] = request.query[param];
          }
        });
      }
    } catch (e) {
      logger.debug('collectRequestParams: exception=' + e);
    }

    return requestParams;
  }

  static async handleRequest(request, response, serviceOperation) {
    logger.debug('Controller::handleRequest: serviceOperation=' + serviceOperation);

    try {
      const context = { request };
      const serviceResponse = await serviceOperation(this.collectRequestParams(request), context);
      Controller.sendResponse(response, serviceResponse);
    } catch (error) {
      logger.info('handleRequest:: error=' + JSON.stringify(error, null, 2));
      Controller.sendError(response, error);
    }
  }
}

module.exports = Controller;
