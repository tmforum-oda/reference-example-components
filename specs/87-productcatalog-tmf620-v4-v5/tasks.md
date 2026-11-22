# Tasks: TMF620 v4 + v5 side by side (issue #87)

Spec: [spec.md](spec.md). Branch: `feature/87-productcatalog-tmf620-v4-v5` (local only, no PR until the local Canvas verification in Phase 5 passes).

Legend: **Depends on** lists the tasks that must be done first. Tasks with no dependency between them can run in parallel.

## Phase 0: Ground truth

### T1. Compatibility matrix from the official schemas ✅ done
- Result: [compatibility-matrix.md](compatibility-matrix.md). The official v5.0.0 OAS is in `productCatalogV5Microservice/implementation/api/`, and spec §7.1, §13.3 and the PATCH merge rule are updated.
- Get the official TMF620 **v5.0.0** OAS and the v4.0.0 Swagger the service uses. Store the v5 file at `source/ProductCatalog/productCatalogV5Microservice/implementation/api/TMF620-Product_Catalog_Management-v5.0.0.oas.yaml`.
- Diff the five resources (and every nested type they reference) attribute by attribute.
- Write `specs/87-productcatalog-tmf620-v4-v5/compatibility-matrix.md`: one row per difference, with the v4 path, the v5 path, the mapping in each direction, whether it is lossy, the error/warning code and an example payload. Confirm or correct C1–C11 in the spec.
- Answer open question 3 (the v5 spec URL).
- **Done when:** every attribute of the five resources is either mapped or listed as v4-only / v5-only.

### T2. Decide the open questions
- ✅ Q1 (v4-only attributes) decided 2026-11-22: reject with 422; existing data is quarantined (spec §8). Q2 decided 2026-11-22: v5 on by default (`component.tmf620v5.enabled: true`). Q3 decided in T1. Q4 decided 2026-11-22: header + logs + Prometheus metric (spec §7.3).
- Q5 decided 2026-11-22: report upstream; [draft ready](upstream-issue-draft-TMF620-v5-discriminator.md) for the maintainer to post (optionally with the T10 runtime result). **T2 is complete.**
- **Depends on:** T1.

## Phase 1: Translator (v4 service)

### T3. Translator module and unit tests
- `productCatalogMicroservice/implementation/utils/tmf620v5/`: `v4ToV5(type, doc)`, `v5ToV4(type, doc) → {doc, warnings[]}`, `mapFilter(type, query)`, `mapFields(type, fields)`, `checkPatchCompatibility(type, stored, patch)`, `normaliseHref`/`buildHref`.
- Drive the mappings from a table generated from (or checked against) the compatibility matrix, not from scattered `if`s. Generate the G2 `@type`-by-position table from the v5 OAS.
- Implement the PATCH array merge by key (matrix "PATCH from v4") so that 409 happens only for unmatched entries.
- `node:test` table-driven tests: each matrix row in both directions, round-trip `v5ToV4(v4ToV5(x)) == x` for every v4 fixture, and each lossy case returning the right warning or error.
- **Depends on:** T1 (T2 for C5).

### T4. Compatibility errors and warnings
- Add the `TMF620-COMPAT-*` codes to `utils/errorUtils.js` with the message builder from spec §7.2 (resource, id, attribute, reason, next step, matrix link).
- Add the `X-TMF-Compatibility-Warning` response header helper and `warn`-level logging.
- Add a compatibility metric reporter (spec §7.3): fire-and-forget POST to `METRICS_COMPATIBILITY_URL`, one count per code per response, never blocking or failing the request. Unit-test the batching and that a metrics outage doesn't affect the response.
- **Depends on:** T3.

## Phase 2: v4 service on v5 storage

### T4a. Compatibility counter in the metrics microservice
- `openMetricsMicroservice/index.js`: a `<component>_tmf620_compatibility_total` counter with labels `code`, `kind`, `resource` and `operation`; a `POST /compatibility` endpoint that checks the label values against the allowed sets (so labels stay bounded) and increments it. Bump the `productcatalogmetrics` image to `1.1.0`.
- **Depends on:** none (can start straight away).

### T5. Write path
- In `CatalogService`, `CategoryService`, `ProductOfferingService`, `ProductOfferingPriceService` and `ProductSpecificationService`: apply `v4ToV5` before `insertOne`; implement PATCH as read → v4 view → merge-patch → `v4ToV5` → merge into stored → `checkPatchCompatibility` → write.
- Store `href` version-neutral (change `operationsUtils.js:200`, `:230`) and add `_schema`.
- **Depends on:** T3, T4.

### T6. Read path
- Map filters and `fields` in `mongoUtils.getMongoQuery`, `listResource` and `retrieveResource`; apply `v5ToV4` to the results and set warning headers; build the v4 `href` at response time.
- Keep the #80 date-filter behaviour working on the v5 paths.
- **Depends on:** T3, T4.

### T7. Data migration on startup
- Idempotent conversion of documents with no `_schema` marker (spec §8), with logging of converted / skipped / failed documents.
- Move v4-only attributes out of each document into `MigrationQuarantine` (resourceType, id, removed paths and values, migratedAt) before conversion; neither API serves that collection.
- Unit test against a seeded in-memory or local Mongo.
- **Depends on:** T5.

### T8. v4 regression check
- Run the TMF620 v4.1.0 CTK locally against the v4 service (docker-compose: mongo + v4 service). The result must match #80 (396/396).
- Check that the initialization job, MCP server tests (`test_product_catalog_api.py`) and dependent-API federation still work.
- **MCP server:** remove the v4-only `constraint` from `example_payloads/productOfferingPrice.json`, from the `create_product_offering_price` tool example in `product_catalog_mcp_server.py` (around line 1858) and from its Postman collection, so agents aren't taught a payload that now returns 422. Check that an agent which does send it gets a 422 message it can act on.
- The TMF620 v4.0.0 CTK collection in `oda-component-ctk` sends no v4-only attributes (checked 2026-11-22); confirm the same for the v4.1.0 CTK image.
- **Depends on:** T5, T6, T7.

## Phase 3: v5 service

### T9. Scaffold `productCatalogV5Microservice`
- Node.js + `oas3-tools`, following `permissionSpecificationSetMicroservice`: v5 OAS from T1, base path `/{COMPONENT_NAME}/tmf-api/productCatalogManagement/v5/`, request and response validation, OpenTelemetry instrumentation like the v4 service, Swagger UI at `/docs`.
- Add `prodcat-v5-dockerfile`.
- **Depends on:** T1. Can run in parallel with Phase 1–2.

### T10. v5 CRUD on the shared collections
- POST/GET/list/PATCH/DELETE for the five resources, writing the v5 document as is (`@type`, `_schema`, version-neutral `href`), with `href` built at response time, the default `lifecycleStatus`, filters, `fields`, `offset`/`limit` with `X-Total-Count`/`X-Result-Count`, PATCH returning 200, and `merge-patch+json` (plus JSON Patch if the OAS requires it).
- Refuse documents with no `_schema` marker (spec §8).
- Catalog is served at `/productCatalog` (`@type: ProductCatalog`) from the `Catalog` collection (matrix G1).
- Check that the validator accepts `BooleanCharacteristicValueSpecification`/`FloatCharacteristicValueSpecification` despite the missing discriminator mapping (matrix S5); if it doesn't, use the fallback from the matrix and record it for the upstream report.
- **Depends on:** T9.

### T11. Local docker-compose for the dev loop
- `source/ProductCatalog/tests/bdd/docker-compose.yaml`: mongo + v4 + v5 on one network, so the BDD suite can run without a cluster.
- **Depends on:** T9 (v4 image builds today).

## Phase 4: BDD test clients

### T12. BDD project skeleton
- `source/ProductCatalog/tests/bdd/`: `package.json` (Cucumber.js at the same major version as oda-canvas, Chai, Axios, Ajv), `cucumber.js` profiles (`v4`, `v5`, `cross`, `compat`, `all`), env config (spec §10.1), `Hooks.js` with run id and ordered cleanup, and a README.
- **Depends on:** none (can start straight away).

### T13. The two test clients
- `Tmf620Client` interface; `Tmf620V4Client` and `Tmf620V5Client` with version-specific paths (`/catalog` vs `/productCatalog`) and payload builders (the v5 builder sends the FVO-required `lifecycleStatus`, `lastUpdate` and `priceType`); validation of every response against that version's OAS; capture of status, headers and body for the steps.
- **Depends on:** T1, T12.

### T14. Telco catalogue test data
- `testData/telco-catalogue.yaml` (spec §10.2: catalogues, categories, the five specifications with characteristics, seven offerings including the bundle, the prices including recurring, one-off, instalment, usage and discount relationship) plus v4 and v5 builders that render it in each version's shape.
- **Depends on:** T1, T12.

### T15. CRUD features F001–F005
- Scenario Outlines over `v4` and `v5` (spec §10.3), with the lifecycle In design → Active → price change → Retired → DELETE.
- **Depends on:** T13, T14.

### T16. Cross-version feature F006
- Resource × direction outline: create in A → read in B → PATCH in B → read in A → DELETE in A → 404 in B; list parity.
- **Depends on:** T13, T14.

### T17. Compatibility feature F007
- One scenario per matrix row that loses or refuses data (G3, R2, K1, S2–S9, O1, O3, O5, P1–P3). Each also checks that `<component>_tmf620_compatibility_total` went up for the expected `code` (read from the metrics endpoint before and after): warning header on read, 409/422/400 with the documented `code` and message content, and a check that the v5-only data is still there afterwards.
- **Depends on:** T13, T14, T4.

### T18. End-to-end feature F008
- Consumer catalogue built through v4, Small Business catalogue built through v5, a v5 enrichment on a consumer offering, list and filter checks in both versions, clean teardown with nothing left behind.
- **Depends on:** T15, T16.

### T19. Green on docker-compose
- All profiles pass against the T11 stack.
- **Depends on:** T5–T7, T10, T11, T15–T18.

## Phase 5: Chart and local ODA Canvas

### T20. Helm chart
- `values.yaml` (`component.tmf620v5.enabled`, `apiv5.*`), `METRICS_COMPATIBILITY_URL` on the v4 deployment, new deployment and service templates for v5, and the second exposedAPI entry in `component-productcatalog.yaml` (spec §9).
- Chart `1.5.0` with a changelog line; image versions `productcatalogapi:1.1.0` and `productcatalogapiv5:1.0.0`.
- `helm lint` and `helm template`, with the toggle on and off.
- **Depends on:** T1, T9.

### T21. Image config and docs
- Add `productcatalogapiv5` to `dockerbuild-config.yaml` and bump `productcatalogapi` and `productcatalogmetrics`.
- Update the repo `README.md` and the chart README (both versions, the compatibility behaviour, a link to the matrix); regenerate `ProductCatalog-architecture.svg`.
- **Depends on:** T20.

### T22. Local Canvas verification (spec §11)
- Build the images locally with `-local` tags and load them into the cluster (no push); install the chart with image overrides; check both ExposedAPIs are ready (oda-canvas UC003); run every BDD profile through the gateway; run the v4 CTK (and the v5 CTK if one is available).
- **Depends on:** T19, T20.

### T23. Upgrade test
- Chart 1.4.5 + v4 seed data (include a POP with `constraint` and a spec with `charSpecSeq`) → upgrade to 1.5.0 → check the migration log → the v5 client reads the seeded data; the v4 client reads it unchanged except for the v4-only attributes, which are in `MigrationQuarantine`.
- **Depends on:** T7, T22.

### T24. Ready to contribute (maintainer decision)
- Tick the spec §12 acceptance criteria, write the verification results up on #87, and only then decide whether to open a PR.
- **Depends on:** T22, T23.

## Parallel tracks

| Track | Tasks |
|---|---|
| A: v4 translation | T3 → T4 → T5/T6 → T7 → T8 |
| B: v5 service | T9 → T10 → T11 |
| C: BDD clients | T12 → T13/T14 → T15–T18 |
| D: chart | T20 → T21 |
| E: metric | T4a (feeds T4 and T17) |

All four tracks start after T1 (T12 can start before it). They meet at T19 and T22.
