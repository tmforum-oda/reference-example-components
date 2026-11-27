# TMF620 v4 + v5 tests

The Product Catalog component serves TMF620 Product Catalog Management **v4** and **v5** side by side. Both APIs share one MongoDB, which stores every resource in the v5 format (issue #87). See [the spec](../../../../specs/87-productcatalog-tmf620-v4-v5/spec.md), §10, for the test design and the [task list](../../../../specs/87-productcatalog-tmf620-v4-v5/tasks.md) for the recorded results.

This folder holds the Cucumber.js (BDD) tests. This README also covers the unit tests and the conformance test kit (CTK) that go with them.

## The kinds of test

| Kind | Where | What it runs against | What it proves |
|---|---|---|---|
| Unit: conversion library | [`shared/tmf620-compat/test`](../../shared/tmf620-compat/test) | nothing: plain functions | v4 ↔ v5 translation of every resource, the compatibility matrix rows (warnings, 409/422/400), PATCH merging, query and href translation, error messages, the stored-document migration. It also checks that the generated v4/v5 shape files match the specs. |
| Unit: v4 service | [`productCatalogV4Microservice/implementation/test`](../../productCatalogV4Microservice/implementation/test) | an in-memory fake of MongoDB | the v4 storage layer (v4 in, v5 stored, v4 out), the startup migration (conversion, quarantine, `lifecycleStatus` default, idempotency, concurrent replicas), and the compatibility counter reporter |
| Unit: v5 service | [`productCatalogV5Microservice/implementation/test`](../../productCatalogV5Microservice/implementation/test) | the v5 app on an in-memory store, over HTTP | routes, filters, paging, sorting, merge and JSON Patch, the API root used by the health check, response validation against the v5 spec, and converting documents still in the v4 format on read |
| Unit: metrics | [`openMetricsMicroservice/compatibility.test.js`](../../openMetricsMicroservice/compatibility.test.js) | the handler with a fake request | the `/compatibility` endpoint that counts `<component>_tmf620_compatibility_total` |
| Unit: BDD support | [`test`](test) | nothing | the test clients' schema validation (each version refuses the other's shapes), the builders that turn telco test data into v4 and v5 bodies, alias placeholders and metric parsing |
| BDD: smoke | `F000` | a running component | every resource list answers on v4 and v5, plus a create/read/patch/delete round trip per resource and client |
| BDD: CRUD | `F001`–`F005` (profiles `crud`, `v4`, `v5`) | a running component | one scenario per operation on each resource, run through v4 and through v5: create, read, list by name, filter by `lifecycleStatus` and `lastUpdate`, `fields`, activate, change, retire (`In design` → `Active` → `Retired`), delete |
| BDD: cross-version | `F006` (`cross`) | a running component | for a resource created through one version: the other reads the same business content with no warnings; a change through the other is seen in the first; lists agree; a delete is a 404 in the other |
| BDD: compatibility | `F007` (`compat`) | a running component | one scenario per matrix row where v4 cannot carry everything v5 holds: the warning header, or the error code and message; v5-only data surviving a v4 update; a refused write storing nothing; the compatibility counter going up |
| BDD: end to end | `F008` (`e2e`) | a running component | the whole Example Telco catalogue: the consumer catalogue built through v4, the small-business catalogue through v5 on top of it, a v5-only enrichment, filters in both versions, and a teardown that checks nothing is left |
| CTK | the TM Forum image `tmforumorg/tmf620-v4.1.0-ctk` | the v4 API of a running component | the v4 API still conforms to TMF620 v4.1.0 now that it stores v5 |

The unit tests need no database or cluster and take seconds. The BDD tests and the CTK need a running component: either the local docker-compose stack or a release on an ODA Canvas.

## How the BDD tests work

* **One behaviour per scenario.** Every scenario stands alone: `Given` steps create what it needs (`Given the 'catalog' 'consumer' has been created from the telco catalogue`, `Given the 'v5' client has created the 'productOffering' 'enriched offering' with:`), then one `When` does the thing being checked. A failure points at one operation, and scenarios can run in any order. F007 has one `Rule` per row of the compatibility matrix; where a row has several scenarios, the Rule's `Background` creates their data. In F008 the `Background` builds the whole telco catalogue through both versions for each scenario.
* **Two clients, one interface.** [`clients/Tmf620V4Client.js`](clients/Tmf620V4Client.js) and [`clients/Tmf620V5Client.js`](clients/Tmf620V5Client.js) both extend [`clients/Tmf620Client.js`](clients/Tmf620Client.js) and offer `create`, `get`, `list`, `patch`, `delete` and `build`. Each knows its own base path, request shapes and PATCH content type. A response holds the status, headers, body, any compatibility warnings and any schema problems.
* **Each response is checked against its own spec.** [`clients/schemas.js`](clients/schemas.js) validates every successful body (and v5 error bodies) with Ajv against that version's OpenAPI document, with the v5 discriminators applied. The step `the response matches the TMF620 '<version>' specification` therefore fails if a v4 client ever gets v5-shaped data, or the reverse.
* **Test data is written once.** [`testData/telco-catalogue.yaml`](testData/telco-catalogue.yaml) describes the Example Telco catalogue (catalogs, categories, specifications, prices, offerings) with no version-specific shapes. [`testData/v4/builders.js`](testData/v4/builders.js) and [`testData/v5/builders.js`](testData/v5/builders.js) turn an entry into a create body for that version and resolve references to entries created earlier in the scenario. The step `Given the telco catalogue entries that the '<kind>' '<key>' refers to exist` creates what an entry needs first (for an offering: its specification, prices and categories).
* **Aliases.** Steps in F006–F008 name the API version on every call (`When the 'v5' client retrieves the 'ff1000'`) and refer to resources by an alias: a telco catalogue key, or a name the scenario gives a resource it creates from inline JSON. In a JSON doc string, an attribute value or a filter value, `{{id:<alias>}}` and `{{name:<alias>}}` stand for that resource's id and name.
* **Metric checks.** F007 reads `<component>_tmf620_compatibility_total` from the metrics endpoint ([`support/metrics.js`](support/metrics.js)) before and after the call and expects the series for the scenario's `code` to go up. The services send their counts every 2 seconds, so a check waits up to 10 seconds.
* **Isolation and cleanup.** Every run has a run id (`bdd-<date>-<random>`), and every resource a scenario creates carries it in its name, so runs don't see each other's data and lists can be filtered to one run. After each scenario, [`features/step-definition/Hooks.js`](features/step-definition/Hooks.js) deletes what it created, dependants first. If something cannot be deleted, a scenario that had passed fails, so leftovers don't go unnoticed.
* **Tags and profiles.** [`cucumber.js`](cucumber.js) maps the tags in the feature files to profiles: `@smoke`, `@crud`, `@v4` and `@v5` (on the Examples rows), `@cross`, `@compat`, `@e2e`. `@SkipTest` is never run. Results go to the console (progress format) and to `reports/cucumber.json`.

## Running the tests

Install once, from this folder:

```sh
npm install
```

### Unit tests

```sh
npm run test:unit                                               # BDD support code (this folder)
(cd ../../shared/tmf620-compat && npm install && npm test)
(cd ../../productCatalogV4Microservice/implementation && npm install && npm test)
(cd ../../productCatalogV5Microservice/implementation && npm install && npm test)
(cd ../../openMetricsMicroservice && npm install && node --test compatibility.test.js)
```

They use the built-in `node --test` runner, so they need Node 18 or later.

### BDD against the local docker-compose stack (no cluster)

[`docker-compose.yaml`](docker-compose.yaml) builds MongoDB, the metrics microservice and both APIs from this checkout:

```sh
npm run local:up            # docker compose up -d --build --wait
npm run test:local:smoke    # F000 only
npm run test:local          # every profile
npm run local:down          # stops the stack and deletes the data
```

v4 is on port 18084, v5 on 18085, metrics on 14000 and MongoDB on 27087 (for seeding and inspecting data). [`scripts/run-local.js`](scripts/run-local.js) points the base URLs and the metrics URL at those ports. To run one profile against the stack, pass it through: `node scripts/run-local.js --profile compat`.

### BDD against a component on an ODA Canvas

Install the chart with v5 enabled (the default), wait for both ExposedAPIs to be ready (`kubectl get exposedapis -n components`), then run through the Canvas API gateway:

```sh
npm run test:smoke          # F000: start here
npm test                    # everything not tagged @SkipTest
npm run test:v4             # or test:v5, test:crud, test:cross, test:compat, test:e2e
```

The defaults fit a release called `r1` behind the gateway at `https://localhost`. For another release name (PowerShell):

```powershell
$env:RELEASE_NAME = 'pc'; npm run test:smoke
```

To check that every step has a definition without calling anything:

```sh
npm run test:dry-run
```

### Configuration

| Variable | Default | Meaning |
|---|---|---|
| `CANVAS_GATEWAY_URL` | `https://localhost` | Canvas API gateway |
| `RELEASE_NAME` | `r1` | Helm release of the component |
| `COMPONENT_NAME` | `<RELEASE_NAME>-productcatalogmanagement` | Component name in the API path |
| `TMF620_V4_BASE_URL` / `TMF620_V5_BASE_URL` | built from the three above | Override the API base URLs, e.g. for the local docker-compose stack |
| `PRODCAT_METRICS_URL` | `<CANVAS_GATEWAY_URL>/<COMPONENT_NAME>/metrics` | Metrics endpoint for the compatibility counter checks (F007) |
| `TMF620_ACCESS_TOKEN` | none | Bearer token, if the gateway needs one |
| `TMF620_TLS_INSECURE` | `true` for localhost only | Accept the Canvas's self-signed certificate |
| `TMF620_TIMEOUT_MS` | `30000` | Request timeout |
| `TMF620_RUN_ID` | `bdd-<date>-<random>` | Run id put in the name of every resource created |
| `TMF620_KEEP_DATA` | unset | Keep the created resources instead of deleting them after each scenario (for debugging) |
| `DEBUG_LOGS` | unset | Log every request and response |

### TMF620 v4.1.0 CTK

The CTK is a Postman/newman suite published as a Docker image. It reads a `config.json` whose `url` is the v4 base URL, ending with `/`, for example `https://host.docker.internal/r1-productcatalogmanagement/tmf-api/productCatalogManagement/v4/` for a Canvas on Docker Desktop. It writes its reports to the mounted folder:

```sh
docker run --rm -v "$PWD/config.json:/config/config.json" -v "$PWD/reports:/app/reports" tmforumorg/tmf620-v4.1.0-ctk:1.0.1
```

`reports/jsonResults.json` holds the request and assertion counts. Run it on an empty catalogue, or on one whose resources all have the attributes TMF620 v4 makes mandatory: the CTK checks every resource a list returns, not only its own.
