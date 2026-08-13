const axios = require('axios');

var releaseName = process.env.RELEASE_NAME;
var componentName = process.env.COMPONENT_NAME;

const hubUrl = process.env.HUB_URL ||
  `http://${releaseName}-privacymanagementapi:8080/${componentName}/tmf-api/privacyManagement/v5/hub`;
const listenerUrl = process.env.LISTENER_URL ||
  `http://${componentName}-sm:4000/listener`;

const metricsEventListener = {
  callback: listenerUrl
};

const delay = ms => new Promise(res => setTimeout(res, ms));

const createMetricsEventListener = async () => {
  var complete = false;

  while (complete == false) {
    try {
      await delay(5000);
      console.log('POSTing listener with callback', metricsEventListener, 'to:', hubUrl);
      const res = await axios.post(hubUrl, metricsEventListener, { timeout: 10000 });
      console.log(`Status: ${res.status}`);
      console.log('Body: ', res.data);
      complete = true;

      console.log('Telling Istio were finished');
      await axios.post('http://127.0.0.1:15020/quitquitquit', {}, { timeout: 10000 });

      process.exit(0);
    } catch (err) {
      console.log('Initialization failed - retrying in 5 seconds');
    }
  }
};

createMetricsEventListener();
