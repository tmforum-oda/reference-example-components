# Draft: upstream issue for tmforum-apis/TMF620_ProductCatalog

**Status:** draft, not posted. For you to review and raise yourself (spec §13.5, matrix S5).
**Where:** https://github.com/tmforum-apis/TMF620_ProductCatalog/issues/new
**Checked 2026-11-22:** the repo has issues enabled, 0 open issues, and no existing report that matches "Boolean" or "discriminator".

---

**Title:** v5.0.0: Boolean and Float CharacteristicValueSpecification subtypes are missing from the discriminator mapping

**Body:**

## Summary

In `TMF620-Product_Catalog_Management-v5.0.0.oas.yaml` (commit `8886c7d`), four `CharacteristicValueSpecification` subtypes are defined but left out of the `@type` discriminator mapping of their base schema, in all three variants (resource, `_FVO`, `_MVO`):

| Base schema | Subtypes defined but not in `discriminator.mapping` |
|---|---|
| `CharacteristicValueSpecification` | `BooleanCharacteristicValueSpecification`, `BooleanArrayCharacteristicValueSpecification`, `FloatCharacteristicValueSpecification`, `FloatArrayCharacteristicValueSpecification` |
| `CharacteristicValueSpecification_FVO` | the same four, with `_FVO` |
| `CharacteristicValueSpecification_MVO` | the same four, with `_MVO` |

The other eleven subtypes (String, Integer, Number, Object, Map and their Array forms, plus the base type) are mapped. These 12 schemas are the only subtypes in the file missing from their base's mapping, and nothing else in the file references them with `$ref`, so they can't be reached from any operation.

## Why it matters

Product specifications commonly have boolean characteristics (for example "EU roaming included", "Static IP"), and `BooleanCharacteristicValueSpecification` is the subtype the specification clearly intends for them. Because it can't be reached through the mapping:

- **Code generators** that build the polymorphic model from the mapping leave out the Boolean and Float types, or don't include them in the union for `characteristicValueSpecification[]`.
- **Validators** that treat an explicit mapping as the complete list of allowed `@type` values reject a request that uses `"@type": "BooleanCharacteristicValueSpecification"`.
- For the `_FVO`/`_MVO` variants, OpenAPI 3.0's implicit by-name fallback resolves `BooleanCharacteristicValueSpecification` to the **resource** schema rather than `BooleanCharacteristicValueSpecification_FVO`/`_MVO`, so create and update bodies are validated against the wrong schema even by tools that apply the fallback.
- Tools that prune unreferenced schemas drop all 12 definitions.

Implementers are then left either to model booleans as `StringCharacteristicValueSpecification` or to patch the spec locally, so the same catalogue data ends up different between implementations.

## Proposed fix

Add the four missing entries to each of the three mappings (shown for `_FVO`; the resource and `_MVO` versions point at their own schemas):

```yaml
    CharacteristicValueSpecification_FVO:
      # ...
      discriminator:
        propertyName: '@type'
        mapping:
          # existing entries unchanged ...
          BooleanCharacteristicValueSpecification: '#/components/schemas/BooleanCharacteristicValueSpecification_FVO'
          BooleanArrayCharacteristicValueSpecification: '#/components/schemas/BooleanArrayCharacteristicValueSpecification_FVO'
          FloatCharacteristicValueSpecification: '#/components/schemas/FloatCharacteristicValueSpecification_FVO'
          FloatArrayCharacteristicValueSpecification: '#/components/schemas/FloatArrayCharacteristicValueSpecification_FVO'
```

It may be worth checking whether the generator that produced this file has the same gap in other v5 APIs that use `CharacteristicValueSpecification`.

## How it was found

While building a reference ODA Component that serves TMF620 v4 and v5 over a shared store ([tmforum-oda/reference-example-components#87](https://github.com/tmforum-oda/reference-example-components/issues/87)), we compared every discriminator mapping in the file with the schemas that extend each base through `allOf`. This is a static check of the spec file. We have not yet confirmed the behaviour of each tool listed above.

---

## Before you post (notes for you, not part of the issue)

- **Tested at runtime (T9/T10, express-openapi-validator 5.6.2):** `BooleanCharacteristicValueSpecification` is accepted, but `value` is never checked against any subtype: an `IntegerCharacteristicValueSpecification` with `value: "Unlimited"` passes. That could be added as a "Reproduction" section. A second, independent problem is drafted in [upstream-issue-draft-TMF620-v5-oneOf.md](upstream-issue-draft-TMF620-v5-oneOf.md).
- **The "other v5 APIs" sentence** is a suggestion, not a finding; I haven't checked TMF633 or the others.
- **To post it from a terminal,** after saving the text between the `---` lines as `issue-body.md`:

```powershell
gh issue create --repo tmforum-apis/TMF620_ProductCatalog --title "v5.0.0: Boolean and Float CharacteristicValueSpecification subtypes are missing from the discriminator mapping" --body-file issue-body.md
```
