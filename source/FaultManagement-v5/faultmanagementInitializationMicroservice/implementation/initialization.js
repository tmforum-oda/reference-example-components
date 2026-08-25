'use strict';
const axios = require('axios');
const delay = ms => new Promise(res => setTimeout(res, ms));

var releaseName = process.env.RELEASE_NAME;
var componentName = process.env.COMPONENT_NAME;

const metricsEventListener = {
  callback: 'http://' + componentName + '-sm:4000/listener'
};

const registerListeners = async () => {
  var complete = false;
  while (!complete) {
    try {
      await delay(5000);

      const alarmHubUrl = 'http://' + releaseName + '-faultmanagementapi:8080/' + componentName + '/tmf-api/alarmManagement/v5/hub';
      console.log('POSTing listener to:', alarmHubUrl);
      await axios.post(alarmHubUrl, metricsEventListener, { timeout: 10000 });

      complete = true;
      console.log('Initialization complete. Telling Istio we are finished.');
      await axios.post('http://127.0.0.1:15020/quitquitquit', {}, { timeout: 10000 });
      process.exit(0);
    } catch (err) {
      console.log('Initialization failed - retrying in 5 seconds:', err.message);
    }
  }
};

registerListeners();
