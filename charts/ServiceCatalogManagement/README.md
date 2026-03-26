# TMFC006 - Service Catalog Management

A reference example ODA Component implementing the TM Forum TMFC006 Service Catalog Management specification.

## APIs Implemented

| API | TMF Spec | Status |
|-----|----------|--------|
| Service Catalog Management | TMF633 v4 | Mandatory (always deployed) |
| Service Quality Management | TMF657 v4 | Mandatory (always deployed) |
| Process Flow Management | TMF701 v4 | Optional (disabled by default) |
| MCP Server | - | Optional (enabled by default) |

## Docker Images

| Microservice | Image |
|-------------|-------|
| serviceCatalogMicroservice | `lesterthomas/servicecatalogapi:0.1` |
| serviceQualityManagementMicroservice | `lesterthomas/servicequalityapi:0.1` |
| processFlowMicroservice | `lesterthomas/processflowapi:0.1` |
| serviceCatalogInitializationMicroservice | `lesterthomas/servicecataloginitialization:0.1` |
| MCPServerMicroservice | `lesterthomas/servicecatalogmcp:0.1` |

## Building Docker Images

```bash
cd source/ServiceCatalogManagement
./builddockerfile.sh
```

## Deploying with Helm

```bash
helm install r1 charts/ServiceCatalogManagement
```

### Enable Process Flow Management

```bash
helm install r1 charts/ServiceCatalogManagement --set processflow.enabled=true
```

### Disable MCP Server

```bash
helm install r1 charts/ServiceCatalogManagement --set component.MCPServer.enabled=false
```

## MCP Server

The MCP server exposes the following tools for AI agent access to the Service Catalog API:

- `service_catalog_get` / `service_catalog_create` / `service_catalog_update` / `service_catalog_delete`
- `service_category_get` / `service_category_create` / `service_category_update` / `service_category_delete`
- `service_candidate_get` / `service_candidate_create` / `service_candidate_update` / `service_candidate_delete`
- `service_specification_get` / `service_specification_create` / `service_specification_update` / `service_specification_delete`

The MCP endpoint is available at: `/<release-name>-servicecatalogmanagement/mcp`
