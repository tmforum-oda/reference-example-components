# Spec: Product Catalog exposes TMF620 v4 and v5 over one v5-format store

| | |
|---|---|
| Issue | [tmforum-oda/reference-example-components#87](https://github.com/tmforum-oda/reference-example-components/issues/87) |
| Component | TMFC001 Product Catalog Management (`charts/ProductCatalog`, `source/ProductCatalog`) |
| Status | Draft, for local ODA Canvas testing before any PR |
| Tasks | [tasks.md](tasks.md) |

## 1. Goal

One Product Catalog component instance serves TMF620 **v4** and **v5** at the same time. Both read and write **the same MongoDB documents**, stored in the **v5 format**. A client can create a resource through v4, change it through v5, read it back through v4 and delete it through either one.

Where v4 cannot express what is stored, or a v4 write would destroy data that only v5 can express, the v4 API tells the client exactly what happened, which attribute is involved, and what to do about it. It never silently drops data written by a v5 client.

Two BDD test clients, one per API version, prove this on a local ODA Canvas using a realistic telco catalogue.

## 2. Scope

**In scope** (both versions): catalog, `category`, `productOffering`, `productOfferingPrice`, `productSpecification`. The catalog resource is **`/catalog` in v4 and `/productCatalog` in v5** (`@type: ProductCatalog`, matrix G1). It is the same stored document.

| Operation | v4 | v5 |
|---|---|---|
| Create | `POST /{resource}` | `POST /{resource}` |
| Read one | `GET /{resource}/{id}` (with `fields`) | `GET /{resource}/{id}` (with `fields`) |
| List | `GET /{resource}` (filters, `fields`, `offset`, `limit`) | same |
| Update | `PATCH /{resource}/{id}` (`application/merge-patch+json`) | `PATCH /{resource}/{id}` (`application/merge-patch+json`; JSON Patch where the v5 OAS defines it) |
| Delete | `DELETE /{resource}/{id}` | `DELETE /{resource}/{id}` |

**Out of scope** (may follow as separate issues): `/hub` and event notifications on v5, `importJob`/`exportJob`, TMF671 Promotion Management, moving the MCP server or dependent-API federation to v5. These keep working on v4 as they do today.

## 3. Current state (what this builds on)

- `productCatalogMicroservice` is a Node.js service generated from the **TMF620 v4.0.0 Swagger 2.0** file (`api/swagger.yaml`) and run with `swagger-tools` 0.10.1, which cannot load OpenAPI 3. The base path is `/{COMPONENT_NAME}/tmf-api/productCatalogManagement/v4/`.
- Documents go into the `{release}-mongodb` database `tmf`, one collection per resource type (`getResponseType(req)`: `Catalog`, `Category`, …).
- `href` is stored as `req.url + "/" + id`, which includes the component name and the `/v4` path (`utils/operationsUtils.js:200`, `:230`). A v5 API reading these documents would hand out v4 links, so this has to change (§6.4).
- The #80 fixes (default `lifecycleStatus`, date-time filters, PATCH returns 200) must keep passing the TMF620 v4 CTK.
- `permissionSpecificationSetMicroservice` already runs a v5 (OAS 3) TMF API with `oas3-tools` and MongoDB, so it is the in-repo pattern for a v5 service.
- The initialization job registers with `/hub` on the v4 service; the MCP server calls the v4 API. Neither changes.

## 4. Architecture

```
                         ODA Canvas API gateway
          ┌──────────────────────┴───────────────────────┐
 .../productCatalogManagement/v4            .../productCatalogManagement/v5
          │                                               │
 ┌────────▼─────────────────┐               ┌─────────────▼────────────┐
 │ {release}-prodcatapi     │               │ {release}-prodcatapiv5   │
 │ swagger-tools, v4 OAS    │               │ express-openapi-validator│
 │ ┌──────────────────────┐ │               │ stores and returns the   │
 │ │ v4⇄v5 translator     │ │               │ v5 document as is        │
 │ │ + compatibility check│ │               └─────────────┬────────────┘
 │ └──────────────────────┘ │                             │
 └────────┬─────────────────┘                             │
          └───────────────►  {release}-mongodb  ◄─────────┘
                             db: tmf, v5-format documents
```

Decisions:

1. **Two deployments, one database.** A new `productCatalogV5Microservice` (Node.js 22, Express and `express-openapi-validator`, driven by the official TMF620 v5.0.0 OAS; `oas3-tools` 2.2.3 was tried and rejected because it cannot parse `application/merge-patch+json` bodies and replaces TMF error bodies with its own), deployed as `{release}-prodcatapiv5`. The v4 service stays on `swagger-tools`. Rewriting the v4 service onto OAS 3 tooling is not needed and would put the #80 CTK results at risk.
2. **The v5 document is the stored document.** The v5 service needs no translation. All compatibility logic lives in one place: the `source/ProductCatalog/shared/tmf620-compat` module, used by the v4 service at the persistence boundary: after v4 request validation, before the database write, and after the database read, before the response.
3. **Same collection names** in both services (`Catalog`, `Category`, `ProductOffering`, `ProductOfferingPrice`, `ProductSpecification`).
4. **One exposed API with two versions.** The Canvas Component v1 schema supports several versions of the same API: each entry in an exposed API's `specification[]` can override `implementation`, `path`, `developerUI`, `port` and `gatewayConfiguration`. The component operator (`normalize_apis` / `build_exposedapi_name` in oda-canvas TMFOP001) turns each entry into its own ExposedAPI named `<component>-<apiName>-<major version>`. So `productcatalogmanagement` (id TMF620) keeps its name and gets two `specification[]` entries:
   - `version: v4`: the v4 spec URL, path `.../productCatalogManagement/v4`, implementation `{release}-prodcatapi` → ExposedAPI `{release}-productcatalogmanagement-productcatalogmanagement-v4` (**the same name as today**, so upgrades don't recreate it)
   - `version: v5`: the v5.0.0 spec URL, path `.../productCatalogManagement/v5`, implementation `{release}-prodcatapiv5`, developerUI `.../v5/docs` → ExposedAPI `…-productcatalogmanagement-v5`

   `version` is set explicitly on both entries rather than left for the operator to infer from the URL.
5. **Helm toggle** `component.tmf620v5.enabled` (default `true`) controls the v5 deployment, service and ExposedAPI entry. With it set to `false`, the chart behaves as it does today, except that the documents are stored in v5 format.

## 5. Storage format

- **Pure v5 only:** nothing v4-specific is stored. v4 requests that set an attribute v5 has no home for are refused (§7; decided in §13.1).
- Every stored document is valid against the **TMF620 v5.0.0 resource schema** (for example `ProductOffering`, not `ProductOffering_FVO`), including the mandatory `@type` on the resource and on every nested `Extensible` object (matrix G2). The stricter create-body rules (FVO: `lifecycleStatus`, `lastUpdate`, `priceType`) apply to v5 clients only (G6).
- Collections keep their current names. The catalog stays in `Catalog`, with `@type: ProductCatalog` and `@baseType: Catalog`.
- Internal fields begin with `_` and are never returned by either API:
  - `_id`: Mongo id (existing)
  - `_schema: "TMF620-5.0.0"`: storage format marker, used by the migration (§8)
- `href` is stored **version-neutral** as `/{resource}/{id}`, for the resource and for internal refs to other resources in this catalogue. Each API builds the absolute `href` at response time from its own base path, so v4 clients get `.../v4/...` links and v5 clients get `.../v5/...` links to the same document. Refs to resources outside this component keep their `href` unchanged.

## 6. v4 translation layer

### 6.1 Write path (v4 POST / PATCH)

1. swagger-tools validates the request against the v4 schema (unchanged).
2. Existing v4 processing runs: `traverse`, `processCommonAttributes`, assignment rules (`lifecycleStatus` default from #80).
3. **`v4ToV5(resourceType, payload)`** produces the v5 document. It adds `@type` values, restructures `relatedParty`, maps characteristic value specifications and normalises `href`s. If the payload sets any v4-only attribute, it refuses the whole request with `422` and lists every offending path in one error, so the client can fix them all at once.
4. **PATCH only:** the service reads the stored v5 document, builds its v4 view (`v5ToV4`), applies the v4 merge-patch to that view, translates the result back with `v4ToV5`, and then **merges** it into the stored v5 document so that v5-only attributes the v4 client cannot see are kept. Arrays the patch replaces are merged **by key**: each entry is matched to a stored entry (by `id`, or `name` for characteristics, per the matrix), and the stored entry's v5-only attributes are carried over. `checkPatchCompatibility(stored, patch)` rejects the patch with `409` only when a stored entry holding v5-only data cannot be matched (matrix `TMF620-COMPAT-409-UNMATCHED`).
5. The v5 document is written. The response is `v5ToV4(stored)`.

### 6.2 Read path (v4 GET one / list)

1. **Filter mapping:** v4 query attribute paths are rewritten to their v5 storage paths, using the table in the matrix (for example `relatedParty.id` → `relatedParty.partyOrPartyRole.id`, `parentId` → `parent.id`). A filter on a v4-only attribute is rejected with `400 TMF620-COMPAT-400-V4ONLY-FILTER`, and a filter value that cannot be converted to the v5 type with `400 TMF620-COMPAT-400-FILTER-VALUE`.
2. **`fields` mapping:** handled the same way. Requested fields are mapped to the v5 paths needed to build them.
3. Each document is translated with `v5ToV4`. When the translation had to leave out or simplify data, the response gets a **`X-TMF-Compatibility-Warning`** header (§7.2) naming the resource id, the attributes involved and the reason. Reads never fail because of v5-only data.

### 6.3 Delete path

`DELETE` removes the stored document. It works the same through both versions and needs no translation.

### 6.4 `href` and ids

- Ids are shared: `id` is the same through both APIs.
- v4 responses build `href` from the v4 base path, and v5 responses from the v5 base path (§5).
- Inbound refs whose `href` points at either version's base path for this component are normalised to `/{resource}/{id}` before storage.

## 7. Compatibility rules and error messages

### 7.1 Differences (confirmed in T1)

The full, row-by-row mapping is in **[compatibility-matrix.md](compatibility-matrix.md)**, taken from the official v5.0.0 OAS. The principle: map without loss wherever possible, warn on reads that leave data out, and refuse writes that would lose data. In summary:

- **Mapped without loss:** the catalog path/type rename (`/catalog` → `/productCatalog`, G1), `@type` on every nested object (G2), `href` base paths (G4), the `relatedParty` restructure (R1), Category `parentId` → `parent` (K1), characteristic attribute renames (S1, S4), attachment ref-or-value (S8).
- **v5-only data, left out of v4 reads with a warning and kept on v4 PATCH:** `externalIdentifier`, `policy`, `allowedAction`, `productOfferingRelationship`, `productOfferingCharacteristic`, `bundledGroupProductOffering`, `intentSpecification`, ProductSpecification `category`, ref `version`s, `PartyRoleRef.partyId/partyName`, characteristic `id`s.
- **v4-only data, refused with `422`** (the store stays pure v5): `ProductOfferingPrice.constraint`, `charSpecSeq`, `serviceSpecification.targetServiceSchema`, `targetProductSchema.@baseType`, `bundledProductOffering[].lifecycleStatus`. Custom `@type` subtypes with `@schemaLocation` are **not** v4-only: they use the TMF extension pattern that v5 shares, and pass through (G3).
- **Refused with a clear error:** characteristic values that don't fit their `valueType` (422), non-integer `valueFrom`/`valueTo` (422, v5 uses integers), attachments with neither `id` nor content (422), v4 PATCHes that would drop v5 entries the array merge can't match, such as embedded prices with no `id` (409), filter values that can't be converted (400).
- **Defect in the v5 spec itself:** the Boolean and Float characteristic-value subtypes are missing from the discriminator mapping (S5). Checked in T9: `express-openapi-validator` accepts them, but it does not check `value` against the subtype at all (an `IntegerCharacteristicValueSpecification` with `value: "Unlimited"` passes). The v5 service therefore runs `checkV5Value` from `tmf620-compat` on every characteristic value (T10). To be reported to TM Forum.

### 7.2 Error and warning format

Errors use the TMF `Error` shape, so existing v4 clients can parse them:

```json
{
  "@type": "Error",
  "code": "TMF620-COMPAT-409-UNMATCHED",
  "status": "409",
  "reason": "Update would discard data that only the TMF620 v5 API can represent",
  "message": "productOffering 6b1d… has 1 productOfferingPrice entry embedded by value with no id (set through the v5 API). TMF620 v4 can only hold price references, so replacing the productOfferingPrice array through v4 would delete it. Patch this attribute through /productCatalogManagement/v5/productOffering/6b1d…, or give the embedded price an id through v5 first.",
  "referenceError": "<link to compatibility-matrix.md, row O1>"
}
```

- `code` is `TMF620-COMPAT-<status>-<RULE>`. Each code is listed in the compatibility matrix.
- `message` always names **the resource and id, the attribute, why v4 cannot handle it, and the next step to take**.
- Statuses: **400** for a filter value that can't be converted, **409** when a write would discard v5 data, **422** when a v4 payload cannot be turned into valid v5.
- Read warning header, once per affected resource (the header is repeated for lists):
  `X-TMF-Compatibility-Warning: W-V5ONLY-ATTR; resource=productOffering/6b1d…; paths=externalIdentifier,policy; see=<matrix link>#o5`
- Each translation that loses data is also logged at `warn` level, with the same text, for Canvas observability.

### 7.3 Compatibility metric

Every compatibility warning and error is also counted, so operators can see how much v4 traffic hits the boundaries, and when it is safe to retire v4.

- **Metric:** `<component>_tmf620_compatibility_total` (a Prometheus counter; `<component>` is `COMPONENT_NAME` with `-` → `_`, the same as the existing `_api_counter`).
- **Labels:** `code` (for example `W-V5ONLY-ATTR`, `TMF620-COMPAT-422-V4ONLY-ATTR`), `kind` (`warning` | `error`), `resource` (`catalog`, `category`, `productOffering`, `productOfferingPrice`, `productSpecification`), `operation` (`create` | `read` | `list` | `patch` | `filter` | `migration`). **No resource ids or attribute paths**: those would make the label set unbounded. They stay in the logs and the warning header.
- **Route:** the v4 service POSTs `{code, kind, resource, operation}` to a new `POST /compatibility` endpoint on the existing metrics microservice (`{release}-{component}-sm:4000`, env var `METRICS_COMPATIBILITY_URL`). The microservice increments the counter, which is exposed on the component's existing management `metrics` API, so the Canvas observability stack scrapes it without changes.
- **Batching and failure:** the v4 service fires and forgets. A list response that produces many warnings sends one count per code, not one call per item. Requests never wait for, or fail because of, the metrics service; if it is down, a debug log line is written and the count is lost.
- The migration (§8) reports its quarantined attributes with `operation=migration`.

## 8. Existing data migration

Existing deployments hold v4-format documents with v4 `href`s. On startup, the v4 service runs an **idempotent migration**: every document in the five collections without `_schema: "TMF620-5.0.0"` is translated with `v4ToV5` and marked. The migration is logged, and documents it cannot convert are reported and left unchanged.

Existing data can't be "rejected", so the 422 rule (§13.1) works differently here. Any v4-only attribute in a stored document (matrix S4, S6, S7, O3, P1) is **moved out** before conversion: one record per document goes into a `MigrationQuarantine` collection (`resourceType`, `id`, the removed paths and their values, `migratedAt`). The main collections stay pure v5, nothing is lost, and the log names every document affected, so an operator can review the quarantine and re-model the data through v5 (for example `constraint` → `policy[]`). Neither API serves `MigrationQuarantine`. The v5 service refuses to serve unmarked documents (`500` with a clear message) rather than return malformed v5.

## 9. Helm chart and component changes

- `values.yaml`: `component.tmf620v5.enabled: true`, plus `apiv5.image`, `apiv5.versionLabel` and `apiv5.otlp` (the same structure as `api`).
- `deployment-productcatalogapi.yaml`: new env var `METRICS_COMPATIBILITY_URL=http://{release}-{component}-sm:4000/compatibility` (§7.3).
- New templates: `deployment-productcatalogapiv5.yaml` and `service-productcatalogapiv5.yaml` (startup probe on `.../v5/catalog`).
- `component-productcatalog.yaml`: a second `specification[]` entry on the existing `productcatalogmanagement` exposed API (§4.4), with the official v5.0.0 spec URL (§13.3), included only when `component.tmf620v5.enabled`.
- Chart `1.4.5` → **`1.5.0`**. `productcatalogapi` image `1.0.0` → `1.1.0`; `productcatalogmetrics` `1.0.0` → `1.1.0` (the new counter); new `productcatalogapiv5:1.0.0`. Add the entries to `dockerbuild-config.yaml`.
- Update `README.md` (repo and chart) and regenerate `ProductCatalog-architecture.svg`.

## 10. BDD test clients

### 10.1 Layout and tooling

Same conventions as `oda-canvas/feature-definition-and-test-kit`: Cucumber.js (same major version), Chai, CommonJS, `'<Param>'` quoting, tags on their own lines.

```
source/ProductCatalog/tests/bdd/
  package.json
  cucumber.js                       # profiles: v4, v5, cross, compat, all
  features/
    TMF620-F001-Catalog-CRUD.feature
    TMF620-F002-Category-CRUD.feature
    TMF620-F003-ProductSpecification-CRUD.feature
    TMF620-F004-ProductOfferingPrice-CRUD.feature
    TMF620-F005-ProductOffering-CRUD.feature
    TMF620-F006-Cross-Version-Interoperability.feature
    TMF620-F007-Compatibility-Boundaries.feature
    TMF620-F008-Telco-Catalogue-End-to-End.feature
    step-definition/
      ProductCatalogCrudSteps.js
      CrossVersionSteps.js
      CompatibilitySteps.js
      Hooks.js                      # run id, cleanup of everything created
  clients/
    Tmf620Client.js                 # shared interface: create/get/list/patch/delete
    Tmf620V4Client.js               # test client 1: v4 paths, v4 payload shapes
    Tmf620V5Client.js               # test client 2: v5 paths, v5 payload shapes (@type etc.)
  testData/
    telco-catalogue.yaml            # one version-neutral description of the catalogue
    v4/ , v5/                       # payload builders/fixtures per version
  README.md
```

- **The two test clients** share the same interface, so a feature file runs against either one: `Given the TMF620 '<apiVersion>' client`. Each client validates every response against its own version's OAS (an Ajv-based schema check), so a v4 client fails if the translator ever returns v5-shaped data, and the reverse.
- **Configuration** through environment variables: `TMF620_V4_BASE_URL` and `TMF620_V5_BASE_URL` (defaults built from `CANVAS_GATEWAY_URL=https://localhost` and `RELEASE_NAME=r1`), optional `TMF620_ACCESS_TOKEN` and `TMF620_TLS_INSECURE=true` for the local Canvas's self-signed certificate.
- **Isolation:** every scenario tags what it creates with a run id (`externalIdentifier` on v5, name suffix on v4), and the `After` hooks delete it in dependency order (offerings → prices → specifications → categories → catalogs).

### 10.2 Telco catalogue test data (brand-neutral: "Example Telco")

| Resource | Data |
|---|---|
| Catalog | *Example Telco Consumer Catalogue*; *Example Telco Small Business Catalogue* |
| Category | Mobile › SIM-only Plans, Mobile › Handsets, Home Broadband, TV & Entertainment, Bundles |
| ProductSpecification | **5G Mobile Service** (data allowance 30 GB / 100 GB / Unlimited; network 5G SA / 5G NSA / 4G; EU roaming yes/no; tethering); **Full Fibre Broadband** (download 150 / 500 / 1000 Mbps; upload; access technology FTTP; static IP); **Smartphone Device** (model "Nova X5 5G"; storage 128 / 256 GB; colour); **IPTV Service** (channel pack; UHD; concurrent streams); **Home Bundle** (bundles Full Fibre + IPTV) |
| ProductOffering | 5G Unlimited SIM-only 24 months; 5G 100GB SIM-only 12 months; Nova X5 5G 256GB on 5G Unlimited 36 months; Full Fibre 500; Full Fibre 1000; TV Essentials add-on; Home Bundle: Full Fibre 1000 + TV Essentials (`isBundle`) |
| ProductOfferingPrice | recurring monthly (£30.00 Unlimited, £18.00 100GB, £32.00 FF500, £45.00 FF1000, £12.00 TV, £52.00 bundle); one-off (£60.00 installation, £49.00 handset upfront); device instalment £35.00/month × 36; usage (roaming outside zone £3.00/day); discount (50% off FF1000 for 6 months, via a price relationship) |

Lifecycle is exercised the same way as in a real catalogue: create in `In design` → PATCH to `Active` → price change through PATCH (FF500 £32 → £30) → PATCH to `Retired` → DELETE.

### 10.3 Feature coverage

- **F001–F005 (CRUD):** each is a `Scenario Outline` with `Examples` for `v4` and `v5`. Create → read by id → list with a filter (`name`, `lifecycleStatus`, `lastUpdate` range) → PATCH → read again → DELETE → `404`. The checks include status codes (201/200/204/404), `Location`/`href` on the right version base path, mandatory attributes, and `fields` selection.
- **F006 (cross-version):** a `Scenario Outline` over resource × direction (`v4→v5`, `v5→v4`). Create in A → read in B with equal business content → PATCH in B → read in A shows the change → DELETE in A → `404` in B. Lists in both versions show the same ids.
- **F007 (compatibility):** one scenario per matrix row that loses or refuses data. Examples: v5 writes `externalIdentifier`, a `PartyRoleRef` with `partyId` and an embedded price; a v4 read returns `200` with the right `W-…` warnings; a v4 PATCH of `relatedParty` keeps `partyId` (array merge); a v4 PATCH of `productOfferingPrice` returns `409 TMF620-COMPAT-409-UNMATCHED` naming the attribute and the v5 path; a v4 characteristic `valueType: integer, value: "Unlimited"` returns `422`; `valueFrom: "0.5"` returns `422`; a v4 POP with `constraint` returns `422 TMF620-COMPAT-422-V4ONLY-ATTR` and nothing is stored; a v4 POP with `pricingLogicAlgorithm[].@type: RecurringRatingPLA` + `@schemaLocation` is stored unchanged and v5 returns it unchanged; a v4 filter on `constraint.id` returns `400`; a v4 PATCH of an unrelated attribute succeeds and v5 still sees its v5-only data unchanged.
- **F008 (end-to-end):** the v4 client builds the Consumer catalogue, the v5 client builds the Small Business catalogue and adds a v5-only enrichment to a consumer offering, then both clients list and filter the whole catalogue and the hooks tear it down.

Translator unit tests (table-driven, `node:test`, in the v4 service) cover each matrix row in both directions with no cluster needed.

## 11. Local verification (before any PR)

1. Build the images locally (`productcatalogapi:1.1.0-local`, `productcatalogapiv5:1.0.0-local`) and load them into the local cluster. Nothing is pushed to Docker Hub.
2. `helm install` the local chart with the image overrides into the local Canvas.
3. Check that the Canvas reports both ExposedAPIs `ready` with gateway routes (the oda-canvas UC003 features can be used).
4. Run the BDD suite profiles `v4`, `v5`, `cross`, `compat` and `all` through the gateway.
5. Run the TMF620 v4.1.0 CTK (no regression from #80) and the TMF620 v5 CTK, if one is available, against `/v5`.
6. Run an upgrade test: install chart 1.4.5 → seed v4 data → upgrade to 1.5.0 → the migration converts the data → the v5 client reads it.

## 12. Acceptance criteria

- [ ] Both APIs are exposed by one component instance, and the Canvas shows two ready ExposedAPIs.
- [ ] Every stored document is valid TMF620 v5.0.0, and no v4-shaped data is in MongoDB after migration.
- [ ] CRUD passes for all five resources in both versions (F001–F005).
- [ ] Every cross-version scenario passes (F006).
- [ ] Every row of the compatibility matrix has a passing scenario or unit test; every lossy case gives the documented warning or error, and no v5 data is silently lost through v4 (F007).
- [ ] The end-to-end telco catalogue runs clean and leaves no data behind (F008).
- [ ] TMF620 v4 CTK: no regression. MCP server, initialization job and dependent-API federation still work on v4.
- [ ] Upgrade from chart 1.4.5 keeps the existing data readable through both versions.
- [ ] `<component>_tmf620_compatibility_total` is scraped by the Canvas Prometheus and counts every warning and error the BDD suite triggers, with the right labels.

## 13. Open questions

1. ~~**v4-only attributes**~~ *Decided 2026-11-22:* **reject with `422`**, so the store holds pure v5 only. This covers matrix S4, S6, S7, O3 and P1. (Custom `@type` subtypes, G3, were first listed here by mistake: they use the TMF extension pattern that v5 shares and pass through.) Existing stored data is quarantined, not rejected (§8). `constraint` is not mapped to `policy[]`; the error message points v4 clients to `policy[]` through v5 instead.
2. ~~**Default for `component.tmf620v5.enabled`**~~ *Decided 2026-11-22:* **`true`**. A fresh install exposes both v4 and v5; set it to `false` to run v4 only.
3. ~~**v5 spec URL**~~ *Decided in T1:* the component spec points at the official `https://raw.githubusercontent.com/tmforum-apis/TMF620_ProductCatalog/main/TMF620-Product_Catalog_Management-v5.0.0.oas.yaml` (in the official repo since 2025-11-07, Apache-2.0). An unchanged copy is kept in the v5 service as its own API file.
4. ~~**Warning transport**~~ *Decided 2026-11-22:* the header and `warn` logs, **plus a Prometheus metric** (§7.3). No event is published.
5. ~~**Report the S5 spec defect**~~ *Decided 2026-11-22:* yes. The draft is in [upstream-issue-draft-TMF620-v5-discriminator.md](upstream-issue-draft-TMF620-v5-discriminator.md), for you to raise on `tmforum-apis/TMF620_ProductCatalog`.
