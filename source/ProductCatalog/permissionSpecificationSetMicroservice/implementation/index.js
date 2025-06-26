'use strict';
require("dotenv").config();

var path = require('path');
var http = require('http');

var oas3Tools = require('oas3-tools');
var serverPort = process.env.PORT || 8080;

// swaggerRouter configuration
var options = {
    routing: {
        controllers: path.join(__dirname, './controllers')
    },
};

var expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/TMF672-Roles_And_Permissions-v5.0.0.oas.yaml'), options);
var app = expressAppConfig.getApp();

// Get Component instance name from Environment variable and put it at start of API path
let componentName = process.env.COMPONENT_NAME;
if (!componentName) {
  componentName = 'r1-productcatalogmanagement' // for local testing, if not set
}
console.log('ComponentName:'+componentName);

// Initialize the Swagger middleware
http.createServer(app).listen(serverPort, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
});

