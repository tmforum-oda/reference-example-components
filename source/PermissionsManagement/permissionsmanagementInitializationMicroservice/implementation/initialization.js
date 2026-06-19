const axios = require('axios');

var releaseName = process.env.RELEASE_NAME;
var componentName = process.env.COMPONENT_NAME;

const metricsEventListener = {
  callback: 'http://' + componentName + '-sm:4000/listener'
};

const delay = ms => new Promise(res => setTimeout(res, ms));

const registerListener = async (url) => {
  var complete = false;
  while (complete == false) {
    try {
      await delay(5000);
      console.log('POSTing listener with callback ', metricsEventListener, ' to: ', url);
      const res = await axios.post(url, metricsEventListener, { timeout: 10000 });
      console.log(`Status: ${res.status}`);
      console.log('Body: ', res.data);
      complete = true;
    } catch (err) {
      console.log('Registration to ' + url + ' failed - retrying in 5 seconds');
    }
  }
};

const initialize = async () => {
  const urlUserRolePerm = 'http://' + releaseName + '-userrolepermapi:8672/' + componentName + '/rolesAndPermissions/v4/hub';
  const urlPartyRole    = 'http://' + releaseName + '-partyroleapi:8669/' + componentName + '/tmf-api/hub';

  await registerListener(urlUserRolePerm);
  await registerListener(urlPartyRole);

  console.log('Telling Istio we are finished');
  try {
    await axios.post('http://127.0.0.1:15020/quitquitquit', {}, { timeout: 10000 });
  } catch (err) {}
  process.exit(0);
};

initialize();
