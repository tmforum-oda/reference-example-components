# Spec: agent skills for TM Forum Open APIs running v4 and v5 side by side

| | |
|---|---|
| Issue | not raised yet |
| Builds on | #87 / PR #88: TMF620 v4 and v5 on one v5-format store in the Product Catalog component (`specs/87-productcatalog-tmf620-v4-v5/`) |
| Where the skills go | `skills/` in this repository, next to `skills/create-oda-component` |
| Status | Draft for review |
| Tasks | [tasks.md](tasks.md) |

## 1. Goal

Turn what #87 did by hand for TMF620 into a set of agent skills that can do the same for **any TM Forum Open API that is published at both v4 and v5**, in **any ODA Component**. One component instance then serves both major versions of that API over the same data, stored in the v5 format.

For a chosen API, the skills produce everything #87 produced:

1. a **compatibility matrix** built from the two official specifications;
2. a **translation library** and the **v4 service** changes that store v5 data;
3. a **new v5 service**;
4. a **startup migration** of existing v4 data, with a quarantine for what v5 can't hold;
5. a **compatibility counter** in the metrics microservice;
6. the **Helm chart** changes, so the Canvas creates one ExposedAPI per version;
7. the **BDD test suite**, with a test client per version;
8. an **upgrade and Canvas verification** run, with a written result.

The skills work in two modes:

- **Retrofit:** add v5 to an API that an existing component already serves at v4, such as the components in this repository.
- **Greenfield:** called from `create-oda-component` while it generates a new component, so the reference implementation serves v4 and v5 from the start.

## 2. Which APIs qualify

An API qualifies when all of these hold:

- TM Forum publishes **both** a v4 specification (Swagger 2.0) and a v5 specification (OpenAPI 3) for it, in the official `tmforum-apis/TMFxxx_*` repository.
- It is an **exposed API in the core function** of the component. Security and management APIs don't qualify.
- It is **not TMF672**. The Canvas requires TMF672 at v5, so the component always exposes v5 and nothing would run beside it. TMF669, the older security option, is a security API, so it is excluded too.
- It is not an MCP or metrics API. These have no TMF version.

The list of qualifying versions is read from the published repositories at the time of use. It is never hard-coded, because TM Forum keeps publishing v5 specifications. As of 2026-11-27, for the APIs this repository uses:

| API | v4 published | v5 published | Qualifies |
|---|---|---|---|
| TMF620 Product Catalog | 4.0.0, 4.1.0 | 5.0.0 | yes (done by hand in #87) |
| TMF622 Product Ordering | 4.0.0 | 5.0.0 | yes |
| TMF632 Party Management | 4.0.0 | 5.0.0 | yes |
| TMF637 Product Inventory | 4.0.0 | 5.0.0 | yes |
| TMF638 Service Inventory | 4.0.0 | 5.0.0 | yes |
| TMF701 Process Flow | 4.0.0 | 5.0.0 | yes |
| TMF633 Service Catalog | 4.0.0 | — | no |
| TMF641 Service Order | 4.0.0, 4.1.0, 4.2.0 | — | no |
| TMF671 Promotion | 4.0.0, 4.1.0 | — | no |
| TMF669 Party Role | 4.0.0 | 5.0.0 | no: security API |
| TMF672 User Roles and Permissions | 4.0.0 | 5.1.0 | no: the Canvas requires v5 |

**On the Product Catalog component, nothing else qualifies today.** TMF620 is done, TMF671 has no v5, and TMF672 and TMF669 are excluded. When the skills run on Product Catalog they say so, and they recheck the table when TM Forum publishes TMF671 v5.

## 3. Decisions carried over from #87

These were settled in #87, and the skills apply them by default. The reason for each is in the #87 spec and task list.

1. **One store, in the v5 format.** Every document is stored as a valid v5 resource with `_schema: 'TMFxxx-5.x.y'`. The v4 service translates at its persistence boundary, and the v5 service stores and returns v5 as it is.
2. **No silent data loss.**
   - A v4 read that leaves out v5-only data sends an `X-TMF-Compatibility-Warning` header.
   - A v4 write that v5 can't hold is refused: `422` for a v4-only attribute, `409` when a v4 PATCH would delete v5 data, and `400` for a filter that can't be converted. The TMF `Error` names the attribute and points to v5.
   - A v4 PATCH merges arrays by key, so v5-only data it can't see is kept.
3. **Error codes** are `TMFxxx-COMPAT-<status>-<rule>`, and warning codes are `W-<rule>`. Each code names a matrix row.
4. **Migration on startup.**
   - The v4 service converts existing v4 documents once. Running it again does nothing, and it is safe with several replicas.
   - Attributes that only v4 has go to a `MigrationQuarantine` collection, with their values. Defaults that v5 needs are filled in.
   - A document that can't be converted is left as it is and logged. v4 still serves it, and v5 answers `500 TMFxxx-V5-500-UNMIGRATED`.
5. **Rolling-upgrade overlap.** While the old v4 pod still writes v4-format documents, the v5 service converts any such document the first time it reads it.
6. **The v5 service runs on Node.js with Express and `express-openapi-validator`, using the official OAS unchanged.** `oas3-tools` was rejected in #87: it can't parse `application/merge-patch+json` bodies, and it replaces TMF error bodies with its own. The v4 service stays on `swagger-tools`.
7. **Naming.**
   - The deployments and services are `<release>-<api>v4` and `<release>-<api>v5`. The source folders are `<api>V4Microservice` and `<api>V5Microservice`. Each version gets its own `specification[]` entry on the same exposed API, so the Canvas creates `…-v4` and `…-v5` ExposedAPIs, and the v4 ExposedAPI keeps its name and UID.
   - **Retrofit rule:** if the existing v4 deployment isn't already called `…v4`, rename it in a **separate, earlier chart release**, as chart 1.4.6 did (#89). A renamed Deployment is replaced rather than rolled, so v4 is briefly unavailable. A Job's pod template can't change, so a changed initialization Job must be renamed. The API's `/hub` registration must be idempotent before the Job can run again.
8. **Internal URLs come from env vars that the chart sets** (`TMFxxx_V4_API_URL`), so a later rename only needs a chart change.
9. **The compatibility counter** is `<component>_tmfxxx_compatibility_total{code,kind,resource,operation}`.
10. **Chart switch:** `component.tmfxxxv5.enabled` (default `true`). With it off, the component exposes v4 only, and data is still stored in the v5 format.
11. **Out of scope by default**, as in #87: `/hub` and events on v5, import and export jobs, and moving federation or the MCP server to v5. Each is a later option (§9).

## 4. The skills

There are six skills. Each is a folder under `skills/`, with a `SKILL.md`, `references/`, `templates/` and `scripts/`. Each is standalone, as `create-oda-component` is, so it can be installed in another repository.

```
                 ┌──────────────────────────┐        ┌──────────────────────────┐
  existing  ───▶ │ add-dual-version-api     │        │ create-oda-component     │ ◀─── new
  component      │ (retrofit entry point)   │        │ (greenfield, Step 2b)    │      component
                 └────────────┬─────────────┘        └────────────┬─────────────┘
                              │ both call, in this order          │
     ┌────────────────────────┼───────────────────────────────────┘
     ▼                        ▼
 1 find-tmf-api-versions ─▶ 2 build-tmf-compatibility-matrix ─▶ 3 implement-dual-version-api
                                        │  matrix.json                 │
                                        └──────────────┬───────────────┘
                                                       ▼
                                     4 generate-dual-version-bdd-tests
                                                       ▼
                                     5 verify-dual-version-upgrade
```

### 4.1 `find-tmf-api-versions`

**Job:** say which published versions an API has, and whether it qualifies for v4 + v5 (§2).

- **In:** a TMF id, a component code (TMFCxxx), or a chart folder.
  - For a component spec or chart, it reads the core exposed APIs from the Component.
- **Script:** `scripts/api_versions.py`.
  - It lists the `tmforum-apis` repositories and finds the v4 Swagger and v5 OAS files in each, with their raw URLs and commit SHAs.
  - It applies the exclusions (TMF672, security and management APIs, APIs that aren't TMF).
  - It writes `api-versions.json` and prints a table. Results are cached for a day.
- **Out:** for each API, the v4 minors, the v5 minors, whether it qualifies, and why not if it doesn't.
- **Used by:** `create-oda-component` (Step 2b), `add-dual-version-api`, and anyone asking "does TMF6xx have a v5 yet?"

### 4.2 `build-tmf-compatibility-matrix`

**Job:** compare the chosen v4 and v5 specifications and write the compatibility matrix that drives everything after it.

- **In:** the two specifications (exact versions), and the resources in scope. The default is every resource with CRUD paths in both.
- **Scripts:**
  - `flatten.py` generalises #87's `flatten_tmf620.py`. It follows `allOf`, `$ref`, `oneOf` and arrays, four levels deep, for each resource, in both files.
  - `classify.py` sorts each difference into a **rule kind**:
    - resource or path rename (G1);
    - `@type` required on nested objects (G2);
    - href base (G4);
    - attribute rename;
    - v5-only attribute (warn on read, keep on PATCH);
    - v4-only attribute (refuse; quarantine on migration);
    - type change (convert, or refuse values that can't convert);
    - value polymorphism by `@type` (S2);
    - `oneOf` chosen by content (S8);
    - ref shape change;
    - stricter v5 create body (G6);
    - list paging status (206 or 200).
  - **Known v5 common-model patterns** are recognised by schema name, so the same rule and code are reused across APIs:
    - `RelatedParty` becomes `RelatedPartyRefOrPartyRoleRef` (R1, R2);
    - `Characteristic` and `CharacteristicValueSpecification` become polymorphic;
    - `AttachmentRefOrValue` becomes `oneOf`;
    - `Extensible` and `@type` everywhere;
    - refs gain `version` (G9).
  - **Spec defect checks:** subtypes missing from a discriminator `mapping`, ambiguous or non-exclusive `oneOf`, and `required` attributes not defined in the schema. Each defect found gets a drafted upstream issue, as #87 did for TMF620.
- **Out:**
  - `compatibility-matrix.md`, in the #87 layout: one row per difference, with a row id, the v4 → v5 rule, the v5 → v4 rule, the error or warning code, and notes.
  - `matrix.json`, the same rows in a form that the implementation and test skills read.
  - Drafts of any upstream issues.
- **Review gate:** the agent shows the matrix and stops for the user to confirm or change the rules, especially every **refuse** decision and every row marked *needs a hand-written rule*. Nothing is generated before this.

### 4.3 `implement-dual-version-api`

**Job:** generate the code and chart changes from `matrix.json`.

- **Translation library** `shared/tmfxxx-compat/`:
  - **Core, copied unchanged from the templates:** a shape generator with a check that ignores line endings, the tree walker, href, the error and warning messages, the metrics reporter, the stored-document migration, PATCH merging by key, and query and `fields` mapping. All of these come from `tmf620-compat`, with the TMF620 specifics taken out.
  - **API-specific:** `rules/` modules generated from `matrix.json` for the mechanical rule kinds. The known common-model patterns come from a shared rule library. Rows marked for a hand-written rule get a stub with a failing unit test, so they can't be forgotten.
  - **Unit tests:** one per matrix row, with fixtures built from the published sample payloads where there are any.
- **v4 service:** a storage layer (v4 in, v5 stored, v4 out) wired into create, read, list, patch and delete. It adds the warning header, the TMF `Error` responses and an idempotent `/hub` registration. The startup migration runs before the service starts listening.
- **v5 service** `<api>V5Microservice/`, from the template:
  - the official OAS copied unchanged;
  - CRUD on the same collections, filters, paging, `fields`, and merge patch and JSON Patch where the OAS defines them;
  - converting v4-format documents when it reads them;
  - a value check for every polymorphic subtype, because `express-openapi-validator` doesn't check them (#87 S5).
- **Metrics:** the compatibility endpoint and counter.
- **Chart:**
  - the v5 deployment and service;
  - the second `specification[]` entry;
  - the `component.tmfxxxv5.enabled` switch;
  - the `TMFxxx_V4_API_URL` env vars;
  - image versions;
  - the README's "TMFxxx v4 and v5" and upgrade sections, and a changelog line;
  - a regenerated architecture diagram, with one row per version.
- **Images:** `dockerbuild-config.yaml` entries and Dockerfiles, with every changed image's version bumped.
- **Retrofit only:** if the v4 deployment or the initialization Job needs renaming (§3, rule 7), the skill stops and proposes the separate rename release first.
- **Greenfield:** the migration is still generated. On an empty database it does nothing, and it keeps the two modes the same.

### 4.4 `generate-dual-version-bdd-tests`

**Job:** generate the Cucumber.js suite in `source/<Component>/tests/bdd`, in the #87 layout.

- **Clients:** two test clients with the same interface (`create`, `get`, `list`, `patch`, `delete`, `build`). Each validates every response against its own version's OAS with Ajv.
- **Test data:** a domain test-data file written once, with no version-specific shapes, plus a builder per version. The skill drafts realistic data for the API's domain, such as an example telco's parties or inventory, and the user reviews it.
- **Features:**

  | Feature | Covers |
  |---|---|
  | F000 | Connectivity |
  | F001–F0nn | CRUD per resource, in both versions |
  | Cross-version | Created through one version, read, changed and deleted through the other |
  | Compatibility | One `Rule` per lossy matrix row: the header or error and code, v5-only data surviving a v4 PATCH, a refused write storing nothing, and the counter going up |
  | End to end | A domain scenario built through both versions, with a teardown that checks nothing is left |

- **Infrastructure:** run isolation, clean-up hooks that fail a scenario if something is left behind, tags and profiles, a docker-compose stack, and a README.
- **Done:** every lossy matrix row has at least one scenario. The skill checks this from `matrix.json`.

### 4.5 `verify-dual-version-upgrade`

**Job:** prove the upgrade and both versions on a running ODA Canvas, and write up the result.

1. **Unit tests:** run all of them.
2. **Compose:** run the suite on docker-compose.
3. **Seed:** install the **previous published chart** with its published images. Seed it through v4 with a generated data set that includes:
   - documents for every quarantine row;
   - at least one document that can't be converted;
   - a metrics listener.
4. **Upgrade:** upgrade to the new chart with images built locally. Local images use a post-renderer that sets `imagePullPolicy: IfNotPresent`, because the chart sets `Always`. Then check:
   - the ExposedAPI UIDs are kept;
   - the v4 deployment rolls, and the init Job is untouched (or replaced as planned);
   - there is one listener;
   - the migration and quarantine counts match the seed;
   - v5 refuses the documents that can't be converted.
5. **Tests on the upgraded release:** with the seed data present, run:
   - the BDD suite through the Canvas gateway;
   - the **v4 CTK**;
   - the **v5 CTK**, if TM Forum publishes one;
   - an overlap check: v4-format documents written after the migration are read correctly by v5.
6. **Write-up:** a results table for `tasks.md`, plus a draft issue or PR comment for the user to post.

Known traps it checks for and reports:

- **`--reuse-values`** from an older chart fails to render: use a values file or `--reset-then-reuse-values`.
- **Prometheus doesn't scrape the counter** when the Canvas uses its default `openMetricsImplementation`. This is the Canvas gap tracked in oda-canvas#688.
- **The MCP exposed API** must use `specification[]`.
- **A published v4 image older than `master`.**

### 4.6 `add-dual-version-api` (retrofit entry point)

**Job:** take a user from "this component serves TMFxxx v4" to a tested v4 + v5 component, by running skills 1 to 5 in order with a review gate between each.

1. Run `find-tmf-api-versions` on the component. Ask which qualifying API to do, and which v4 and v5 minor versions to use: by default, the v4 the component already runs and the latest v5.
2. Check the naming rule (§3, rule 7). If a rename release is needed, do that first, as its own change and PR.
3. Build the matrix, then stop for review.
4. Implement, generate the tests and verify, writing `specs/<n>-<component>-tmfxxx-v4-v5/spec.md` and `tasks.md` as it goes, in the #87 layout.
5. Stop before any commit, push, PR or issue comment. Those are the user's call.

## 5. Changes to `create-oda-component`

The changes are small, so that the skill keeps working on its own if the dual-version skills aren't installed.

- **New Step 2b, "API versions"**, after the API selection in Step 2:
  1. For each selected core exposed API, run `find-tmf-api-versions`.
  2. Offer the v4 + v5 choice **only for APIs that qualify**. For every other API, the current behaviour stays: a single version.
  3. Never offer it for TMF672, which stays v5 as today. Say why in one line.
  4. For each qualifying API, ask:

     > "TMF622 Product Ordering is published at v4.0.0 and v5.0.0. Which do you want?
     > - v4 only (as today)
     > - v4 and v5 side by side, over one store in the v5 format (recommended)
     >
     > Which minor versions? v4: 4.0.0 · v5: 5.0.0"

     When there are several minors, it lists them all, for example TMF620's 4.0.0 and 4.1.0.
- **Step 4:** for each API chosen as v4 + v5, generate the v4 service as today, named `<api>V4Microservice`, then call `build-tmf-compatibility-matrix` (with its review gate) and `implement-dual-version-api` in greenfield mode.
- **Step 5:** names deployments and services `…v4` and `…v5` from the start, so no rename release is ever needed later. Each dual API gets two `specification[]` entries.
- **New optional Step 6b:** offers `generate-dual-version-bdd-tests`. Step 9's summary lists what was generated per version.
- **`references/`:** gains a short `dual-version.md` that points to the new skills and lists the decisions in §3.

**Fix found along the way:** the MCP exposed API pattern in `references/chart-patterns.md` puts `implementation` and `apiType` at the top level, with no `specification[]`, which the Canvas refuses. PR #90 fixed the same problem in Product Catalog. The pattern needs the same fix.

## 6. Reuse from #87

| From #87 | Goes into |
|---|---|
| `specs/87-…/tools/flatten_tmf620.py` | `build-tmf-compatibility-matrix/scripts/flatten.py`, generalised |
| `compatibility-matrix.md` (layout, legend, codes) | that skill's `templates/compatibility-matrix.md`, plus `references/rule-kinds.md` with a TMF620 example per kind |
| `shared/tmf620-compat/lib/*` | `implement-dual-version-api/templates/compat-core/` (everything API-agnostic) and `references/common-rules/` (RelatedParty, characteristics, attachments) |
| `productCatalogV5Microservice/` | `templates/v5-service/` |
| The v4 storage layer, migration and `/hub` dedupe | `templates/v4-storage/`, plus `references/v4-integration.md` on where to wire it in |
| The chart 1.4.6 and 1.5.0 templates and README sections | `templates/chart/` and `references/chart-changes.md` |
| `tests/bdd/` (clients, support, hooks, profiles, compose) | `generate-dual-version-bdd-tests/templates/` |
| The seed script, overlap script, post-renderer and the T22/T23 procedure | `verify-dual-version-upgrade/scripts/` and `references/procedure.md` |
| The diagram wrapper (one row per `specification[]` entry) | `implement-dual-version-api/scripts/`, until the diagram plugin supports it (§9) |

**Golden test:** run the skills on TMF620 v4.0.0 and v5.0.0 and compare with the hand-built #87 output.

- The generated matrix must find every #87 row.
- The generated library must pass the #87 unit tests.
- The generated BDD suite must cover the same matrix rows.

## 7. Acceptance criteria

1. **Version check:** `find-tmf-api-versions` gives the table in §2 for this repository's components. It excludes TMF672 and TMF669 with the reason.
2. **Golden test:** the golden test against #87 passes (§6).
3. **Retrofit pilot:**
   - `add-dual-version-api` makes **TMF632 Party Management** v4 + v5 in `charts/PartyManagement`, including any rename release.
   - BDD is green on compose and on the local Canvas.
   - The upgrade from the previous published chart keeps the ExposedAPI UIDs and the seed data.
   - The v4 CTK passes.
4. **Greenfield pilot:**
   - `create-oda-component`, on a component with a qualifying API, offers the v4 + v5 choice only for that API. It doesn't offer it for TMF672, or for an API with no v5.
   - The generated component reaches `Complete` on the local Canvas, with two ExposedAPIs, and its BDD suite passes.
5. **Product Catalog:** run on Product Catalog, the skills report that no further API qualifies, and why.
6. **Standalone:** `create-oda-component` without the new skills installed behaves exactly as today.
7. **Skill evals:** each skill has evals in the `skills/skill-creator` format, covering when it triggers and its main outputs, and they pass.

## 8. Risks

- **v5 common-model changes vary by API.** The shared rule library covers the patterns seen so far (TMF620), and each pilot will add patterns. Rows it doesn't recognise are marked for a hand-written rule rather than guessed.
- **Spec defects** in a v5 OAS (two in TMF620 v5.0.0) can block validation. The classifier reports them, and the v5 service can patch around them only with a recorded, reviewed workaround. The OAS file itself is never changed.
- **CTK coverage.** v5 CTKs are not published for every API, and a reviewer found the TMF620 v5 CTK's default payload doesn't match the contract (PR #88). The verify skill records what it could and couldn't run.
- **Large APIs.** TMF622 and TMF637 have bigger resource trees than TMF620, so the matrix may run to many more rows. The review gate and the per-row unit tests keep that manageable.

## 9. Open questions

1. **Where do the skills live long term?** In `skills/` here, next to `create-oda-component`, or in the `tm-forum-oda-consumer` plugin, which has a related `implement-oda-component` skill and the TMF knowledge corpus? This spec assumes `skills/` here.
2. **Should v5 `/hub` and events be in scope** for generated v5 services, or stay a later option as in #87?
3. **Should `create-oda-component` also offer "v5 only"** for qualifying APIs? That needs no dual-version skills, but it is a different v5 service template.
4. **Which retrofit pilot should come first?** This spec proposes TMF632 (Party Management), which is small and has two resources. TMF637 or TMF638 would exercise more rule kinds.
5. **Should the diagram plugin get one row per `specification[]` entry upstream,** so the wrapper script can be dropped?
