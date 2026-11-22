# tmf620-compat

TMF620 v4 ↔ v5 translation and compatibility checks, shared by the Product Catalog v4 and v5 APIs (issue #87). Both APIs use one MongoDB, and the stored document is the TMF620 v5.0.0 resource. The v4 API translates at the persistence boundary; the v5 API uses only `checkV5Value`.

Every rule implements a row of the [compatibility matrix](../../../../specs/87-productcatalog-tmf620-v4-v5/compatibility-matrix.md), and the tests are named after those rows.

## API

| Function | Used by | Returns |
|---|---|---|
| `v4ToV5(resource, v4doc, ctx)` | v4 POST | `{doc, problems, warnings}` |
| `v5ToV4(resource, v5doc, ctx)` | v4 GET/list | `{doc, warnings, omitted}` |
| `v4Patch(resource, storedV5, v4patch, ctx)` | v4 PATCH | `{doc, problems, warnings}`: the merged v5 document, matched array entries keep their v5-only details |
| `mapFilter(resource, query)` / `mapFields(resource, fields)` | v4 list | v5 storage paths, or 400 problems |
| `toTmfError(problems, ctx)` | v4 | `{status, body, codes}`: one TMF Error naming every problem, with a hint and the matrix link |
| `warningHeaders(warnings, resource, id)` | v4 | `X-TMF-Compatibility-Warning` header values |
| `normaliseHref` / `buildHref` | both | version-neutral `/<resource>/<id>` hrefs in storage |
| `checkV5Value(cvs)` | v5 POST/PATCH | an error string when a characteristic value does not fit its `@type` (the OAS validator does not check this, matrix S5) |

`resource` is one of `catalog`, `category`, `productOffering`, `productOfferingPrice`, `productSpecification`. `ctx` is `{componentName, v4BaseUrl, idGenerator?}`.

A problem is `{code, path, detail, hint?}` and stops the request; a warning is `{code, path, detail?}` and is reported on a successful response.

## How it decides

`generated/shapes.json` holds the attributes of every schema reachable from the five resources, in both specs. A walk over the document compares them: an attribute only v4 defines is refused on write (422), an attribute only v5 defines is left out of v4 reads with a warning, and an attribute neither defines (an extension) passes through. Structural differences (relatedParty, Category parent, characteristic renames and value types, attachments, embedded prices) are handled in code in `lib/translate.js`.

After changing either spec, regenerate:

```sh
npm run generate
npm test          # fails if generated/shapes.json is out of date
```

No runtime dependencies; Node 16 or later (the v4 image runs Node 16).
