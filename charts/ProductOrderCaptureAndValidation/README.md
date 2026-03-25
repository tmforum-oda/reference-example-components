# Example Product Order Capture And Validation component

This is an example implementation of a [TM Forum Product Order Capture And Validation](https://www.tmforum.org/oda/directory/components-map/core-commerce-management/TMFC002) component.

This folder is the Helm Chart package which you distribute or host in a Helm Chart Repository. This README describes the functionality of the component. The source code is available at [../source/ProductOrderCaptureAndValidation](/source/ProductOrderCaptureAndValidation/). The source file readme contains all the implementation documentation.

## Functionality

### Core function

In its **core function** it implements:
* The *mandatory* TMF622 Product Ordering Management Open API.
* A *dependent* integration with one or more downstream TMF620 Product Catalog Management Open APIs to validate that product offerings referenced in an order actually exist.
* A *dependent* integration with one or more downstream TMF637 Product Inventory Management Open APIs to create product instances once an order is accepted.

When an order is submitted (POST `/productOrder`), the component:
1. Validates each `productOrderItem.productOffering.id` against the downstream Product Catalog.
2. If all offerings are valid, sets the order state to `acknowledged` and persists it.
3. For each order item with `action: add`, creates the corresponding product in the downstream Product Inventory.

The dependent API integrations are enabled by default (both TMF620 and TMF637 are mandatory for this component). To disable them (e.g. for standalone testing without downstream systems), set `component.dependentAPIs.enabled=false`:

```
helm install <release name> oda-components/productordercaptureandvalidation --set component.dependentAPIs.enabled=false -n components
```

### Management function

In its **management function** it implements:
* An *optional* metrics API supporting the open metrics standard (formerly the prometheus de-facto standard). This metrics endpoint provides business metrics about all the Create/Update/Delete events for all the Product Ordering resources (ProductOrder, CancelProductOrder).

The reference Canvas includes a Prometheus observability service that can scrape the metrics API. For example, you can query the rate of ProductOrder create events with:

```
rate(r1-productordercaptureandvalidation_api_counter{NotificationEvent="ProductOrderCreationNotification"}[5m])
```

* Outbound Open Telemetry events. The component also generates Open-Telemetry events that can either be logged to the console using `otlp.console.enabled:true` or sent to an Open-Telemetry protobuffCollector. You can set this in the `values.yaml` file as follows:

```yaml
  otlp:
    console:
      enabled: false
    protobuffCollector:
      enabled: true
      url: http://observability-opentelemetry-collector.monitoring.svc.cluster.local:4318/v1/traces
```

### Security function

In its **security function** it implements:
* The *optional* TMF672 User Roles and Permissions or the TMF669 Party Role Management Open API for dynamically managed roles. The default is to use TMF672 (TMF669 will be deprecated in the future). The API to use is set in the values file `permissionspec.enabled=true`.

## Microservices

The implementation consists of 6 microservices:

* **productOrderingMicroservice** — implements the TMF622 Product Ordering Management Open API. Stores ProductOrder and CancelProductOrder resources in MongoDB, validates orders against a downstream Product Catalog, creates products in a downstream Product Inventory, and publishes events to registered listeners.
* **roleInitializationMicroservice** — bootstraps the initial PermissionSpecificationSet (TMF672) or PartyRole (TMF669) on first deploy. Deployed as a Kubernetes Job that runs once.
* **productOrderInitializationMicroservice** — registers the metrics microservice as a listener for product ordering business events. Deployed as a Kubernetes Job that runs once.
* **openMetricsMicroservice** — implements the Prometheus/OpenMetrics endpoint that counts TMF622 business events received via the hub.
* **MongoDB** — a simple MongoDB deployment used as the backing store for all API resources.
* **Role management microservice** — implements either the TMF672 User Roles and Permissions API (default) or the TMF669 Party Role Management API.

## Installation

Install this component (assuming the kubectl config is connected to a Kubernetes cluster with an operational ODA Canvas) using:

```
helm install r1 .\productordercaptureandvalidation -n components
```

You can test the component has deployed successfully using:

```
kubectl get components -n components
```

You should get an output like:

```
NAME                                    DEPLOYMENT_STATUS
r1-productordercaptureandvalidation     Complete
```

The `DEPLOYMENT_STATUS` will cycle through a number of interim states as part of the deployment. If the deployment fails, refer to the [Troubleshooting-Guide](https://github.com/tmforum-oda/oda-ca-docs/tree/master/Troubleshooting-Guide).

To disable the downstream Product Catalog and Product Inventory dependent API integrations (e.g. for standalone testing):

```
helm install r1 .\productordercaptureandvalidation --set component.dependentAPIs.enabled=false -n components
```

## Configuration

You can configure the following aspects of the component by changing the values in `values.yaml`, or by using `--set` on the command line.

| Variable Name | Default | Explanation |
|---|---|---|
| `mongodb.port` | `27017` | The port to connect to the MongoDB instance. The host is derived from the release name. |
| `mongodb.database` | `tmf` | The database name to connect to in MongoDB. |
| `api.image` | `lesterthomas/productorderingapi:0.1` | The image for the TMF622 Product Ordering API microservice. |
| `api.otlp.console.enabled` | `false` | Whether OpenTelemetry traces are logged to the console instead of being sent to the collector. |
| `api.otlp.protobuffCollector.enabled` | `true` | Whether OpenTelemetry traces are sent to the OTL Collector. Does not apply if `api.otlp.console.enabled` is `true`. |
| `api.otlp.protobuffCollector.url` | `http://observability-opentelemetry-collector.monitoring.svc.cluster.local:4318/v1/traces` | The URL of the OTL Collector endpoint. |
| `metrics.image` | `lesterthomas/productordercaptureandvalidationmetrics:0.1` | The image for the OpenMetrics microservice. |
| `permissionspec.enabled` | `true` | When `true`, deploys the TMF672 Permission Specification Set API. When `false`, deploys the TMF669 Party Role API. |
| `permissionspec.image` | `lesterthomas/permissionspecapi:0.20` | The image for the TMF672 Permission Specification Set microservice. |
| `partyrole.image` | `lesterthomas/partyroleapi:1.1` | The image for the TMF669 Party Role microservice (used when `permissionspec.enabled=false`). |
| `component.dependentAPIs.enabled` | `true` | When `true`, declares the TMF620 and TMF637 dependent APIs in the Component CRD so the Canvas can wire up downstream connections. Both are mandatory for order validation and inventory creation. |
| `component.dependentAPIs.rejectUnauthorizedCertificates` | `false` | When `true`, the API microservice will reject self-signed TLS certificates from downstream APIs. |
| `canvasinfo.host` | `info.canvas.svc.cluster.local` | The Canvas Info service hostname used to discover dependent API URLs at runtime. |
| `canvasinfo.basepath` | `/` | The base path for the Canvas Info Service Inventory API. |
