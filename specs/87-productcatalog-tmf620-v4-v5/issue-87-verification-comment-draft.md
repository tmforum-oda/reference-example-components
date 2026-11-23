## Verification results (branch `feature/87-productcatalog-tmf620-v4-v5`)

The Product Catalog component now serves TMF620 **v4** and **v5** side by side. Both use one MongoDB that stores everything in the v5.0.0 format. I've tested it locally: on docker-compose, and on a local ODA Canvas (Docker Desktop Kubernetes 1.30, `canvas-oda` 1.2.6-rc9, Istio gateway) with images built from the branch and never pushed. The design is in [`spec.md`](https://github.com/tmforum-oda/reference-example-components/blob/feature/87-productcatalog-tmf620-v4-v5/specs/87-productcatalog-tmf620-v4-v5/spec.md), the v4 ↔ v5 differences are in the [compatibility matrix](https://github.com/tmforum-oda/reference-example-components/blob/feature/87-productcatalog-tmf620-v4-v5/specs/87-productcatalog-tmf620-v4-v5/compatibility-matrix.md), and the full results are in [`tasks.md`](https://github.com/tmforum-oda/reference-example-components/blob/feature/87-productcatalog-tmf620-v4-v5/specs/87-productcatalog-tmf620-v4-v5/tasks.md).

### What changed

- **v4 service** (`productcatalogapi` 1.1.0): translates v4 ↔ v5 on every read and write through a shared library (`shared/tmf620-compat`).
  - When v4 can't carry everything v5 holds, it sends a warning header.
  - Writes it can't store without losing data are refused with `409`, `422` or `400`, with a message that points to v5.
  - On startup it migrates existing v4 data to v5. v4-only attributes go to `MigrationQuarantine`, and records with no `lifecycleStatus` get `In design`.
- **New v5 service** (`productcatalogapiv5` 1.0.0): CRUD on the same collections, plus JSON Patch. It also converts documents still in the v4 format when it reads them (needed for the rolling-update overlap).
- **Metrics** (`productcatalogmetrics` 1.1.0): a new counter, `<component>_tmf620_compatibility_total{code,kind,resource,operation}`.
- **Chart 1.5.0:**
  - `component.tmf620v5.enabled` (default `true`).
  - A second `specification[]` entry on `productcatalogmanagement`, so the Canvas creates a second ExposedAPI. The existing v4 ExposedAPI keeps its name.
- **MCP** (`productcatalogmcp` 1.1.0): v4-only `constraint` removed from the examples and tool descriptions.
- **BDD tests:** Cucumber.js, in `source/ProductCatalog/tests/bdd`, with separate v4 and v5 clients that check every response against that version's OAS.

### Acceptance criteria (spec §12)

| Criterion | Result |
|---|---|
| One component, two ready ExposedAPIs | ✅ `…-productcatalogmanagement-v4` and `…-v5` ready with gateway routes |
| Store holds only v5 data after migration | ✅ Documents that can't be converted are left as they are, logged and counted; v5 refuses them with `500 TMF620-V5-500-UNMIGRATED` (by design, spec §8) |
| CRUD for all five resources in both versions (F001–F005) | ✅ 208 scenarios |
| Cross-version (F006) | ✅ 50 scenarios |
| Every compatibility matrix row tested; no silent v5 data loss through v4 (F007) | ✅ 32 scenarios, one Rule per lossy row; the seamless rows are covered by unit tests and round trips |
| End-to-end telco catalogue, nothing left behind (F008) | ✅ 8 scenarios |
| v4 CTK no regression; MCP, init job, federation | ✅ TMF620 v4.1.0 CTK 44/44 requests, all assertions pass (compose, Canvas, and after upgrading with migrated data). Init job and federation ✅ on the Canvas. MCP ✅ on compose only (see below) |
| Upgrade from chart 1.4.5 | ✅ 34 seeded documents: 33 converted, 2 of them with attributes quarantined, and 1 that couldn't be converted left as it was. Everything reads back through both versions, and the v4 ExposedAPI keeps its UID |
| Compatibility counter scraped by the Canvas Prometheus | ⚠️ It counts with the right labels. Without a ServiceMonitor, though, the Canvas Prometheus doesn't scrape it (see below) |

**Full BDD suite on the Canvas: 348/348 scenarios, 2388 steps, in 4m31s.**

**Unit tests:**

| Suite | Tests |
|---|---|
| `tmf620-compat` | 54 |
| v4 service | 16 |
| v5 service | 25 |
| BDD support | 22 |
| metrics | 6 |

### Found along the way (not caused by #87)

1. **Canvas Prometheus doesn't scrape component metrics.**
   - kube-prometheus-stack only picks up ServiceMonitors.
   - The API operator only adds `prometheus.io/*` annotations, so the existing `_api_counter` isn't scraped either.
   - With a temporary ServiceMonitor the target was up and the counter showed 15 series from the compatibility run.
   - Probably worth an oda-canvas issue.
2. **The Canvas refuses the Component when `component.MCPServer.enabled=true`.**
   - The Component v1 CRD requires `specification` on every exposed API, and the `productcatalogmcp` entry has none.
   - Same on `master` (chart 1.4.5).
3. **The published `productcatalogapi:1.0.0` image is older than `master`.**
   - It doesn't set the default `lifecycleStatus` (the #80 fix was never published).
   - So data written through chart 1.4.5 fails the v4 CTK's mandatory-attribute checks.
   - The 1.5.0 migration now fills in `In design`.
4. **Upgrade with `--reuse-values` fails.**
   - `helm upgrade --reuse-values` from 1.4.5 fails because `component.tmf620v5` is nil.
   - Use plain values or `--reset-then-reuse-values` (documented in the chart README).
5. **The TMF620 v5.0.0 OAS has two defects**, which I've drafted upstream issues for:
   - the characteristic value discriminator;
   - a `oneOf` problem.

### Differences left between v4 and v5

- A partial page is `206` in v4 and `200` in v5.
- v4 also matches a partial `lastUpdate` date.
- v5 doesn't federate. Dependent-API federation is still a v4-only feature.
- No TMF620 v5 CTK was available to run.
