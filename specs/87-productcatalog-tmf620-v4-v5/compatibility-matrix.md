# TMF620 v4 ⇄ v5 compatibility matrix (issue #87, task T1)

The authoritative mapping for the v4 translation layer. Spec: [spec.md](spec.md) §6–§7.

## Sources

| | File | Notes |
|---|---|---|
| v4 | `source/ProductCatalog/productCatalogV4Microservice/implementation/api/swagger.yaml` | TMF620 v4.0.0, Swagger 2.0, 91 definitions. What the v4 service runs today. |
| v5 | `source/ProductCatalog/productCatalogV5Microservice/implementation/api/TMF620-Product_Catalog_Management-v5.0.0.oas.yaml` | Copied unchanged from [tmforum-apis/TMF620_ProductCatalog](https://github.com/tmforum-apis/TMF620_ProductCatalog) (`main`, commit `8886c7d`, 2025-11-07, Apache-2.0). OpenAPI 3.0.1, 271 schemas, 56 reachable from the five resources. SHA-256 `a84bc2e4…7429351`. |

Method (rerun with `python tools/flatten_tmf620.py <v4 swagger.yaml> <v5 oas.yaml> <out_dir>`, needs PyYAML): every attribute path of the five resources was flattened four levels deep (following `allOf`, `$ref`, `oneOf` and arrays) in both files and compared. Each difference found is a row below. Attributes not listed are identical in name and type in both versions and map one-to-one.

## Legend

- **Seamless:** the translator maps the attribute both ways with no loss.
- **Warn:** a v4 read succeeds without the data and sends an `X-TMF-Compatibility-Warning` header (code `W-…`).
- **v4-only:** an attribute with no home in v5. **The store holds pure v5 only** (decided 2026-11-22, spec §13.1), so a v4 POST or PATCH that sets one is refused with `422 TMF620-COMPAT-422-V4ONLY-ATTR`, and nothing is stored. v4 reads never contain these attributes.
- **Error:** the request is refused with a TMF `Error` body. The codes are listed at the end.

## PATCH from v4: array merge by key

A v4 merge-patch replaces arrays whole. To avoid silently losing v5-only detail, the v4 layer **matches each entry in the patched array to a stored entry** by key, and carries over the stored entry's v5-only attributes (for example `version`, `partyId`, `@referredType`, a characteristic's `id`):

| Array | Match key |
|---|---|
| any array of refs (`category`, `relatedParty`, `productOfferingPrice` refs, `bundledProductOffering`, `productSpecificationRelationship`, `popRelationship`, …) | `id` (for `relatedParty`: `partyOrPartyRole.id` + `role`) |
| `productSpecCharacteristic`, `prodSpecCharValueUse` | `name` (v4 has no characteristic `id`; the stored v5 `id` is carried over to the matched entry) |
| `charSpecRelationship` | `parentSpecificationId` + `name` |
| `characteristicValueSpecification`, `productSpecCharacteristicValue` | no key: matched by `value` + `unitOfMeasure` |

Stored entries left out of the patch are removed, because that is what the v4 client asked for. **The only 409 case** is when a stored entry holds v5-only data and cannot be matched (an embedded price with no `id`, or a characteristic value with an array or map value that v4 changed): see `TMF620-COMPAT-409-UNMATCHED`.

## G: rules for all resources

| # | Difference | v4 → v5 (write) | v5 → v4 (read) | Code |
|---|---|---|---|---|
| G1 | **The catalog resource is renamed.** v4 `/catalog` with `@type: Catalog`; v5 `/productCatalog` with `@type: ProductCatalog` (`Catalog` is its base type in the discriminator). | Store in the `Catalog` collection with `@type: ProductCatalog`, `@baseType: Catalog`. A v4 filter `@type=Catalog` maps to `ProductCatalog`. | `@type: Catalog`, path `/catalog` | — |
| G2 | **`@type` is required on every nested object**, not only on resources. Every reachable v5 schema extends `Extensible` except `TimePeriod`, `Money`, `Quantity`, `Duration` and `TargetProductSchema`. | Fill in any missing `@type` with the v5 schema name for that position (`CategoryRef`, `RelatedPartyRefOrPartyRoleRef`, `CharacteristicSpecification`, `ProductOfferingTerm`, `BundledProductOfferingOption`, …). The table is generated from the OAS, not written by hand. | Keep it (v4 allows `@type`) | — |
| G3 | **Custom subtypes** (`@type` + `@schemaLocation`, for example `pricingLogicAlgorithm[].@type: RecurringRatingPLA` in the MCP examples). This is the standard TMF extension pattern and **works the same in v5**, so it is not v4-only data. The v5 discriminator `mapping` lists only the base names, which strict validators may treat as a closed list. | Stored unchanged (`Catalog` → `ProductCatalog` is the only rename). Exception: characteristic value specifications, where v5 gives `@type` a meaning (S2): a client `@type` that isn't a v5 subtype is replaced by the inferred one, with a `W-CHARVALUE-TYPE` warning on the write response | Unchanged | T10 checks that the v5 validator accepts unknown subtypes that come with `@schemaLocation`. `targetProductSchema.@type` (for example `Firewall`) is a plain property in v5 and not affected |
| G4 | **`href`** base paths differ (`/v4/catalog/{id}` vs `/v5/productCatalog/{id}`) | Store version-neutral `/{resource}/{id}` for this component's resources and refs | Rebuild with the v4 base and v4 resource name | — |
| G5 | `@schemaLocation` is `format: uri` in v4 and a plain string in v5 | Seamless | Passed through (v4 response validation is off) | — |
| G6 | **The v5 create (FVO) bodies require more:** `lifecycleStatus` and `lastUpdate` on ProductOffering, ProductOfferingPrice and ProductSpecification, and `priceType` on ProductOfferingPrice. v4 requires only `name`. | The stored document only has to be valid against the v5 **resource** schema, which requires only `@type`. v4 creates get `lastUpdate` set by the server and the existing `lifecycleStatus` default `In design` (#80). `priceType` stays optional. | Seamless | — (the v5 service enforces FVO for v5 clients, T10) |
| G7 | v5 PATCH also accepts `application/json-patch+json` and `json-patch-query+json` | n/a | n/a | v5 service only (T10) |
| G8 | DELETE returns `204` in v4 and `202`/`204` in v5 | Both services return `204` | | — |
| G9 | **Refs gain attributes in v5:** `version` (CategoryRef, ProductOfferingRef, ProductSpecificationRef, ProductOfferingPriceRef, PolicyRef, …), and `@referredType` on relationship refs | Seamless | Leave out; kept on PATCH by the array merge | `W-V5ONLY-ATTR` |
| G10 | **v5-only top-level attributes** (listed per resource below) | n/a | Leave out | `W-V5ONLY-ATTR`; kept on PATCH because v4 cannot address them |

## RelatedParty (Catalog and ProductSpecification; the other three resources have no `relatedParty` in either version)

| # | v4 `RelatedParty` | v5 `RelatedPartyRefOrPartyRoleRef` | v4 → v5 | v5 → v4 | Code |
|---|---|---|---|---|---|
| R1 | `{id*, href, name, role, @referredType*, @type}` (flat) | `{@type*, role, partyOrPartyRole: PartyRef \| PartyRoleRef}` | `role` goes to the wrapper; `id`/`href`/`name`/`@referredType` go to `partyOrPartyRole`, which is a `PartyRoleRef` when `@referredType` is `PartyRole` (or ends in `Role`), otherwise a `PartyRef` | Flatten. `@referredType` comes from `partyOrPartyRole.@referredType`, or else from its `@type` without `Ref` | — |
| R2 | — | `PartyRoleRef.partyId`, `PartyRoleRef.partyName` | n/a | Leave out | `W-PARTYROLE`; kept on PATCH (matched by id + role) |

## Category

| # | Difference | v4 → v5 | v5 → v4 | Code |
|---|---|---|---|---|
| K1 | v4 `parentId` (string) ↔ v5 `parent` (`CategoryRef`) | `parent = {@type: CategoryRef, id, href}` | `parentId = parent.id`. `parent.name` is dropped (it can be derived); `parent.version` gets a warning | `W-V5ONLY-ATTR` if `parent.version` is set. A v4 filter `parentId=` maps to `parent.id` |
| K2 | `productOffering[].version` (v5) | G9 | G9 | |

## ProductSpecification

| # | Difference | v4 → v5 | v5 → v4 | Code |
|---|---|---|---|---|
| S1 | `productSpecCharacteristic[]`: v4 `ProductSpecificationCharacteristic` → v5 `CharacteristicSpecification`. Renames: `productSpecCharacteristicValue` → **`characteristicValueSpecification`**, `productSpecCharRelationship` → **`charSpecRelationship`** | Rename. v5 `id` is generated if missing (a stable key for later merges) | Rename back. v5 `id` and `@valueSchemaLocation` are left out with a warning | `W-V5ONLY-ATTR` |
| S2 | **Characteristic values are polymorphic in v5.** v4: `value` is `Any`, with an optional `valueType` string. v5: `@type` picks the subtype, and the subtype fixes the type of `value` (`String…`, `Integer…`, `Number…`, `Boolean…`, `Object…`, `Map…`, and `…Array…` versions). | `@type` comes from `valueType` (case-insensitive: `string`/`text` → String; `integer`/`int` → Integer; `number`/`decimal`/`float`/`double` → Number; `boolean`/`bool` → Boolean; `object` → Object; `map` → Map), or else from the JSON type of `value` (an array uses the type of its elements; mixed → ObjectArray). With no `value` and no `valueType`, use the base `CharacteristicValueSpecification` | `value` and `valueType` pass through; `@type` is kept | **`TMF620-COMPAT-422-CHARVALUE-TYPE`** if `value` does not fit the declared `valueType` (for example `valueType: integer`, `value: "Unlimited"`) |
| S3 | **`valueFrom` / `valueTo`: string in v4, integer in v5** | Parse as an integer | Convert to a string | **`TMF620-COMPAT-422-RANGE-NOT-INTEGER`** for `"0.5"`, `"10GB"`, …; a v4 filter on them with a non-integer gives **`TMF620-COMPAT-400-FILTER-VALUE`** |
| S4 | `charSpecRelationship`: v4 `{id, href, name, relationshipType, validFor, charSpecSeq}` ↔ v5 `{parentSpecificationId, parentSpecificationHref, name, relationshipType, validFor, characteristicSpecificationId}` | `id` → `parentSpecificationId`, `href` → `parentSpecificationHref`; **`charSpecSeq` is refused** | Reverse. `characteristicSpecificationId` gets a warning | **`TMF620-COMPAT-422-V4ONLY-ATTR`** (`charSpecSeq`), `W-V5ONLY-ATTR` |
| S5 | **v5 spec defect:** `Boolean…`, `BooleanArray…`, `Float…` and `FloatArrayCharacteristicValueSpecification` are defined but **missing from the `CharacteristicValueSpecification` discriminator mapping**, in the resource, `_FVO` and `_MVO` variants (12 schemas, none referenced anywhere else; [upstream issue draft](upstream-issue-draft-TMF620-v5-discriminator.md)) | Store `BooleanCharacteristicValueSpecification` / `FloatCharacteristicValueSpecification` (correct by the schema). **Runtime check (T9, express-openapi-validator 5.6.2):** they are accepted, but `value` is never checked against the subtype, for any subtype. The v5 service adds that check (`checkV5Value`, 422) | — | Report upstream to TM Forum |
| S6 | `serviceSpecification[].targetServiceSchema` is v4 only | Refused | n/a | **`TMF620-COMPAT-422-V4ONLY-ATTR`** |
| S7 | `targetProductSchema.@baseType` is v4 only (`TargetProductSchema` is not `Extensible` in v5) | Refused | n/a | **`TMF620-COMPAT-422-V4ONLY-ATTR`** |
| S8 | `attachment[]`: v4 has one flat `AttachmentRefOrValue`; v5 has `oneOf [Attachment, AttachmentRef]` chosen by `@type` | Use the given `@type` if it is `Attachment`/`AttachmentRef`. Otherwise **`Attachment`** if any of `content`, `url`, `mimeType`, `attachmentType` or `size` is present, else **`AttachmentRef`** (needs `id`) | Flatten | **`TMF620-COMPAT-422-ATTACHMENT-AMBIGUOUS`** if there is no `id` and no value attribute |
| S9 | v5 only: `category[]`, `externalIdentifier[]`, `intentSpecification`, `policy[]` | n/a | Leave out | `W-V5ONLY-ATTR` |
| S10 | `productSpecificationRelationship[]`: v5 adds `characteristic[]`, `name`, `version`, `@referredType` | Seamless | Leave out; kept on PATCH by the array merge (key `id`) | `W-V5ONLY-ATTR` |
| S11 | `bundledProductSpecification[].version` (v5) | G9 | G9 | |

## ProductOffering

| # | Difference | v4 → v5 | v5 → v4 | Code |
|---|---|---|---|---|
| O1 | **`productOfferingPrice[]`: v4 refs only; v5 `oneOf [ProductOfferingPrice, ProductOfferingPriceRef]`** (embedded value allowed) | `@type: ProductOfferingPriceRef` | Refs pass through. An embedded value **with** `id` becomes a v4 ref `{id, href, name}` plus a warning; one **without** `id` is left out plus a warning | `W-EMBEDDED-POP`; a v4 PATCH that sends the reference back keeps the embedded value (only `name`/`version` change); a v4 PATCH of `productOfferingPrice` while id-less embedded values exist gives **`TMF620-COMPAT-409-UNMATCHED`** |
| O2 | `attachment[]` | as S8 | as S8 | as S8 |
| O3 | `bundledProductOffering[].lifecycleStatus` is v4 only (v5 `BundledProductOffering` is a `ProductOfferingRef` + option) | Refused (the bundled offering's own `lifecycleStatus` is on that offering) | n/a | **`TMF620-COMPAT-422-V4ONLY-ATTR`** |
| O4 | `prodSpecCharValueUse[].productSpecCharacteristicValue[]`: items become polymorphic `CharacteristicValueSpecification`; `prodSpecCharValueUse[].id` is new in v5 | as S2/S3; `id` is generated | as S2/S3; `id` gets a warning | as S2/S3 |
| O5 | v5 only: `allowedAction[]`, `bundledGroupProductOffering[]`, `externalIdentifier[]`, `policy[]`, `productOfferingCharacteristic[]`, `productOfferingRelationship[]` | n/a | Leave out | `W-V5ONLY-ATTR` |

## ProductOfferingPrice

| # | Difference | v4 → v5 | v5 → v4 | Code |
|---|---|---|---|---|
| P1 | **`constraint[]` (`ConstraintRef`) is v4 only.** The closest v5 attribute is `policy[]` (`PolicyRef`), but it is not the same concept. | Refused. The message suggests modelling the rule as a `policy[]` ref through the v5 API | n/a | **`TMF620-COMPAT-422-V4ONLY-ATTR`** |
| P2 | v5 only: `externalIdentifier[]`, `policy[]` | n/a | Leave out | `W-V5ONLY-ATTR` |
| P3 | `popRelationship[]` gains `role`, `version` and `@referredType`; `bundledPopRelationship[]` gains `version` and `@referredType` | Seamless | Leave out; kept on PATCH by the array merge (key `id`) | `W-V5ONLY-ATTR` |
| P4 | `prodSpecCharValueUse[]` | as O4 | as O4 | as O4 |
| P5 | `priceType` is required by the v5 FVO only | G6 | | |

## Catalog

G1, G2, G4, R1/R2. No other differences.

## Filters and `fields` (v4 → v5 storage paths)

| v4 path | Stored path |
|---|---|
| `relatedParty.id` / `.name` / `.href` / `.@referredType` | `relatedParty.partyOrPartyRole.id` / … |
| `relatedParty.role` | `relatedParty.role` |
| `parentId` (Category) | `parent.id` |
| `productSpecCharacteristic.productSpecCharacteristicValue.*` | `productSpecCharacteristic.characteristicValueSpecification.*` |
| `productSpecCharacteristic.productSpecCharRelationship.id` / `.href` / `.charSpecSeq` | `….charSpecRelationship.parentSpecificationId` / `.parentSpecificationHref` / `charSpecSeq` → 400 (next row) |
| `constraint.*` (POP), `serviceSpecification.targetServiceSchema.*`, `bundledProductOffering.lifecycleStatus`, `charSpecSeq` | **`400 TMF620-COMPAT-400-V4ONLY-FILTER`**: nothing is stored there, so the filter could never match |
| `@type=Catalog` | `@type=ProductCatalog` |
| anything else | unchanged |

`fields=` uses the same table. For example, `fields=parentId` projects `parent.id`.

## Error and warning codes

| Code | HTTP | When | Message must say |
|---|---|---|---|
| `TMF620-COMPAT-422-CHARVALUE-TYPE` | 422 | S2, O4: `value` does not fit `valueType` | the characteristic name, the value, the declared type, and the v5 subtypes that would be valid |
| `TMF620-COMPAT-422-RANGE-NOT-INTEGER` | 422 | S3: `valueFrom`/`valueTo` is not an integer | the characteristic, the value, and that v5 stores integers (suggest `unitOfMeasure` for units) |
| `TMF620-COMPAT-422-ATTACHMENT-AMBIGUOUS` | 422 | S8: an attachment with no `id` and no content/url | which attachment (index/name), and what to add |
| `TMF620-COMPAT-409-UNMATCHED` | 409 | the array merge cannot match stored entries that hold v5-only data | resource and id, the attribute, the entries at risk, and the v5 URL to patch instead |
| `TMF620-COMPAT-400-FILTER-VALUE` | 400 | a filter value cannot be converted to the v5 type | the parameter, the value, the expected type |
| `TMF620-COMPAT-400-V4ONLY-FILTER` | 400 | a filter or `fields` entry on a v4-only attribute | the parameter, and that TMF620 v5 (the storage format) has no such attribute |
| `TMF620-COMPAT-422-V4ONLY-ATTR` | 422 | S4, S6, S7, O3, P1: the request sets a v4-only attribute | every offending path, that TMF620 v5 has no equivalent so it cannot be stored, and the v5 alternative where there is one (P1: `policy[]`; S4: order the `charSpecRelationship` array) |
| `W-V4ONLY-QUARANTINED` | metric only | migration (spec §8) moved a v4-only attribute into `MigrationQuarantine` | (logged with resource id and paths) |
| `W-CHARVALUE-TYPE` | header (on the write response) | G3/S2: the client's characteristic-value `@type` was replaced by the v5 subtype | the original and the stored `@type` |
| `W-V5ONLY-ATTR` | header | G9, G10, R2-like omissions | the resource/id and the omitted paths |
| `W-PARTYROLE` | header | R2 | the relatedParty index and the omitted `partyId`/`partyName` |
| `W-EMBEDDED-POP` | header | O1 | which prices were shown as refs or left out |

The v5 API has its own codes (the v5.0.0 OAS defines no 422, so it uses 400):

| Code | HTTP | When |
|---|---|---|
| `TMF620-V5-400-CHARVALUE-TYPE` | 400 | S5: a characteristic value does not fit its `@type` (the OAS validator doesn't check this) |
| `TMF620-V5-500-UNMIGRATED` | 500 | the document has no `_schema` marker: written by an older v4 service and not migrated yet (spec §8). GET of one document only; lists leave such documents out |

Header format (spec §7.2): `X-TMF-Compatibility-Warning: <code>; resource=<type>/<id>; paths=<p1>,<p2>; see=<link to this file>#<row>`

## Corrections to the first draft of the spec (C1–C11)

| Draft row | Result |
|---|---|
| C1 `@type` mandatory | Confirmed and wider: required on **every nested object** except five value types (G2). Custom subtypes need their own rule (G3). |
| C2 relatedParty | Confirmed (R1/R2). The PATCH 409 is **no longer needed**: the array merge keeps `partyId`/`partyName`. |
| C3 characteristic values | Confirmed, plus the attribute renames (S1), integer ranges (S3) and the spec defect with Boolean/Float (S5). |
| C4 v5-only attributes | Confirmed, listed per resource (G10, S9, O5, P2). |
| C5 v4-only attributes | Found: `POP.constraint`, `charSpecSeq`, `targetServiceSchema`, `targetProductSchema.@baseType`, `bundledProductOffering[].lifecycleStatus`. **Refused with 422** (decided 2026-11-22). |
| C6/C7 RefOrValue | Confirmed for `productOfferingPrice` (O1) and `attachment` (S8). No other RefOrValue attributes in the five resources. |
| C8 href | Confirmed, plus the path rename `/catalog` → `/productCatalog` (G1). |
| C9 arrays | Replaced by the array merge by key; 409 only for unmatched entries. |
| C10 FVO/MVO | Confirmed, and FVO also requires `lifecycleStatus`/`lastUpdate`/`priceType` from v5 clients (G6). |
| C11 filters | Confirmed: 400 for filters on v4-only attributes, and for values that can't be converted (S3). |
| new | **G1 catalog path/type rename**, **G3 custom subtypes**, **S5 spec defect**, Category `parentId` → `parent` (K1). |
