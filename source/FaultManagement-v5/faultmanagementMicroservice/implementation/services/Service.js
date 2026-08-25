'use strict';

const swaggerUtils = require('../utils/swaggerUtils');
const queryToMongo = require('query-to-mongo');
const logger = require('../logger');

const { processCommonAttributes, processMissingProperties, processExcludedInPost, replaceWithJavascriptTypes } = require('../utils/operationsUtils');
const { populateMandatoryAttributes } = require('../utils/conformanceUtils');
const { processAssignmentRules } = require('../utils/operations');
const { cleanPayloadServiceType, getResponseTypeFromUrl, getTypeOfProperty } = require('../utils/swaggerUtils');
const { internalError, notFoundError, missingBody } = require('../utils/errorUtils');
const { generateResponseHeaders } = require('../utils/responseHeaders');

const config = require('../config.js');
const { getTypeDefinition } = require('../utils/swaggerUtils');

const VALID_OPERATORS = ['gt', 'gte', 'lt', 'lte', 'eq', 'ne'];

var db;
var notify;

class Service {

  static setDB(plugin) {
    db = plugin;
  }

  static setNotifier(plugin) {
    notify = plugin;
  }

  static rejectResponse(error, code = 500) {
    code = error.statusCode || code;
    logger.debug('Service.rejectResponse: error= ' + error + ' code=' + code);
    return { error, code };
  }

  static successResponse(payload, code = 200, headerParams = undefined) {
    if (code == 204) payload = null;
    return { payload, code, headerParams };
  }

  static async index(args, context) {
    const resourceType = context.classname;
    const operationId = context.operationId;

    args = this.updateSortParameter(args, context.request.originalUrl);
    let query = this.getNewQuery(args, resourceType);
    query = this.addMandatoryFilterFields(query, resourceType);

    try {
      const resp = await db.findMany(resourceType, query);
      let doc = resp[0];
      const totalSize = resp[1];

      doc = cleanPayloadServiceType(doc);

      const responseHeaderParams = generateResponseHeaders(context, query, totalSize, doc.length);

      let code = 200;
      const limit = query?.options?.limit ? parseInt(query.options.limit) : 0;
      if (limit && limit > 0 && doc.length < totalSize) code = 206;

      if (notify) notify.publish(context, doc);

      return Service.successResponse(doc, code, responseHeaderParams);

    } catch (error) {
      throw Service.rejectResponse(error);
    }
  }

  static async remove(args, context) {
    const resourceType = context.classname;
    const id = this.getSingleKey(args, resourceType);
    const query = { id };

    try {
      await db.remove(resourceType, query);
      if (notify) notify.publish(context, {});
      return Service.successResponse({}, 204);
    } catch (error) {
      throw Service.rejectResponse(error);
    }
  }

  static async show(args, context) {
    const resourceType = context.classname;

    let query = this.getNewQuery(args, resourceType);
    query = this.addMandatoryFilterFields(query, resourceType);
    const id = this.getSingleKey(args, resourceType);
    query.criteria.id = id;

    let doc;
    try {
      doc = await db.findOne(resourceType, query);
    } catch (error) {
      throw Service.rejectResponse(error);
    }

    if (doc) {
      doc = cleanPayloadServiceType(doc);
      if (notify) notify.publish(context, doc);
      const responseHeader = doc?.href ? [{ Location: doc.href }] : [];
      return Service.successResponse(doc, 200, responseHeader);
    } else {
      throw Service.rejectResponse(notFoundError);
    }
  }

  //
  // create chain (v5):
  //   replaceWithJavascriptTypes → processCommonAttributes → processAssignmentRules
  //   → processMissingProperties → populateMandatoryAttributes → processExcludedInPost
  //   → db.create → cleanPayloadServiceType → successResponse(201)
  //
  // processCommonAttributes sets the mandatory response attributes (id, href, lastUpdate,
  // @type, @baseType, @schemaLocation) that the OpenAPI CTK requires.
  //
  static async create(args, context) {
    const resourceType = context.classname;
    const operationId = context.operationId;
    const url = context.request.url;
    const apiType = getResponseTypeFromUrl(url) || resourceType;

    var payload = args?.body || args;
    if (!payload) throw Service.rejectResponse(missingBody);

    try {
      payload = await replaceWithJavascriptTypes(apiType, payload, context.request);
      payload = await processCommonAttributes(apiType, payload, context.request);
      payload = await processAssignmentRules(operationId, payload);
      payload = await processMissingProperties(apiType, payload, context.request);
      payload = await populateMandatoryAttributes(apiType, payload, context.request);
      payload = await processExcludedInPost(apiType, payload, context.request);

      await db.create(resourceType, payload);

      payload = cleanPayloadServiceType(payload, apiType, args);

      if (notify) notify.publish(context, payload);

      return Service.successResponse(payload, 201);

    } catch (error) {
      logger.debug('create:: resourceType=' + resourceType + ': error=' + error);
      throw Service.rejectResponse(error);
    }
  }

  //
  // patch: db.patch handles old→merge→updateOne internally.
  // Do NOT call processCommonAttributes or processAssignmentRules — create-only.
  //
  static async patch(args, context) {
    const resourceType = context.classname;
    const payload = args?.payload || args?.body;
    const id = this.getSingleKey(args, resourceType);
    const query = { id };

    if (!payload || Object.keys(payload).length == 0) {
      return Service.successResponse(payload, 204);
    }

    try {
      let doc = await db.patch(resourceType, query, payload);
      doc = cleanPayloadServiceType(doc);
      if (notify) notify.publish(context, doc);
      const responseHeader = doc?.href ? [{ Location: doc.href }] : [];
      return Service.successResponse(doc, 200, responseHeader);
    } catch (error) {
      throw Service.rejectResponse(error);
    }
  }

  static async serve(args, context) {
    try {
      const operation = context.method.toUpperCase();

      switch (operation) {
        case 'POST':
          return this.create(args, context);
        case 'DELETE':
          return this.remove(args, context);
        case 'GET':
          if (context.operationId.startsWith('list'))
            return this.index(args, context);
          else
            return this.show(args, context);
        case 'PATCH':
          return this.patch(args, context);
        case 'PUT':
          return this.patch(args, context);
      }
    } catch (e) {
      if (e?.code && e?.error) throw e;
      throw Service.rejectResponse(e);
    }

    throw Service.rejectResponse(internalError);
  }

  static getSingleKey(obj, resourceType) {
    let typedef = getTypeDefinition(resourceType);
    typedef = typedef?.properties || typedef;

    var res = null;
    if (obj.hasOwnProperty('id')) {
      res = obj.id;
    } else if (typeof obj === 'object') {
      res = obj[Object.keys(obj)[0]];
    }

    if (typedef?.id && typedef.id?.type == 'integer') {
      res = parseInt(res);
    }

    return res;
  }

  static getNewQuery(args, resourceType) {
    const filter = args?.filter;
    if (filter) delete args.filter;

    const sorting = args?.sort;
    if (sorting) delete args.sort;

    const queryString = this.getQueryString(args);
    let query = this.getQuery(queryString, resourceType);

    if (filter) query.jsonpath = filter;
    if (sorting) query.sorting = this.getSorting(sorting);

    const system_query_limit = config.QUERY_LIMIT || 250;

    if (query?.options?.limit) {
      query.options.limit = Math.min(query.options.limit, system_query_limit);
    } else {
      query.options = query.options || {};
      query.options.limit = system_query_limit;
    }

    return query;
  }

  static getSorting(sorting) {
    let res = {};
    sorting.split(',').forEach(field => {
      const direction = field?.[0];
      const key = field.replace('+', '').replace('-', '');
      res[key] = direction === '-' ? -1 : 1;
    });
    return res;
  }

  static getQueryString(args) {
    const nonQueryParams = config?.NOT_QUERY_PARAMS || ['body', '_dynamic_params', 'dynamic'];

    const nonDynamic = Object.keys(args || {})
      .filter(p => !nonQueryParams.includes(p))
      .filter(p => args[p])
      .map(p => p + '=' + args[p]);

    const dynamic = Object.keys(args?.dynamic || {})
      .filter(p => args.dynamic[p])
      .map(p => p + '=' + args.dynamic[p]);

    return [...nonDynamic, ...dynamic].join('&');
  }

  static convertPostfixOperators(query) {
    const criteria = query?.criteria;
    if (criteria) {
      Object.keys(criteria).forEach(key => {
        const parts = key.split('.');
        if (parts.length > 1) {
          let op = parts.pop();
          if (VALID_OPERATORS.includes(op)) {
            const newKey = parts.join('.');
            criteria[newKey] = { ['$' + op]: criteria[key] };
            delete criteria[key];
          }
        }
      });
    }
    return query;
  }

  static convertDate(arg) {
    if (arg instanceof Date) return arg;
    else if (typeof arg !== 'string') {
      const key = Object.keys(arg)[0];
      const res = {};
      res[key] = new Date(arg[key]);
      return res;
    } else {
      return new Date(arg);
    }
  }

  static convertSchemaTypes(query, resourceType) {
    if (!resourceType) return query;
    const criteria = query?.criteria;
    if (criteria) {
      Object.keys(criteria).forEach(key => {
        const typeOfArg = getTypeOfProperty(resourceType, key);
        const isDate = typeOfArg?.format === 'date-time';
        if (isDate) criteria[key] = this.convertDate(criteria[key]);
      });
    }
    return query;
  }

  static getQuery(arg, resourceType) {
    var res = {};
    if (typeof arg === 'string' && arg) {
      res = queryToMongo(arg);
      const fields = res.options.fields || {};
      delete res.options.fields;
      res.options.projection = fields;
    } else {
      res.criteria = {};
      res.options = {};
    }

    res = this.convertPostfixOperators(res);
    if (resourceType) res = this.convertSchemaTypes(res, resourceType);
    return res;
  }

  static addMandatoryFilterFields(query, resourceType) {
    let projection = query?.options?.projection;
    if (projection && Object.keys(projection).length > 0) {
      let required = {};
      const typedefinition = getTypeDefinition(resourceType);
      typedefinition?.required?.forEach(prop => { required[prop] = 1; });

      if (Object.keys(projection).includes('none')) {
        // ?fields=none: return only the bare mandatory set, nothing else.
        query.options.projection = { ...config.DEFAULT_FILTERING_FIELDS, ...required };
        return query;
      }

      // query-to-mongo 0.9 treats '!field' as a literal key rather than an exclusion.
      // Split into real inclusions and !-prefixed exclusions, then rebuild:
      // pure-exclusion mode uses a MongoDB exclusion projection (no mixing allowed);
      // inclusion mode merges with default/required fields.
      const exclusions = {};
      const inclusions = {};
      Object.keys(projection).forEach(k => {
        if (k.startsWith('!')) {
          exclusions[k.slice(1)] = 0;
        } else {
          inclusions[k] = projection[k];
        }
      });

      if (Object.keys(inclusions).length === 0) {
        query.options.projection = exclusions;
      } else {
        query.options.projection = { ...inclusions, ...config.DEFAULT_FILTERING_FIELDS, ...required };
      }
    }
    return query;
  }

  static updateSortParameter(args, originalUrl) {
    const start = originalUrl?.indexOf('?') || -1;
    if (start >= 0) {
      const queryString = originalUrl?.substring(start)?.replace('?', '') || '';
      let sort = queryString.split('&').filter(p => p.startsWith('sort'));
      sort = sort?.[0]?.split('=')?.[1];
      if (sort) args.sort = sort;
    }
    return args;
  }
}

module.exports = Service;
