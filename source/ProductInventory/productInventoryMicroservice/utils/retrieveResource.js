const mongoUtils = require('../utils/mongoUtils');
const swaggerUtils = require('../utils/swaggerUtils');
const {getResponseType} = require('../utils/swaggerUtils');
const {sendDoc} = require('../utils/mongoUtils');
const {cleanPayloadServiceType} = require('../utils/swaggerUtils');
const {TError, TErrorEnum, sendError} = require('../utils/errorUtils');


/**
 * This provides the retrieve operation for any supported resource.
 * It queries resources from the local MongoDB only (no downstream API federation).
 * @param {*} req - The request object
 * @param {*} res - The response object
 * @returns The resource using the SendDoc function
 * @throws {TError} - If an error is encountered
 */
  
async function retrieveResource(req, res) {

  /* matching isRestfulShow */

  var id = String(req.swagger.params.id.value);

  var query = mongoUtils.getMongoQuery(req);
  query.criteria.id = id

  query = swaggerUtils.updateQueryServiceType(query, req,'id');

  const resourceType = getResponseType(req); 

  const internalError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

  try {
    const db = await mongoUtils.connect();
    const doc = await db.collection(resourceType).findOne(query.criteria, query.options);

    if (doc) {
      const cleanedDoc = cleanPayloadServiceType(doc);
      sendDoc(res, 200, cleanedDoc);
    } else {
      sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, "No resource with given id found"));
    }
  } catch(error) {
    console.log("retrieveResource: error=" + error);
    sendError(res, internalError);
  }
}

module.exports = { retrieveResource };
