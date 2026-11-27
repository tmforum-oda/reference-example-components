# Draft upstream issue: `oneOf` "ref or value" schemas reject valid payloads in TMF620 v5.0.0

**Status:** draft, not posted. For the maintainer to raise on [`tmforum-apis/TMF620_ProductCatalog`](https://github.com/tmforum-apis/TMF620_ProductCatalog) if they agree. Found in T10 of issue #87, at runtime.

---

**Title:** v5.0.0: `PartyRefOrPartyRoleRef` and the other `…RefOrValue` `oneOf` schemas reject valid payloads in JSON Schema validators

## Summary

Nine schemas in `TMF620-Product_Catalog_Management-v5.0.0.oas.yaml` combine their alternatives with `oneOf` and a `discriminator`:

| Schema (and its `_FVO`, `_MVO` variants) | Alternatives |
|---|---|
| `PartyRefOrPartyRoleRef` | `PartyRef` \| `PartyRoleRef` |
| `AttachmentRefOrValue` | `Attachment` \| `AttachmentRef` |
| `ProductOfferingPriceRefOrValue` | `ProductOfferingPrice` \| `ProductOfferingPriceRef` |

The alternatives don't exclude each other's attributes (no `additionalProperties: false`, and `@type` isn't constrained in either branch). So a valid `PartyRef` also validates as `PartyRoleRef`, and `oneOf` ("exactly one") fails. In a JSON Schema validator that doesn't apply the OpenAPI `discriminator`, which is the default in Ajv and the tools built on it, **every `relatedParty` is refused**:

```json
{ "@type": "RelatedPartyRefOrPartyRoleRef", "role": "owner",
  "partyOrPartyRole": { "@type": "PartyRef", "id": "org-001" } }
```

```
relatedParty.0.partyOrPartyRole: must match exactly one schema in oneOf
```

(express-openapi-validator 5.6.2, request and response validation.)

## Suggested fix

Constrain `@type` in each branch so the alternatives are exclusive, for example:

```yaml
PartyRef:
  allOf:
    - $ref: '#/components/schemas/EntityRef'
    - type: object
      properties:
        '@type':
          enum: [PartyRef]
```

Alternatively, use `anyOf` and rely on the discriminator for dispatch.

## Related: example payloads reuse `id`

The examples under `components/examples` reuse ids (for example `id: '9881'` appears several times). Validators that compile `components` into each schema with draft-04 rules, as OpenAPI 3.0 does, read those `id` attributes as schema ids. They then fail with `reference "…" resolves to more than one schema` (seen with express-openapi-validator, response validation). Examples are not schemas, so this is arguably a tool bug, but unique example ids would avoid it.

---

## Before you post (notes for you, not part of the issue)

- **Our workaround:** in `productCatalogV5Microservice/implementation/utils/spec.js` (`validatorSpec`), the validator gets a copy of the spec with the examples removed and the discriminators applied. Each branch only accepts its own `@type` values, and an `@type` outside the mapping (an extension subtype) must match at least one branch. The published API and Swagger UI use the unchanged official file.
- This could be one issue together with the [discriminator mapping draft](upstream-issue-draft-TMF620-v5-discriminator.md), or two. The two are independent: one is about missing mapping entries, the other about `oneOf` exclusivity.
