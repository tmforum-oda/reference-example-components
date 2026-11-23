# Draft issue for `tmforum-oda/oda-canvas`

**Title:** Component metrics are not scraped with the default Canvas settings and the observability-stack Prometheus (`PrometheusAnnotation` vs ServiceMonitor-only discovery)

---

## Summary

With the default `canvas-oda` values and the Canvas's own `observability-stack` chart, Prometheus scrapes no component metrics. The API operator handles a component's `prometheus` ExposedAPI by adding `prometheus.io/*` annotations to the pod. The Prometheus that `observability-stack` installs (kube-prometheus-stack) only finds targets through ServiceMonitors and PodMonitors, so it ignores those annotations. The ExposedAPI still shows as ready, so nothing points to the gap.

## Observed

Environment: Docker Desktop Kubernetes 1.30, `canvas-oda` 1.2.6-rc9 installed with default values, `observability-stack` 0.1.0 in `monitoring`, and Product Catalog from `reference-example-components` installed as release `r1`.

- `api-operator-istio-configmap` has `OPENMETRICS_IMPLEMENTATION: PrometheusAnnotation`. This comes from the `canvas-oda` default, `api-operator-istio.deployment.openMetricsImplementation: "PrometheusAnnotation"`. The `api-operator-kong` and `api-operator-apisix` blocks have the same default.
- The ExposedAPI `r1-productcatalogmanagement-metrics` (`apiType: prometheus`) is ready, and the metrics pod has `prometheus.io/scrape: "true"` annotations.
- `kubectl get servicemonitor -n components` returns nothing. The only ServiceMonitors in the cluster are the stack's own, in `monitoring`.
- The `Prometheus` resource has `serviceMonitorSelector: {}`, `serviceMonitorNamespaceSelector: {}` and `podMonitorSelector: {matchLabels: {release: observability}}`. It has no annotation-based scrape config.
- In Prometheus, `r1_productcatalogmanagement_api_counter` and every other series from the component return 0 series, even after traffic that the metrics endpoint does count.
- After adding a ServiceMonitor by hand for `r1-productcatalogmanagement-sm` (port 4000, `/metrics`), the target was `up` and the series showed up. I removed it afterwards.

## Why

- `charts/canvas-oda/values.yaml` defaults `openMetricsImplementation` to `PrometheusAnnotation` for the Istio, Kong and APISIX operators.
- The operator code (`apiOperatorIstio.py`) defaults to `ServiceMonitor` when the variable is unset, and `charts/api-operator-istio/values.yaml` sets `ServiceMonitor`. The umbrella chart overrides both.
- `charts/observability-stack/README.md` does say to set `--set api-operator-istio.deployment.openMetricsImplementation=ServiceMonitor`. But the two charts are installed separately, and the main installation steps don't mention it.

So the default Canvas install and the reference observability stack don't work together.

## Suggested fix (any one of these)

1. Make `ServiceMonitor` the `canvas-oda` default for the API operators, to match the operator code and the `api-operator-istio` chart. A Canvas without the Prometheus Operator CRDs would then need `PrometheusAnnotation` set explicitly, or the operator could fall back when the `ServiceMonitor` CRD is missing.
2. Or have `observability-stack` also scrape annotated pods, for example through an `additionalScrapeConfigs` job that honours `prometheus.io/scrape`, `port` and `path`.
3. At the least, put the `openMetricsImplementation=ServiceMonitor` setting in the main installation guide next to the observability-stack install. Ideally, also add a BDD check that a component's metrics series can be queried in Prometheus, not only that the ExposedAPI is ready.

## Notes

- Not specific to one component: the existing `<release>_productcatalogmanagement_api_counter` is not scraped either.
- Related: #655 (the tutorial's metric name), which was tested with `openMetricsImplementation=ServiceMonitor` and so didn't hit this. Also related: #650 (the Kong operator never created the ServiceMonitor; closed).
- Found while testing tmforum-oda/reference-example-components#87, which adds a `<component>_tmf620_compatibility_total` counter to the Product Catalog.
