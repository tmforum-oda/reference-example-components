'use strict';
// Extended downstream API utility supporting multiple named dependencies and POST operations
const axios = require('axios');
const https = require('https');
const CANVAS_INFO_HOST_PORT = process.env.CANVAS_INFO_HOST_PORT;
const CANVAS_INFO_BASEPATH = process.env.CANVAS_INFO_BASEPATH;
const DEPENDENT_APIS_REJECT_UNAUTHORIZED_CERTIFICATES = process.env.DEPENDENT_APIS_REJECT_UNAUTHORIZED_CERTIFICATES === 'true';

const CANVAS_INFO_SERVICE_INVENTORY_API = 'http://' + CANVAS_INFO_HOST_PORT + CANVAS_INFO_BASEPATH;
let componentName = process.env.COMPONENT_NAME;

// Cache keyed by dependency name
let gDownstreamAPICache = {};

async function getDownstreamAPIs(dependencyName) {
    if (!gDownstreamAPICache[dependencyName]) {
        if (CANVAS_INFO_HOST_PORT) {
            console.log('utils/downstreamAPI/getDownstreamAPIs :: loading downstream APIs for dependency ' + dependencyName);
            gDownstreamAPICache[dependencyName] = await loadDownstreamAPIs(dependencyName);
        } else {
            console.log('utils/downstreamAPI/getDownstreamAPIs :: downstream APIs not loaded as CANVAS_INFO_HOST_PORT is not set');
            return [];
        }
    }
    console.log('utils/downstreamAPI/getDownstreamAPIs :: returning ' + gDownstreamAPICache[dependencyName].length + ' downstream APIs for ' + dependencyName);
    return gDownstreamAPICache[dependencyName];
}

/**
 * This function retrieves a list of downstream APIs for a named dependency.
 * This function calls the Canvas.Info Service Inventory API at info.canvas.svc.cluster.local to get the list
 * of downstream APIs to call. The Service Inventory should return a list of zero or more services of type API that
 * have a Service Characteristic of 'url'.
 * @param {string} dependencyName - The name of the dependency as declared in the component spec
 * @returns The list of downstream API URLs
 */
async function loadDownstreamAPIs(dependencyName) {
    console.log('utils/downstreamAPI/loadDownstreamAPIs :: getting list of downstream APIs from ' + CANVAS_INFO_SERVICE_INVENTORY_API + 'service for dependency ' + dependencyName);
    try {
        const apiResponse = await axios.get(CANVAS_INFO_SERVICE_INVENTORY_API + 'service', {
            timeout: 1000,
            httpsAgent: new (https.Agent)({ rejectUnauthorized: DEPENDENT_APIS_REJECT_UNAUTHORIZED_CERTIFICATES })
        })
        if (apiResponse.data) {
            console.log('utils/downstreamAPI/loadDownstreamAPIs :: received ' + apiResponse.data.length + ' records');

            // Filter parent services based on matching serviceCharacteristic objects
            const matchingServices = apiResponse.data.filter(service => 
                service.serviceCharacteristic &&
                service.serviceCharacteristic.some(characteristic => 
                    characteristic.name === 'dependencyName' && characteristic.value === dependencyName
                ) &&
                service.serviceCharacteristic.some(characteristic => 
                    characteristic.name === 'componentName' && characteristic.value === componentName
                )
            );
            const downstreamAPIList = [];

            for (const service in matchingServices) {
                if (matchingServices[service].serviceCharacteristic) {
                    for (const serviceCharacteristic in matchingServices[service].serviceCharacteristic) {
                        if (matchingServices[service].serviceCharacteristic[serviceCharacteristic].name === 'url') {
                            // ensure url ends with a / to avoid issues with concatenation
                            if (!matchingServices[service].serviceCharacteristic[serviceCharacteristic].value.endsWith('/')) {
                                matchingServices[service].serviceCharacteristic[serviceCharacteristic].value += '/';
                            }
                            // running in a Dev environment sometimes returns urls with localhost - replace this with host.docker.internal
                            matchingServices[service].serviceCharacteristic[serviceCharacteristic].value = matchingServices[service].serviceCharacteristic[serviceCharacteristic].value.replace('localhost', 'host.docker.internal');
                            downstreamAPIList.push(matchingServices[service].serviceCharacteristic[serviceCharacteristic].value);
                        }
                    }
                }
            }
            console.log('utils/downstreamAPI/loadDownstreamAPIs :: returning ' + downstreamAPIList.length + ' downstream APIs for ' + dependencyName);

            return downstreamAPIList;
        }
    }
    catch (AxiosError) {
        console.log('utils/downstreamAPI/loadDownstreamAPIs :: error getting data from downstream API at ' + CANVAS_INFO_SERVICE_INVENTORY_API);
        console.log(AxiosError.message);
        return [];
    }
}

/**
 * List resources from all downstream APIs matching a named dependency.
 * @param {string} dependencyName - The dependency name (e.g., 'downstreamproductcatalog')
 * @param {string} resourceType - The resource type (e.g., 'productOffering')
 * @returns The concatenated list of resources from all matching downstream APIs
 */
async function listFromDownstreamAPI(dependencyName, resourceType) {
    console.log('utils/downstreamAPI/listFromDownstreamAPI :: dependencyName = ' + dependencyName + ', resourceType = ' + resourceType);
    const downstreamAPIList = await getDownstreamAPIs(dependencyName);
    let resourceList = [];
    for (const downstreamAPI in downstreamAPIList) {
        console.log('utils/downstreamAPI/listFromDownstreamAPI :: getting data from downstream API at ' + downstreamAPIList[downstreamAPI] + resourceType);
        
        try {
            const apiResponse = await axios.get(downstreamAPIList[downstreamAPI] + resourceType, {
                timeout: 1000,
                httpsAgent: new (https.Agent)({ rejectUnauthorized: DEPENDENT_APIS_REJECT_UNAUTHORIZED_CERTIFICATES })
            })
            console.log('utils/downstreamAPI/listFromDownstreamAPI :: received ' + apiResponse.data.length + ' records');
            resourceList = resourceList.concat(apiResponse.data);  
        } catch (AxiosError) {
            console.log('utils/downstreamAPI/listFromDownstreamAPI :: error getting data from downstream API at ' + downstreamAPIList[downstreamAPI] + resourceType);
            console.log(AxiosError.message);
        }      
    }
    return resourceList;
}

/**
 * Retrieve a single resource by ID from downstream APIs matching a named dependency.
 * @param {string} dependencyName - The dependency name (e.g., 'downstreamproductcatalog')
 * @param {string} resourceType - The resource type (e.g., 'productOffering')
 * @param {string} id - The resource ID
 * @returns The resource document or null if not found
 */
async function retrieveFromDownstreamAPI(dependencyName, resourceType, id) {
    console.log('utils/downstreamAPI/retrieveFromDownstreamAPI :: dependencyName = ' + dependencyName + ', resourceType = ' + resourceType + ', id = ' + id);
    const downstreamAPIList = await getDownstreamAPIs(dependencyName);
    for (const downstreamAPI in downstreamAPIList) {
        console.log('utils/downstreamAPI/retrieveFromDownstreamAPI :: getting data from downstream API at ' + downstreamAPIList[downstreamAPI] + resourceType + '/' + id);
        try {
            const apiResponse = await axios.get(downstreamAPIList[downstreamAPI] + resourceType + '/' + id, {
                timeout: 1000,
                httpsAgent: new (https.Agent)({ rejectUnauthorized: DEPENDENT_APIS_REJECT_UNAUTHORIZED_CERTIFICATES })
            })
            if (apiResponse.data) {
                console.log('utils/downstreamAPI/retrieveFromDownstreamAPI :: received data record');
                return apiResponse.data;
            }
        }
        catch (AxiosError) {
            console.log('utils/downstreamAPI/retrieveFromDownstreamAPI :: error getting data from downstream API at ' + downstreamAPIList[downstreamAPI] + resourceType + '/' + id);
            console.log(AxiosError.message);
        }
    }
    return null;
}

/**
 * Create a resource in a downstream API matching a named dependency.
 * Posts the body to the first available downstream API endpoint.
 * @param {string} dependencyName - The dependency name (e.g., 'downstreamproductinventory')
 * @param {string} resourceType - The resource type (e.g., 'product')
 * @param {object} body - The resource payload to create
 * @returns The created resource document or null on failure
 */
async function createInDownstreamAPI(dependencyName, resourceType, body) {
    console.log('utils/downstreamAPI/createInDownstreamAPI :: dependencyName = ' + dependencyName + ', resourceType = ' + resourceType);
    const downstreamAPIList = await getDownstreamAPIs(dependencyName);
    for (const downstreamAPI in downstreamAPIList) {
        console.log('utils/downstreamAPI/createInDownstreamAPI :: posting data to downstream API at ' + downstreamAPIList[downstreamAPI] + resourceType);
        try {
            const apiResponse = await axios.post(downstreamAPIList[downstreamAPI] + resourceType, body, {
                timeout: 5000,
                httpsAgent: new (https.Agent)({ rejectUnauthorized: DEPENDENT_APIS_REJECT_UNAUTHORIZED_CERTIFICATES }),
                headers: { 'Content-Type': 'application/json' }
            })
            if (apiResponse.data) {
                console.log('utils/downstreamAPI/createInDownstreamAPI :: created resource successfully');
                return apiResponse.data;
            }
        }
        catch (AxiosError) {
            console.log('utils/downstreamAPI/createInDownstreamAPI :: error posting data to downstream API at ' + downstreamAPIList[downstreamAPI] + resourceType);
            console.log(AxiosError.message);
        }
    }
    return null;
}


module.exports = { listFromDownstreamAPI, retrieveFromDownstreamAPI, createInDownstreamAPI };
