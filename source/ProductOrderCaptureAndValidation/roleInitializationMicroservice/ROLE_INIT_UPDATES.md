# Role Initialization Service Updates

## Overview
The roleInitializationMicroservice has been updated to support both Party Role API (TMF669) and Permission Specification Set API (TMF672) initialization.

## Changes Made

### 1. Updated `initialization.js`
- **Conditional API Selection**: The service now uses the `USE_PERMISSION_SPEC` environment variable to determine which API to initialize
- **Dual Payload Support**: 
  - **Party Role API**: Creates a simple `{ name: "Admin" }` party role
  - **Permission Spec API**: Creates a comprehensive `PermissionSpecificationSet` with admin permissions
- **Dynamic URL Construction**: Service name and API endpoints are determined based on the API type
- **Enhanced Logging**: Error messages now indicate which API type is being used

### 2. Updated `cronjob-roleinitialization.yaml`
- **Environment Variable**: Added `USE_PERMISSION_SPEC` environment variable that gets its value from `{{.Values.permissionspec.enabled}}`
- **Documentation**: Added Helm template comments explaining the conditional behavior

### 3. Updated `package.json`
- **Name**: Changed from "party-role-initialization" to "role-initialization"
- **Description**: Updated to reflect dual API support

## API-Specific Behavior

### When `permissionspec.enabled = true` (Default)
- **Service Target**: `{releaseName}-permissionspecapi:8080`
- **API Endpoint**: `/tmf-api/rolesAndPermissionsManagement/v5/permissionSpecificationSet`
- **Payload**: PermissionSpecificationSet object with:
  - Name: "Admin"
  - Involvement Role: "Admin"
  - Permission specification for full admin access

### When `permissionspec.enabled = false`
- **Service Target**: `{releaseName}-partyroleapi:8080`
- **API Endpoint**: `/tmf-api/partyRoleManagement/v4/partyRole`
- **Payload**: Simple PartyRole object with name "Admin"

## Configuration
The behavior is controlled by the Helm values:

```yaml
permissionspec:
  enabled: true  # Use Permission Specification API (default)
  # enabled: false # Use Party Role API
```

## Docker Image
The existing Docker image (`lesterthomas/roleinitialization:0.4`) will need to be rebuilt to include these changes.

## Backward Compatibility
The changes maintain backward compatibility - existing deployments with `permissionspec.enabled: false` will continue to work with the Party Role API as before.
