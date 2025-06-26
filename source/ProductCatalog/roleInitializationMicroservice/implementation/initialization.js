const axios = require('axios');

// Configuration for different API types
const initialPartyRole = {
  name: "Admin"
}

const initialPermissionSpecificationSet = {
  "@type": "PermissionSpecificationSet",
  name: "Admin",
  involvementRole: "Admin",
  description: "Administrator permission specification set with full access rights",
  permissionSpecification: [
    {
      "@type": "PermissionSpecification",
      name: "admin:all",
      description: "Full administrative access to all resources",
      function: "admin",
      action: "all"
    }
  ]
}

const delay = ms => new Promise(res => setTimeout(res, ms));

var releaseName = process.env.RELEASE_NAME; 
var componentName = process.env.COMPONENT_NAME;
var usePermissionSpec = process.env.USE_PERMISSION_SPEC === 'true'; // Environment variable to determine which API to use

const createRole = async () => {
  var complete = false;

  while (complete == false) {
    try {
        await delay(5000);  // retry every 5 seconds
        
        let url, payload, apiName;
        
        if (usePermissionSpec) {
          // Use Permission Specification Set API (TMF672)
          apiName = 'permissionspecapi';
          url = `http://${releaseName}-${apiName}:8080/${componentName}/rolesAndPermissionsManagement/v5/permissionSpecificationSet`;
          payload = initialPermissionSpecificationSet;
          console.log('POSTing PermissionSpecificationSet to: ', url);
        } else {
          // Use Party Role API (TMF669)
          apiName = 'partyroleapi';
          url = `http://${releaseName}-${apiName}:8080/${componentName}/tmf-api/partyRoleManagement/v4/partyRole`;
          payload = initialPartyRole;
          console.log('POSTing PartyRole to: ', url);
        }
        
        const res = await axios.post(
          url, 
          payload,
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
      console.log(`Initialization failed (${usePermissionSpec ? 'PermissionSpec' : 'PartyRole'} API) - retrying in 5 seconds`);
      console.error('Error details:', err.message);
    }
  }
};

createRole();

