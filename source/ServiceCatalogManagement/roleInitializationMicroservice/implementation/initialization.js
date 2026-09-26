const axios = require('axios');
const delay = ms => new Promise(res => setTimeout(res, ms));
var releaseName = process.env.RELEASE_NAME;
var componentName = process.env.COMPONENT_NAME;
const usePermissionSpec = process.env.USE_PERMISSION_SPEC === 'true';

const initialPermissionSpecificationSet = {
  "@baseType": "PermissionSpecificationSet",
  "@type": "PermissionSpecificationSet",
  name: "canvasRole",
  involvementRole: "canvasRole",
  description: "canvasRole permission specification set with read-only access rights",
  permissionSpecification: [
    {
      "@baseType": "PermissionSpecification",
      "@type": "PermissionSpecification",
      name: "canvasRole:read-only",
      description: "Read-only access to all resources",
      function: "canvasRole",
      action: "all"
    }
  ]
};

const createRole = async () => {
  var complete = false;
  while (!complete) {
    try {
      await delay(5000);
      let url, payload;
      if (usePermissionSpec) {
        url = `http://${releaseName}-permissionspecapi:8080/${componentName}/rolesAndPermissionsManagement/v5/permissionSpecificationSet`;
        payload = initialPermissionSpecificationSet;
      } else {
        url = `http://${releaseName}-partyroleapi:8080/${componentName}/tmf-api/partyRoleManagement/v4/partyRole`;
        payload = { name: "canvasRole" };
      }
      const res = await axios.post(url, payload, { timeout: 10000 });
      console.log(`Status: ${res.status}`);
      complete = true;
      console.log('Telling Istio we are finished');
      await axios.post('http://127.0.0.1:15020/quitquitquit', {}, { timeout: 10000 });
      process.exit(0);
    } catch (err) {
      console.log('Role initialization failed - retrying in 5 seconds', err.message);
    }
  }
};
createRole();

