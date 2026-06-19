'use strict';
const axios = require('axios');
const delay = ms => new Promise(res => setTimeout(res, ms));

var releaseName = process.env.RELEASE_NAME;
var componentName = process.env.COMPONENT_NAME;

const registerMetricsListener = async () => {
  var complete = false;
  while (!complete) {
    try {
      await delay(5000);
      const url = `http://${releaseName}-productinvapi:8637/${componentName}/tmf-api/productInventory/v5/hub`;
      const payload = {
        callback: `http://${releaseName}-${componentName}-sm:4000/listener`,
        query: ''
      };
      await axios.post(url, payload, { timeout: 10000 });
      complete = true;
      console.log('Metrics listener registered successfully');
      await axios.post('http://localhost:15020/quitquitquit');
    } catch (err) {
      console.log('Error registering metrics listener, retrying...', err.message);
    }
  }
};

registerMetricsListener();
