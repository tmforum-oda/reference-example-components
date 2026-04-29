const mongoUtils = require('../utils/mongoUtils');
const swaggerUtils = require('../utils/swaggerUtils');
const {getResponseType} = require('../utils/swaggerUtils');
const {sendDoc} = require('../utils/mongoUtils');
const {cleanPayloadServiceType} = require('../utils/swaggerUtils');
const {TError, TErrorEnum, sendError} = require('../utils/errorUtils');


/**
 * This provides the list operation for any supported resource.
 * It queries resources from the local MongoDB only (no downstream API federation).
 * @param {*} req - The request object
 * @param {*} res - The response object
 * @returns The list of resources using the SendDoc function
 * @throws {TError} - If an error is encountered
 */
  
async function listResource(req, res) {
  /* matching isRestfulIndex */
 
  var query = mongoUtils.getMongoQuery(req);

  query = swaggerUtils.updateQueryServiceType(query, req,'');

  const resourceType = getResponseType(req);

  const internalError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
  
  const generateQueryString = function(query,offset,limit) {
    var res='';
    var first=true;
    if(query.options.projection) {
      const fields=Object.keys(query.options.projection);
      res = res + '?fields=' + fields.join(',');
      first=false;
    }
    
    const delim = first ? '?' : '&';
    res = res + delim + "offset="+offset;
  
    if(query.options.limit) {
      const delim = first ? '?' : '&';
      res = res + delim + "limit="+limit;
    }

    return res;
  }

  const generateLink = function(query,skip,limit,type) {
    const basePath = req.url.replace(/\?.*$/,"");
    const hostPath = swaggerUtils.getURLScheme() + "://" + req.headers.host + basePath;
    return '"<' + hostPath + generateQueryString(query,skip,limit) + '>; rel="' + type + '"';
  }

  const setLinks = function(res,query,skip,limit,totalSize) {
    const links = [];
    links.push(generateLink(query,skip,limit,"self"));
    if(skip > 0) {
      const prevSkip = Math.max(skip-limit,0);
      links.push(generateLink(query,prevSkip,limit,"prev"));
    }
    if(skip+limit < totalSize) {
      links.push(generateLink(query,skip+limit,limit,"next"));
    }
    res.setHeader('Link', links.join(', '));
  }

  try {
    const db = await mongoUtils.connect();
    const skip = query.options.skip || 0;
    const limit = query.options.limit || 0;

    const totalSize = await db.collection(resourceType).countDocuments(query.criteria);
    setLinks(res, query, skip, limit, totalSize);
    res.setHeader('X-Total-Count', totalSize);

    const docs = await db.collection(resourceType).find(query.criteria, query.options).toArray();
    const cleanedDocs = docs.map(doc => cleanPayloadServiceType(doc));
    sendDoc(res, 200, cleanedDocs);

  } catch(error) {
    console.log("listResource: error=" + error);
    sendError(res, internalError);
  }
}

module.exports = { listResource };
