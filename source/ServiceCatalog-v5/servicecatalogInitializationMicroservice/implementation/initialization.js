'use strict';
const http = require('http');
const fetch = require('node-fetch');

const releaseName    = process.env.RELEASE_NAME    || 'r1';
const componentName  = process.env.COMPONENT_NAME  || 'servicecatalogmanagement';
const metricsListener = { callback: 'http://' + componentName + '-sm:4000/listener' };

const hubUrls = [
  'http://' + releaseName + '-svcatalogapi:8633/' + componentName + '/tmf-api/serviceCatalogManagement/v4/hub',
  'http://' + releaseName + '-svcqualityapi:8657/' + componentName + '/tmf-api/serviceQualityManagement/v4/hub',
];

function registerMetricsListener(url) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metricsListener)
  })
    .then(res => res.json())
    .then(json => { console.log('Registered metrics listener on ' + url + ':', JSON.stringify(json)); })
    .catch(err => { console.log('Error registering metrics listener on ' + url + ': ' + err.message); });
}

Promise.allSettled(hubUrls.map(url => registerMetricsListener(url)))
  .then(() => {
    console.log('Initialization complete. Shutting down Istio sidecar.');
    fetch('http://127.0.0.1:15020/quitquitquit', { method: 'POST' })
      .catch(err => { console.log('Error stopping Istio sidecar: ' + err.message); });
  });
