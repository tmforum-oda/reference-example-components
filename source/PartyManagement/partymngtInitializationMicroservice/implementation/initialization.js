const axios = require('axios');

var releaseName = process.env.RELEASE_NAME;
var componentName = process.env.COMPONENT_NAME;

const metricsEventListener = {
  callback: 'http://' + componentName + '-sm:4000/listener'
};

const delay = ms => new Promise(res => setTimeout(res, ms));

const createMetricsEventListener = async () => {
  var complete = false;

  while (complete == false) {
    try {
      await delay(5000);
      const url = 'http://' + releaseName + '-partymngtapi:8632/' + componentName + '/tmf-api/partyManagement/v5/hub';
      console.log('POSTing listener with callback ', metricsEventListener, ' to: ', url);
      const res = await axios.post(url, metricsEventListener, { timeout: 10000 });
      console.log(`Status: ${res.status}`);
      console.log('Body: ', res.data);
      complete = true;

      console.log('Telling Istio we are finished');
      await axios.post('http://127.0.0.1:15020/quitquitquit', {}, { timeout: 10000 });
      process.exit(0);
    } catch (err) {
      console.log('Initialization failed - retrying in 5 seconds');
    }
  }
};

createMetricsEventListener();
