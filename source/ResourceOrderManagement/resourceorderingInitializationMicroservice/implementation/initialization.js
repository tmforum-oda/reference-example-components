const axios = require('axios');
var releaseName = process.env.RELEASE_NAME;
var componentName = process.env.COMPONENT_NAME;
const metricsEventListner = { callback: "http://" + componentName + "-sm:4000/listener" };
const delay = ms => new Promise(res => setTimeout(res, ms));
const createMetricsEventListner = async () => {
  var complete = false;
  while (!complete) {
    try {
      await delay(5000);
      const url = 'http://' + releaseName + '-resourceorderingapi:8080/' + componentName + '/tmf-api/resourceOrderingManagement/v4/hub';
      const res = await axios.post(url, metricsEventListner, {timeout: 10000});
      complete = true;
      await axios.post('http://127.0.0.1:15020/quitquitquit', {}, {timeout: 10000});
      process.exit(0);
    } catch (err) { console.log('Initialization failed - retrying in 5 seconds'); }
  }
};
createMetricsEventListner();
