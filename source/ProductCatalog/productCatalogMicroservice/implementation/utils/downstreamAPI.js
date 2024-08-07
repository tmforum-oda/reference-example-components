'use strict';
const axios = require('axios');

const downstreamAPIList = ['http://localhost/r1-productcatalogmanagement/tmf-api/productCatalogManagement/v4/']


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
    for (const downstreamAPI in downstreamAPIList) {
        console.log('utils/downstreamAPI/listFromDownstreamAPI :: getting data from downstream API at ' + downstreamAPIList[downstreamAPI] + urlResource);
        const apiResponse = await axios.get(downstreamAPIList[downstreamAPI] + urlResource)
        console.log('utils/downstreamAPI/listFromDownstreamAPI :: received ' + apiResponse.data.length + ' records');
        doc = doc.concat(apiResponse.data);        
    }
    return doc
}

async function retrieveFromDownstreamAPI(resourceType, id) {
    console.log('utils/downstreamAPI/retrieveFromDownstreamAPI :: getting data from downstream API for resource ' + resourceType + ' and id ' + id);
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

