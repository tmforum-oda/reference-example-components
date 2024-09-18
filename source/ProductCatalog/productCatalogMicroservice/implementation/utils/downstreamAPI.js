'use strict';
// Import the JSONPath library
const axios = require('axios');
const CANVAS_INFO_HOST_PORT = process.env.CANVAS_INFO_HOST_PORT;
const CANVAS_INFO_SERVICE_INVENTORY_API = 'http://' + CANVAS_INFO_HOST_PORT + '/tmf-api/serviceInventoryManagement/v5/' // 'http://info.canvas.svc.cluster.local/tmf-api/serviceInventoryManagement/v5/'
const API_DEPENDENCY_NAME = 'downstreamproductcatalog'; // defined in the component specification YAML file
let componentName = process.env.COMPONENT_NAME;

let gDownstreamAPIList = [];
let gDownstreamAPIListLoaded = false;

async function getDownstreamAPIs() {
    if (!gDownstreamAPIListLoaded) {
        if (CANVAS_INFO_HOST_PORT) {  // onloadly load the downstream APIs if the CANVAS_INFO_HOST_PORT is set
            console.log('utils/downstreamAPI/getDownstreamAPIs :: loading downstream APIs');
            gDownstreamAPIList = await loadDownstreamAPIs();
            gDownstreamAPIListLoaded = true;
        } else {
            console.log('utils/downstreamAPI/getDownstreamAPIs :: downstream APIs not loaded as CANVAS_INFO_HOST_PORT is not set');
        }
    }
    console.log('utils/downstreamAPI/getDownstreamAPIs :: returning ' + gDownstreamAPIList.length + ' downstream APIs');
    return gDownstreamAPIList;
}

/**
 * This function retrieves a list of downstream APIs that the product catalog microservice is dependent on.
 * This function calls the Canvas.Info Service Inventory API at info.canvas.svc.cluster.local to get the list
 * of downstream APIs to call. The Service Inventory should return a list of zero or more services or type API that
 * have a Service Characteristic of 'url'. 
 * @returns The list of downstream APIs
 */
async function loadDownstreamAPIs() {
    console.log('utils/downstreamAPI/getDownstreamAPIs :: getting list of downstream APIs from ' + CANVAS_INFO_SERVICE_INVENTORY_API + 'service');
    try {
        const apiResponse = await axios.get(CANVAS_INFO_SERVICE_INVENTORY_API + 'service', {
            timeout: 1000 // Timeout in milliseconds
          })
        if (apiResponse.data) {
            console.log('utils/downstreamAPI/getDownstreamAPIs :: received ' + apiResponse.data.length + ' records');

            // Filter parent services based on matching serviceCharacteristic objects
            // We are only interested in APIs matching our declared dependency of 'downstreamproductcatalog'
            const matchingServices = apiResponse.data.filter(service => 
                service.serviceCharacteristic &&
                service.serviceCharacteristic.some(characteristic => 
                    characteristic.name === 'dependencyName' && characteristic.value === API_DEPENDENCY_NAME
                ) &&
                service.serviceCharacteristic.some(characteristic => 
                    characteristic.name === 'componentName' && characteristic.value === componentName
                )
            );
            const downstreamAPIList = [];

            // for each service in the apiResponse.data, check if it has a serviceCharacteristic of 'url'
            for (const service in matchingServices) {
                if (apiResponse.data[service].serviceCharacteristic) {
                    for (const serviceCharacteristic in apiResponse.data[service].serviceCharacteristic) {
                        if (apiResponse.data[service].serviceCharacteristic[serviceCharacteristic].name === 'url') {
                            // ensure url ends with a / to avoid issues with concatenation
                            if (!apiResponse.data[service].serviceCharacteristic[serviceCharacteristic].value.endsWith('/')) {
                                apiResponse.data[service].serviceCharacteristic[serviceCharacteristic].value += '/';
                            }
                            downstreamAPIList.push(apiResponse.data[service].serviceCharacteristic[serviceCharacteristic].value);
                        }
                    }
                }
            }
            console.log('utils/downstreamAPI/getDownstreamAPIs :: returning ' + downstreamAPIList.length + ' downstream APIs');

            return downstreamAPIList;
        }
    }
    catch (AxiosError) {
        console.log('utils/downstreamAPI/retrieveFromDownstreamAPI :: error getting data from downstream API at ' + CANVAS_INFO_SERVICE_INVENTORY_API);
        console.log(AxiosError.message);
        return [];
    }
}

/**
 * This queries a list of downstream Product Catalog APIs and concatenates the results.
 * This function is to allow the reference product catalog component to implement dependent APIs - it has
 * an optional dependency on one or more downstream product catalogs.
 * @param {*} resourceList - The list of resources returned by the downstream API(s)
 * @param {*} url - Theoriginal URL query - we cascade the resource and any additional filters or requested fields
 * @returns The document with the additional records appended
 */

async function listFromDownstreamAPI(resourceType) {
    console.log('utils/downstreamAPI/listFromDownstreamAPI :: resourceType =  ' + resourceType);
    const downstreamAPIList = await getDownstreamAPIs();
    let resourceList = [];
    for (const downstreamAPI in downstreamAPIList) {
        console.log('utils/downstreamAPI/listFromDownstreamAPI :: getting data from downstream API at ' + downstreamAPIList[downstreamAPI] + resourceType);
        
        try {
            const apiResponse = await axios.get(downstreamAPIList[downstreamAPI] + resourceType)
            console.log('utils/downstreamAPI/listFromDownstreamAPI :: received ' + apiResponse.data.length + ' records');
            resourceList = resourceList.concat(apiResponse.data);  
        } catch (AxiosError) {
            console.log('utils/downstreamAPI/listFromDownstreamAPI :: error getting data from downstream API at ' + downstreamAPIList[downstreamAPI] + resourceType);
            console.log(AxiosError.message);
        }      
    }
    return resourceList
}

async function retrieveFromDownstreamAPI(resourceType, id) {
    console.log('utils/downstreamAPI/retrieveFromDownstreamAPI :: getting data from downstream API for resource ' + resourceType + ' and id ' + id);
    const downstreamAPIList = await getDownstreamAPIs();
    for (const downstreamAPI in downstreamAPIList) {
        console.log('utils/downstreamAPI/retrieveFromDownstreamAPI :: getting data from downstream API at ' + downstreamAPIList[downstreamAPI] + resourceType + '/' + id);
        try {
            const apiResponse = await axios.get(downstreamAPIList[downstreamAPI] + resourceType + '/' + id)
            if (apiResponse.data) {
                console.log('utils/downstreamAPI/retrieveFromDownstreamAPI :: received data record');
                return apiResponse.data;
            }
        }
        catch (AxiosError) {
            console.log('utils/downstreamAPI/retrieveFromDownstreamAPI :: error getting data from downstream API at ' + downstreamAPIList[downstreamAPI] + resourceType + '/' + id);
            console.log(AxiosError);
        }
    }
    return null
}


module.exports = { listFromDownstreamAPI, retrieveFromDownstreamAPI };

