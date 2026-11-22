# TMF620 v4 + v5 BDD test clients

Cucumber.js tests for the Product Catalog component's TMF620 Product Catalog Management APIs, v4 and v5, which share one MongoDB (issue #87). See [the spec](../../../../specs/87-productcatalog-tmf620-v4-v5/spec.md), §10.

## Run

```sh
npm install
npm run test:smoke                  # F000: every resource list answers on v4 and v5
npm test                            # everything not tagged @SkipTest
npm run test:dry-run                # check that every step has a definition
npm run test:unit                   # unit tests for the support code
```

Profiles: `smoke`, `v4`, `v5`, `cross` (write with one version, read with the other), `compat` (the compatibility errors and warnings), `e2e`, `all`.

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `CANVAS_GATEWAY_URL` | `https://localhost` | Canvas API gateway |
| `RELEASE_NAME` | `r1` | Helm release of the component |
| `COMPONENT_NAME` | `<RELEASE_NAME>-productcatalogmanagement` | Component name in the API path |
| `TMF620_V4_BASE_URL` / `TMF620_V5_BASE_URL` | built from the three above | Override the API base URLs, e.g. for a local docker-compose |
| `PRODCAT_METRICS_URL` | none | Metrics endpoint for the compatibility counter checks |
| `TMF620_ACCESS_TOKEN` | none | Bearer token, if the gateway needs one |
| `TMF620_TLS_INSECURE` | `true` for localhost only | Accept the Canvas's self-signed certificate |
| `TMF620_TIMEOUT_MS` | `30000` | Request timeout |
| `TMF620_KEEP_DATA` | unset | Keep the created resources instead of deleting them after each scenario |
| `DEBUG_LOGS` | unset | Log every request and response |

Every resource a scenario creates is named with the run id and deleted after the scenario, dependants first.

PowerShell example for a release called `pc`:

```powershell
$env:RELEASE_NAME = 'pc'; npm run test:smoke
```
