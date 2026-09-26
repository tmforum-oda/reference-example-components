# Example ServiceOrderManagement component

A reference example implementation of [TMFC007 - Service Order Management](https://www.tmforum.org/oda/open-digital-architecture/oda-component-directory/).

## Functionality

### Core function

The component implements the TMF641 Service Ordering Management API which enables:
- Creating and managing service orders for Customer-Facing-Service (CFS) delivery
- Tracking service order lifecycle states (acknowledged, inProgress, completed, failed, etc.)
- Requesting service order cancellations via the CancelServiceOrder resource
- Registering event listeners via the hub endpoint for real-time notifications

**Mandatory exposed API:**
- **TMF641 Service Ordering Management** — `serviceOrder` and `cancelServiceOrder` resources

Install with defaults:
```
helm install <release name> oda-components/serviceordermanagement -n components
```

### Management function

The component exposes a Prometheus/OpenMetrics endpoint on port 4000 that counts business events published by the Service Ordering API (serviceOrderCreateEvent, serviceOrderStateChangeEvent, serviceOrderDeleteEvent, etc.).

Open Telemetry tracing is also supported. Enable the protobuf collector in `values.yaml`:
```yaml
api:
  otlp:
    protobuffCollector:
      enabled: true
      url: http://observability-opentelemetry-collector.monitoring.svc.cluster.local:4318/v1/traces
```

### Security function

The component conditionally deploys either TMF672 PermissionSpecificationSet API (`permissionspec.enabled: true`, default) or TMF669 PartyRole API (`permissionspec.enabled: false`).

## Microservices

- **serviceOrderManagementMicroservice** — Node.js implementation of TMF641 Service Ordering Management API; stores service orders in MongoDB and publishes events to registered listeners
- **serviceOrderManagementInitializationMicroservice** — One-time job that registers the metrics microservice as an event listener on the hub endpoint
- **roleInitializationMicroservice** — One-time job that creates the initial role in the permission/partyrole API on startup
- **openMetricsMicroservice** — Prometheus/OpenMetrics endpoint that counts business events from the Service Ordering API
- **serviceOrderManagementMCPServerMicroservice** — Python/FastMCP server providing AI agent access to service order and cancel service order resources (optional, enable with `component.MCPServer.enabled: true`)

## Installation

```bash
helm install r1 .\serviceordermanagement -n components
```

Verify deployment:
```bash
kubectl get components -n components
```

Expected output:
```
NAME                             TYPE        DEPLOYMENT_STATUS
r1-serviceordermanagement        Component   Complete
```

## Configuration

| Variable Name | Default | Explanation |
|---|---|---|
| `mongodb.port` | `27017` | MongoDB port |
| `mongodb.database` | `tmf` | MongoDB database name |
| `api.image` | `lesterthomas/serviceorderapi:0.1` | Docker image for the TMF641 API microservice |
| `api.otlp.console.enabled` | `false` | Enable OTLP console exporter for tracing |
| `api.otlp.protobuffCollector.enabled` | `true` | Enable OTLP protobuf collector for tracing |
| `api.otlp.protobuffCollector.url` | `http://...` | URL of the OTLP protobuf collector |
| `metrics.image` | `lesterthomas/serviceordermanagementmetrics:0.1` | Docker image for the metrics microservice |
| `permissionspec.enabled` | `true` | Use TMF672 PermissionSpecificationSet API (true) or TMF669 PartyRole API (false) |
| `component.MCPServer.enabled` | `false` | Deploy the MCP server for AI agent access |
| `component.dependentAPIs.enabled` | `false` | Enable dependent API declarations in the Component CRD |
