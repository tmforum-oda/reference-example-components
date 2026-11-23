const axios = require('axios');

var releaseName = process.env.RELEASE_NAME; 
var componentName = process.env.COMPONENT_NAME; 
// Base URL of the TMF620 v4 API; the chart sets it. The default is the v4 service in the same release.
var apiUrl = process.env.TMF620_V4_API_URL ||
  'http://' + releaseName + '-prodcatapiv4:8080/' + componentName + '/tmf-api/productCatalogManagement/v4';

const metricsEventListner = {
  callback: "http://" + componentName + "-sm:4000/listener"
}

const delay = ms => new Promise(res => setTimeout(res, ms));

const createMetricsEventListner = async () => {
  var complete = false;

  while (complete == false) {
    try {
        await delay(5000);  // retry every 5 seconds
        const url = apiUrl + '/hub';
        console.log('POSTing listner with callback ',metricsEventListner, ' to: ', url);
        const res = await axios.post(
          url, 
          metricsEventListner,
          {timeout: 10000});
        console.log(`Status: ${res.status}`);
        console.log('Body: ', res.data);
        complete = true;
        
        console.log('Telling Istio were finished');
        const res2 = await axios.post(
          'http://127.0.0.1:15020/quitquitquit', 
          {},
          {timeout: 10000});

        process.exit(0);
    } catch (err) {
      console.log('Initialization failed - retrying in 5 seconds');
    }
  }
};

createMetricsEventListner();

