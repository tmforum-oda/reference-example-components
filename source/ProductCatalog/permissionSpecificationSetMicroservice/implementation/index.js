'use strict';
require("dotenv").config();

var path = require('path');
var http = require('http');
var fs = require('fs');
var jsyaml = require('js-yaml');

var oas3Tools = require('oas3-tools');
var serverPort = process.env.PORT || 8080;

// Get Component instance name from Environment variable and put it at start of API path
let componentName = process.env.COMPONENT_NAME;
if (!componentName) {
  componentName = 'r1-productcatalogmanagement' // for local testing, if not set
}
console.log('ComponentName:'+componentName);

// Load and modify the OAS3 specification to include component name in the API root
const oasFilePath = path.join(__dirname, 'api/TMF672-Roles_And_Permissions-v5.0.0.oas.yaml');
const oasSpec = jsyaml.load(fs.readFileSync(oasFilePath, 'utf8'));

// Update the apiRoot default to include the component name
if (oasSpec.servers && oasSpec.servers[0] && oasSpec.servers[0].variables && oasSpec.servers[0].variables.apiRoot) {
  const originalApiRoot = oasSpec.servers[0].variables.apiRoot.default;
  oasSpec.servers[0].variables.apiRoot.default = `${componentName}/${originalApiRoot}`;
  console.log(`Updated API root from '${originalApiRoot}' to '${oasSpec.servers[0].variables.apiRoot.default}'`);
}

// Write the modified specification to a temporary file
const modifiedOasPath = path.join(__dirname, 'api/TMF672-Roles_And_Permissions-v5.0.0-modified.oas.yaml');
fs.writeFileSync(modifiedOasPath, jsyaml.dump(oasSpec));

// swaggerRouter configuration
var options = {
    routing: {
        controllers: path.join(__dirname, './controllers')
    },
};

var expressAppConfig = oas3Tools.expressAppConfig(modifiedOasPath, options);
var app = expressAppConfig.getApp();

// Initialize the Swagger middleware
http.createServer(app).listen(serverPort, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
});

