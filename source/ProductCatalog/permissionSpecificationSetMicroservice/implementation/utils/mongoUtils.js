'use strict';

const util = require('util')
const assert = require('assert');

const queryToMongo = require('query-to-mongo');
const querystring = require('querystring');

const MongoClient = require('mongodb').MongoClient;

const {getResponseType, getPayloadType, getTypeDefinition} = require('./swaggerUtils');

var mongodb = null;

/* connection helper for running MongoDb from url */
function connectHelper(callback) {
  const database = process.env.MONGODB_DATABASE;
  var credentials_uri = `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${database}`;
  // credentials_uri = "mongodb://127.0.0.1:27017/tmf"; // for local testing

  let options = {
    useNewUrlParser: true
  };
  MongoClient.connect(credentials_uri, options, function (err, db) {
    if (err) {
      mongodb = null;
      callback(err,null);
    } else {
      mongodb = db.db(database);
      callback(null,mongodb);
    }
  });
}

function getMongoQuery(req) {
  var res;
  if(req instanceof Object) {
    res = queryToMongo(req._parsedUrl.query);
  } else {
    res = queryToMongo(querystring.parse(req));
  }

  if(res!==undefined && res.options!==undefined && res.options.fields!==undefined) {
    res.options.fields.href = true;
    res.options.fields.id = true;
  }

  //test for date-time in query and allow partial equality matching
  try {
    const requestType = getPayloadType(req);
    const properties = Object.keys(res.criteria);

    var typeDefinition = getTypeDefinition(requestType);
    if(typeDefinition.properties!==undefined) {
      typeDefinition = typeDefinition.properties;
    }

    properties.forEach(prop => {
      var paramDef = typeDefinition[prop];
      if(paramDef!==undefined && paramDef.type === "string" && paramDef.format === "date-time") {
        const propVal = res.criteria[prop];
        if(!(propVal instanceof Object)) {
          if(!isNaN(Date.parse(propVal))) {
            res.criteria[prop] = {$regex: '^' + propVal + '.*' };
          }
        }
      }
    });
  }
  catch(err) {
    // ignore for now
  }

  res.options.projection = res.options.fields;
  delete res.options.fields;

  return(res);
}

function connectDb(callback) {
  if(mongodb) {
      mongodb.stats(function(err, stats) {
        if(stats != null) {
          callback(null,mongodb);
        } else {
          connectHelper(callback);
        }
      });
  } else {
    connectHelper(callback);
  }
}

function connect() {
  return new Promise(function(resolve,reject) {
      connectDb(function(err,db) {
        if(err!=null || db==null) {
          reject(err);
        } else {
          resolve(db);
        };
      });
    });
}

function sendDoc(res,code,doc) {
  // delete internal mongo _id from all documents
  if(Array.isArray(doc)) {
    doc.forEach(x => {
      delete x._id;
    });
  } else {
    delete doc._id;
  }

  if(doc.href) {
    res.setHeader('Location', doc.href);
  }

  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(doc));
}

module.exports = { connect, connectDb, getMongoQuery, sendDoc };