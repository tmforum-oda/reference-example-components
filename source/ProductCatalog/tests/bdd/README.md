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

Profiles: `smoke`, `crud` (F001–F005), `v4`, `v5`, `cross` (write with one version, read with the other), `compat` (the compatibility errors and warnings), `e2e`, `all`.

## Local stack (no cluster)

`docker-compose.yaml` runs MongoDB, the metrics microservice and both APIs, built from this checkout:

```sh
npm run local:up            # docker compose up -d --build --wait
npm run test:local:smoke    # or test:local for everything
npm run local:down          # stops it and deletes the data
```

v4 is on port 18084, v5 on 18085, metrics on 14000, and MongoDB on 27087 for seeding and inspecting data.

## Test clients

`clients/Tmf620V4Client.js` and `clients/Tmf620V5Client.js` share one interface (`create`, `get`, `list`, `patch`, `delete`, `build`). Each checks every successful response against its own version's spec (`clients/schemas.js`), so the step `the response matches the TMF620 '<version>' specification` fails if a v4 client ever gets v5-shaped data, or the reverse.

## Test data

`testData/telco-catalogue.yaml` describes the Example Telco catalogue once, without version-specific shapes. `testData/v4/builders.js` and `testData/v5/builders.js` turn an entry into a create body for that version, resolving references to entries created earlier in the scenario. The step `Given the telco catalogue entries that the '<kind>' '<key>' refers to exist` creates what an entry needs first (for an offering: its specification, prices and categories).

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
