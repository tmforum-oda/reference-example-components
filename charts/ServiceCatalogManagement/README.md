# Example Service Catalog Management component

This is an example implementation of a [TM Forum Service Catalog Management](https://www.tmforum.org/oda/directory/components-map/production/TMFC006) component (TMFC006).

This folder is the Helm Chart package which you distribute or host in a Helm Chart Repository. The source code is available at [../../source/ServiceCatalogManagement](/source/ServiceCatalogManagement/). The source README contains all the implementation documentation.

## Functionality

### Core function

In its **core function** it implements:
* The *mandatory* TMF633 Service Catalog Management Open API, providing CRUD operations for `ServiceCatalog`, `ServiceCategory`, `ServiceCandidate`, and `ServiceSpecification` resources plus a hub endpoint for event subscriptions.
* The *mandatory* TMF657 Service Quality Management Open API.
* The *optional* TMF701 Process Flow Management Open API (disabled by default).

To enable Process Flow Management:

```
helm install <release name> oda-components/servicecatalogmanagement --set processflow.enabled=true -n components
```

The Service Catalog component includes a Model Context Protocol (MCP) server that exposes the Service Catalog API as a *tool* towards an AI Agent. This feature is **enabled by default**. You can disable it by setting `component.MCPServer.enabled=false`:

```
helm install <release name> oda-components/servicecatalogmanagement --set component.MCPServer.enabled=false -n components
```

### Management function

In its **management function** it implements:
* An open metrics endpoint that counts business events (ServiceCatalog, ServiceCategory, ServiceCandidate, ServiceSpecification create/update/delete). The Prometheus query to graph service catalog creation events is:
  ```
  rate(servicecatalogmanagement_api_counter{NotificationEvent="ServiceCatalogCreateEvent"}[5m])
  ```

* Outbound Open Telemetry events. Configure in `values.yaml`:
  ```yaml
  svcatapi:
    otlp:
      console:
        enabled: false
      protobuffCollector:
        enabled: true
        url: http://observability-opentelemetry-collector.monitoring.svc.cluster.local:4318/v1/traces
  ```

### Security function

In its **security function** it implements:
* The *default* TMF672 User Roles and Permissions API (`permissionspec.enabled: true`) for dynamically managed roles.
* The *alternative* TMF669 Party Role Management API (set `permissionspec.enabled: false`).

## Microservices

The implementation consists of 7 microservices:

* **serviceCatalogMicroservice** — implements the TMF633 Service Catalog Management Open API (ServiceCatalog, ServiceCategory, ServiceCandidate, ServiceSpecification resources).
* **serviceQualityManagementMicroservice** — implements the TMF657 Service Quality Management Open API.
* **processFlowMicroservice** — implements the TMF701 Process Flow Management Open API (conditional on `processflow.enabled`).
* **permissionSpecificationSetMicroservice** / **partyRoleMicroservice** — role management microservice (TMF672 or TMF669, conditional on `permissionspec.enabled`).
* **roleInitializationMicroservice** — bootstraps the initial `canvasRole` PermissionSpecificationSet/PartyRole. Deployed as a Kubernetes Job that runs once on initialisation.
* **openMetricsMicroservice** — implements the open metrics API, counts business events published by the Service Catalog API.
* **serviceCatalogInitializationMicroservice** — registers the metrics microservice as a listener on the Service Catalog hub. Deployed as a Kubernetes Job that runs once on initialisation.
* **MCPServerMicroservice** — MCP server providing AI agent access to the TMF633 Service Catalog API tools (conditional on `component.MCPServer.enabled`).
* **MongoDB** — shared document store for all microservices.

## Installation

Install this component (assuming `kubectl` is connected to a Kubernetes cluster with an operational ODA Canvas):

```
helm install r1 .\servicecatalogmanagement -n components
```

Verify the deployment:

```
kubectl get components -n components
```

Expected output (DEPLOYMENT_STATUS cycles through interim states during deploy):

```
NAME                            DEPLOYMENT_STATUS
r1-servicecatalogmanagement     Complete
```

If the deployment fails, refer to the [Troubleshooting Guide](https://github.com/tmforum-oda/oda-ca-docs/tree/master/Troubleshooting-Guide).

## Configuration

You can configure the component by editing `values.yaml` or using `--set` on the command line.

To use the TMF669 Party Role API instead of TMF672:

```
helm install r1 .\servicecatalogmanagement --set permissionspec.enabled=false -n components
```

### Configuration reference

| Variable Name | Default | Explanation |
|---|---|---|
| `mongodb.port` | `27017` | Port for the MongoDB instance (host derived from release name) |
| `mongodb.database` | `tmf` | Database name |
| `svcatapi.image` | `lesterthomas/servicecatalogapi:0.2` | Docker image for the Service Catalog API microservice |
| `svcatapi.otlp.console.enabled` | `false` | Log OpenTelemetry traces to console |
| `svcatapi.otlp.protobuffCollector.enabled` | `true` | Send OpenTelemetry traces to the OTLP collector |
| `svcatapi.otlp.protobuffCollector.url` | `http://observability-opentelemetry-collector...` | OTLP collector endpoint URL |
| `svcqualapi.image` | `lesterthomas/servicequalityapi:0.2` | Docker image for the Service Quality Management API microservice |
| `processflow.enabled` | `false` | Deploy the TMF701 Process Flow Management API microservice |
| `processflow.image` | `lesterthomas/processflowapi:0.2` | Docker image for the Process Flow API microservice |
| `component.MCPServer.enabled` | `true` | Deploy the MCP server for AI agent access to the Service Catalog API |
| `mcp.image` | `lesterthomas/servicecatalogmcp:0.1` | Docker image for the MCP server microservice |
| `metrics.image` | `lesterthomas/servicecatalogmetrics:0.1` | Docker image for the open metrics microservice |
| `permissionspec.enabled` | `true` | Use TMF672 PermissionSpecificationSet API (set `false` for TMF669 PartyRole) |
| `permissionspec.image` | `lesterthomas/permissionspecapi:0.20` | Docker image for the TMF672 role management microservice |
| `partyrole.image` | `lesterthomas/partyroleapi:1.1` | Docker image for the TMF669 role management microservice |
