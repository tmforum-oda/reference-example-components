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

### T3. Translator module and unit tests ✅ done
- Result: `source/ProductCatalog/shared/tmf620-compat/` (shared with the v5 service, so it is not under the v4 service): `v4ToV5`, `v5ToV4`, `v4Patch` (in place of `checkPatchCompatibility`), `mapFilter`, `mapFields`, `toTmfError`, `warningHeaders`, `normaliseHref`/`buildHref`, `checkV5Value`. Attribute tables are generated from both specs into `generated/shapes.json`; `npm test` fails if they are stale. 46 `node:test` tests, named after the matrix rows; they also pass on Node 16.
- Original scope: `v4ToV5(type, doc)`, `v5ToV4(type, doc) → {doc, warnings[]}`, `mapFilter(type, query)`, `mapFields(type, fields)`, `checkPatchCompatibility(type, stored, patch)`, `normaliseHref`/`buildHref`.
- Drive the mappings from a table generated from (or checked against) the compatibility matrix, not from scattered `if`s. Generate the G2 `@type`-by-position table from the v5 OAS.
- Implement the PATCH array merge by key (matrix "PATCH from v4") so that 409 happens only for unmatched entries.
- `node:test` table-driven tests: each matrix row in both directions, round-trip `v5ToV4(v4ToV5(x)) == x` for every v4 fixture, and each lossy case returning the right warning or error.
- **Depends on:** T1 (T2 for C5).

### T4. Compatibility errors and warnings ✅ done
- Result: `utils/tmf620Storage.js` (`sendProblems`: one TMF Error from `toTmfError`, a `warn` log line and a metric count; `warningCollector`: one `X-TMF-Compatibility-Warning` value per resource and code) and `utils/compatMetrics.js` (counts summed per code, resource and operation and sent in one batch every 2 s; an outage is logged once and the counts are dropped). `errorUtils.js` is unchanged: the compatibility errors are TMF Error bodies built by the shared module. 12 `node:test` tests (`npm test`). Checked end to end: the counts reach `tmf620_compatibility_total` in the metrics service.
- Wire `toTmfError` and the `TMF620-COMPAT-*` codes from `tmf620-compat` into `utils/errorUtils.js` (message builder from spec §7.2 (resource, id, attribute, reason, next step, matrix link).
- Add the `X-TMF-Compatibility-Warning` response header helper and `warn`-level logging.
- Add a compatibility metric reporter (spec §7.3): fire-and-forget POST to `METRICS_COMPATIBILITY_URL`, one count per code per response, never blocking or failing the request. Unit-test the batching and that a metrics outage doesn't affect the response.
- **Depends on:** T3.

## Phase 2: v4 service on v5 storage

### T4a. Compatibility counter in the metrics microservice ✅ done
- Result: `openMetricsMicroservice/compatibility.js` (+ 6 tests). `POST /compatibility` takes one report or an array `{code, resource, operation, count?}`, returns 204, or 400 naming the bad report; nothing is counted unless all are valid. Image `productcatalogmetrics:1.1.0`.
- `openMetricsMicroservice/index.js`: a `<component>_tmf620_compatibility_total` counter with labels `code`, `kind`, `resource` and `operation`; a `POST /compatibility` endpoint that checks the label values against the allowed sets (so labels stay bounded) and increments it. Bump the `productcatalogmetrics` image to `1.1.0`.
- **Depends on:** none (can start straight away).

### T5. Write path ✅ done
- Result: create and patch for the five resources moved into `utils/resourceOperations.js`; the services call it. POST runs the existing v4 steps (validation, `traverse`, common attributes, the #80 `lifecycleStatus` default) and then `v4ToV5`; PATCH uses `v4Patch` (array merge by key, 409 for entries v4 cannot see) and `replaceOne`. Documents get `_schema` and a version-neutral `href`. Events carry the v4 view. A document without `_schema` (not migrated yet, T7) is converted as a whole on its first v4 PATCH. Image `productcatalogapi:1.1.0`; a `.dockerignore` keeps local `node_modules` (with Windows links to `shared/`) out of the images.
- Add `tmf620-compat` as a `file:../../shared/tmf620-compat` dependency and copy `shared/tmf620-compat` into the v4 image, as `prodcat-v5-dockerfile` does.
- In `CatalogService`, `CategoryService`, `ProductOfferingService`, `ProductOfferingPriceService` and `ProductSpecificationService`: apply `v4ToV5` before `insertOne`; implement PATCH as read → v4 view → merge-patch → `v4ToV5` → merge into stored → `checkPatchCompatibility` → write.
- Store `href` version-neutral (change `operationsUtils.js:200`, `:230`) and add `_schema`.
- **Depends on:** T3, T4.

### T6. Read path ✅ done (with T5: v4 reads of v5 documents need it)
- Result: `listResource` and `retrieveResource` map filters and `fields` with `mapFilter`/`mapFields` before `getMongoQuery` (so the #80 date-time equality still applies), return `v5ToV4` views with warning headers, and keep `?fields=` responses to the requested attributes plus `id` and `href`. Documents without `_schema` are returned as stored. Downstream-API results are appended untranslated, as before. Unchanged from before: a date-time *range* filter (`lastUpdate>=…`) matches nothing on v4, because query-to-mongo turns the value into a Date and the attribute is stored as a string; only the equality and prefix form from #80 works.
- Map filters and `fields` in `mongoUtils.getMongoQuery`, `listResource` and `retrieveResource`; apply `v5ToV4` to the results and set warning headers; build the v4 `href` at response time.
- Keep the #80 date-filter behaviour working on the v5 paths.
- **Depends on:** T3, T4.

### T7. Data migration on startup ✅ done
- Result: `migrateDocument` in `tmf620-compat` (moves the V4ONLY paths out with their values, then converts) and `utils/migration.js` in the v4 service, started after the server listens (`TMF620_MIGRATE_ON_STARTUP=false` turns it off). It retries until MongoDB answers and never stops the API from starting. A document is replaced only while it still has no `_schema`, so replicas can run it at once. Quarantine records are upserted by resource and id. A summary line per run, a line per quarantined or failed document, and `W-V4ONLY-QUARANTINED` / error counts with `operation=migration`. Documents it cannot convert are left unchanged and reported again on every start. 5 tests in `tmf620-compat`, 3 in the v4 service; checked against MongoDB in the compose stack (catalog converted in place, `constraint` quarantined, broken specification left alone).
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

### T9. Scaffold `productCatalogV5Microservice` ✅ done
- Result: Express 4 + `express-openapi-validator` 5.6.2 on Node 22 (not `oas3-tools`: see spec §4, point 1). Every in-scope operation answers 501 until T10; out-of-scope ones answer 501 with a clear reason. Request validation lists every problem in one TMF Error. 13 tests, including characterisation tests for S5. `prodcat-v5-dockerfile` builds and runs.
- Original scope: Node.js + `oas3-tools`, following `permissionSpecificationSetMicroservice`: v5 OAS from T1, base path `/{COMPONENT_NAME}/tmf-api/productCatalogManagement/v5/`, request and response validation, OpenTelemetry instrumentation like the v4 service, Swagger UI at `/docs`.
- Add `prodcat-v5-dockerfile`.
- **Depends on:** T1. Can run in parallel with Phase 1–2.

### T10. v5 CRUD on the shared collections ✅ done
- Result: `handlers/resources.js` on `utils/store.js` (MongoDB driver 6.10.0, the same `MONGODB_*` variables and collections as v4; an in-memory store for tests). Filters with `.gt/.gte/.lt/.lte/.ne/.regex` and `>=`/`<=`, comma = any of, `fields`, `offset`/`limit`, `sort`, `X-Total-Count`/`X-Result-Count`. PATCH: merge patch (`application/json` and `application/merge-patch+json`) and JSON Patch; JSON Patch Query answers 501. Unmigrated documents: 500 `TMF620-V5-500-UNMIGRATED` on a GET (lists leave them out since T13). 22 tests, including one that serves every v4-written telco fixture through v5 with response validation on.
- **Changed in T13:** lists leave unmigrated documents out (and log how many) instead of answering 500, so one document the migration cannot convert does not break the whole list; a GET of that document still answers 500.
- **Deviation:** characteristic values that do not fit their `@type` are refused with **400** `TMF620-V5-400-CHARVALUE-TYPE`, not 422: the v5.0.0 OAS defines no 422 response, and response validation enforces that.
- **Found:** the official OAS needs two adjustments before a JSON Schema validator can use it (`utils/spec.js` `validatorSpec`; [upstream draft](upstream-issue-draft-TMF620-v5-oneOf.md)). The example payloads reuse `id` values, which breaks every response validator; and the `oneOf` "ref or value" schemas are not exclusive, so every `relatedParty` was refused. Also fixed in `tmf620-compat`: `relatedParty` on productOffering, productOfferingPrice and category (defined in neither version) now passes through unchanged instead of being restructured.
- Checked against MongoDB with both images: write through either version, read, patch and delete through the other (19 checks), and the BDD `@smoke` feature, 10 of 10.
- POST/GET/list/PATCH/DELETE for the five resources, writing the v5 document as is (`@type`, `_schema`, version-neutral `href`), with `href` built at response time, the default `lifecycleStatus`, filters, `fields`, `offset`/`limit` with `X-Total-Count`/`X-Result-Count`, PATCH returning 200, and `merge-patch+json` (plus JSON Patch if the OAS requires it).
- Refuse documents with no `_schema` marker (spec §8).
- Catalog is served at `/productCatalog` (`@type: ProductCatalog`) from the `Catalog` collection (matrix G1).
- Matrix S5: the validator accepts the Boolean/Float subtypes but never checks `value` against the subtype (found in T9). Run `checkV5Value` from `tmf620-compat` on every characteristic value on POST and PATCH and refuse mismatches with 422; turn the T9 characterisation test for `IntegerCharacteristicValueSpecification` + `"Unlimited"` into a 422 test.
- **Depends on:** T9.

### T11. Local docker-compose for the dev loop ✅ done
- Result: `tests/bdd/docker-compose.yaml` (mongo 5, metrics, v4 and v5 built from this checkout; ports 27087, 14000, 18084, 18085) and `npm run local:up`, `test:local`, `test:local:smoke`, `local:down`. `scripts/run-local.js` points the suite at the containers.
- `source/ProductCatalog/tests/bdd/docker-compose.yaml`: mongo + v4 + v5 on one network, so the BDD suite can run without a cluster.
- **Depends on:** T9 (v4 image builds today).

## Phase 4: BDD test clients

### T12. BDD project skeleton ✅ done
- Result: Cucumber 7 project with profiles, env config, run id, ordered cleanup, README and the `@smoke` F000 connectivity feature (10 scenarios; v4 passes on the local Canvas, v5 404s until T20). Ajv moves to T13 with the response validation.
- `source/ProductCatalog/tests/bdd/`: `package.json` (Cucumber.js at the same major version as oda-canvas, Chai, Axios, Ajv), `cucumber.js` profiles (`v4`, `v5`, `cross`, `compat`, `all`), env config (spec §10.1), `Hooks.js` with run id and ordered cleanup, and a README.
- **Depends on:** none (can start straight away).

### T13. The two test clients ✅ done
- Result: `clients/Tmf620Client.js` (create/get/list/patch/delete, a `Tmf620Response` with status, headers, body, compatibility warnings and schema problems), `Tmf620V4Client.js` and `Tmf620V5Client.js` (paths, FVO builder, merge-patch with `@type`). `clients/schemas.js` validates 2xx bodies (and v5 errors) with Ajv 8 against each version's own spec, with the v5 discriminators applied and v4 `format: uri` read as a URI reference, because the v4 service has always returned a relative `@schemaLocation`. F000 now also runs a create/read/patch/delete round trip per client and resource: 20 of 20 against the compose stack. 7 unit tests show that each validator refuses the other version's shapes.
- **Deviation:** test data is tagged with the run id in the name in both versions, not with `externalIdentifier` on v5: that attribute is v5-only on three resources, and the v4 warnings it causes would get in the way of the F007 checks.
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
- `values.yaml` (`component.tmf620v5.enabled`, `apiv5.*`), `METRICS_COMPATIBILITY_URL` on the v4 deployment, new deployment and service templates for v5, and a second `specification[]` entry (v5) on the existing `productcatalogmanagement` exposed API in `component-productcatalog.yaml` (spec §4.4, §9). Check that the existing v4 ExposedAPI keeps its name across the upgrade.
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
