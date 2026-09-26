const retrieveFromDownstreamAPI = require('../utils/downstreamAPI').retrieveFromDownstreamAPI;

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
    let doc = await db.collection(resourceType).findOne(query.criteria, query.options);



    if (doc) {
      const cleanedDoc = cleanPayloadServiceType(doc);
      sendDoc(res, 200, cleanedDoc);
    } else {

      // query downstream APIs for this resource
      const apiError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal error calling downstream API");
      try {
        doc = await retrieveFromDownstreamAPI(resourceType, id)
        if (doc) {
          const cleanedDoc = cleanPayloadServiceType(doc);
          sendDoc(res, 200, cleanedDoc);
        } else {
          sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, "No resource with given id found"));
        }

      } catch (error) {
        console.log("retrieveResource: downstream API error=" + error);
        sendError(res, apiError);
      }

      
    }
  } catch (error) {
    console.log("retrieveResource: error=" + error);
    sendError(res, internalError);
  }

}

module.exports = { retrieveResource };
