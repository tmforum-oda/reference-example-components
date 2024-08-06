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
        const apiResponse = await axios.get(downstreamAPIList[downstreamAPI] + urlResource)
        doc = doc.concat(apiResponse.data);        
    }

    return doc
}


module.exports = { listDownstreamAPI };

