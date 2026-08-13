const axios = require('axios');

var releaseName = process.env.RELEASE_NAME;
var componentName = process.env.COMPONENT_NAME;

const metricsEventListener = {
  callback: 'http://' + componentName + '-sm:4000/listener'
};

const delay = ms => new Promise(res => setTimeout(res, ms));

const registerListeners = async () => {
  var complete = false;
  while (!complete) {
    try {
      await delay(5000);

      // Register metrics listener on TMF680 Product Recommendation hub
      const recommendationHubUrl = 'http://' + releaseName + '-recommendationapi:8080/' + componentName + '/customer/v4/hub';
      console.log('POSTing listener to:', recommendationHubUrl);
      await axios.post(recommendationHubUrl, metricsEventListener, { timeout: 10000 });

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
