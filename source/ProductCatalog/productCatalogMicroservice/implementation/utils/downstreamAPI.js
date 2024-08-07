'use strict';
const axios = require('axios');

const downstreamAPIList = ['http://localhost/r1-productcatalogmanagement/tmf-api/productCatalogManagement/v4/']


//
// Query downstream APIs for data
//

async function listDownstreamAPI(doc, url) {
    console.log(url);
    const urlResource = url.split('/').pop();
    for (const downstreamAPI in downstreamAPIList) {
        console.log('utils/downstreamAPI :: getting data from downstream API at ' + downstreamAPIList[downstreamAPI] + urlResource);
        const apiResponse = await axios.get(downstreamAPIList[downstreamAPI] + urlResource)
        console.log('utils/downstreamAPI :: received ' + apiResponse.data.length + ' records');
        doc = doc.concat(apiResponse.data);        
    }
    return doc
}

module.exports = { listDownstreamAPI };

