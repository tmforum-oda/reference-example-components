'use strict';
const axios = require('axios');

const CANVAS_INFO_SERVICE_INVENTORY_API = 'http://localhost:8638/tmf-api/serviceInventoryManagement/v5/' // 'http://info.canvas.svc.cluster.local/tmf-api/serviceInventoryManagement/v5/'
/**
 * This function retrieves a list of downstream APIs that the product catalog microservice is dependent on.
 * This function calls the Canvas.Info Service Inventory API at info.canvas.svc.cluster.local to get the list
 * of downstream APIs to call. The Service Inventory should return a list of zero or more services or type API that
 * have a Service Characteristic of 'url'. 
 * @returns The list of downstream APIs
 */
async function getDownstreamAPIs() {
    console.log('utils/downstreamAPI/getDownstreamAPIs :: getting list of downstream APIs from ' + CANVAS_INFO_SERVICE_INVENTORY_API + 'service');
    try {
        const apiResponse = await axios.get(CANVAS_INFO_SERVICE_INVENTORY_API + 'service')
        if (apiResponse.data) {
            console.log('utils/downstreamAPI/getDownstreamAPIs :: received ' + apiResponse.data.length + ' records');
            // look for services with a service characteristic of 'url'
            const downstreamAPIList = [];
            // for each service in the apiResponse.data, check if it has a serviceCharacteristic of 'url'
            for (const service in apiResponse.data) {
                if (apiResponse.data[service].serviceCharacteristic) {
                    for (const serviceCharacteristic in apiResponse.data[service].serviceCharacteristic) {
                        if (apiResponse.data[service].serviceCharacteristic[serviceCharacteristic].name === 'url') {
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
        console.log(AxiosError);
    }
}

/**
 * This queries a list of downstream Product Catalog APIs and concatenates the results.
 * This function is to allow the reference product catalog component to implement dependent APIs - it has
 * an optional dependency on one or more downstream product catalogs.
 * @param {*} doc - The document containing the resource data where any additional records will be appended
 * @param {*} url - Theoriginal URL query - we cascade the resource and any additional filters or requested fields
 * @returns The document with the additional records appended
 */

async function listFromDownstreamAPI(doc, url) {
    console.log(url);
    const urlResource = url.split('/').pop();
    const downstreamAPIList = await getDownstreamAPIs();
    for (const downstreamAPI in downstreamAPIList) {
        console.log('utils/downstreamAPI/listFromDownstreamAPI :: getting data from downstream API at ' + downstreamAPIList[downstreamAPI] + urlResource);
        
        try {
            const apiResponse = await axios.get(downstreamAPIList[downstreamAPI] + urlResource)
            console.log('utils/downstreamAPI/listFromDownstreamAPI :: received ' + apiResponse.data.length + ' records');
            doc = doc.concat(apiResponse.data);  
        } catch (AxiosError) {
            console.log('utils/downstreamAPI/listFromDownstreamAPI :: error getting data from downstream API at ' + downstreamAPIList[downstreamAPI] + urlResource);
            console.log(AxiosError.message);
        }      
    }
    return doc
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

