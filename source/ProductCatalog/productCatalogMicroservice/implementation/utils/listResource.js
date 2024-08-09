const listFromDownstreamAPI = require('../utils/downstreamAPI').listFromDownstreamAPI;

const mongoUtils = require('../utils/mongoUtils');
const swaggerUtils = require('../utils/swaggerUtils');
const {getResponseType} = require('../utils/swaggerUtils');
const {sendDoc} = require('../utils/mongoUtils');
const {cleanPayloadServiceType} = require('../utils/swaggerUtils');
const {TError, TErrorEnum, sendError} = require('../utils/errorUtils');


/**
 * This provides the list operation for any supported resource.
 * It queries resources from the Mongo databasze and appends the results from downstream APIs.
 * @param {*} req - The request object
 * @param {*} res - The response object
 * @returns The list of resources using the SendDoc function
 * @throws {TError} - If an error is encountered
 * @throws {Error} - If an error is encountered
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
    if(limit) {
      if(skip+limit<totalSize) {
        if(skip+2*limit<totalSize) {
          links.push(generateLink(query,skip+limit,limit,"next"));
        } else {
          links.push(generateLink(query,skip+limit,totalSize-skip-limit,"next"));
        }
        links.push(generateLink(query,totalSize-limit,limit,"last"));
      } 
      if(skip-limit>0) {
        links.push(generateLink(query,skip-limit,limit,"prev"));
      } else if(skip>0) {
        links.push(generateLink(query,0,skip,"prev"));
      }
    }
    res.setHeader('Link',links.join(', '));
  }

  let doc = [];
  let totalSize=0;
  // Find some documents based on criteria plus attribute selection
  try {
    const db = await mongoUtils.connect()
    const stats = await db.collection(resourceType).stats()
    totalSize=stats.count;
    doc = await db.collection(resourceType).find(query.criteria, query.options).toArray();
  } catch (error) {
    console.log("listResource: error=" + error);
    sendError(res, internalError);
  }


  // Call downstream product catalogs and append the results
  const apiError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal error calling downstream API");
  try {
    doc = await listFromDownstreamAPI(doc, req.url)
    // Assuming the API response data needs to be appended to the doc
    doc = cleanPayloadServiceType(doc);
    res.setHeader('X-Total-Count',totalSize);
    res.setHeader('X-Result-Count',doc.length);
    var skip = query.options.skip!==undefined ? parseInt(query.options.skip) : 0;
    var limit;
    if(query.options.limit!==undefined) limit = parseInt(query.options.limit);        
    if(limit || skip>0) setLinks(res,query,skip,limit,totalSize);

    var code = 200;
    if(limit && doc.length<totalSize) code=206;
    sendDoc(res, code, doc);
  } catch (error) {
  console.log("listResource: downstream API error=" + error);
    sendError(res, apiError);
  }
}

module.exports = { listResource };
