# Compatibility boundaries (issue #87, spec 10.3, compatibility-matrix.md): one
# scenario per matrix row where v4 cannot carry all the data. Each one checks the
# warning header or the error (code and what the message says), that v5-only data
# survives a v4 update, and that <component>_tmf620_compatibility_total went up
# for the code (PRODCAT_METRICS_URL). Each matrix row is a Rule; where several
# scenarios check the same data, the Rule's Background creates it.

@compat @TMF620-F007
Feature: TMF620-F007 Compatibility boundaries between TMF620 v4 and v5

  Background:
    Given the TMF620 compatibility counter is read

  Rule: G3 - custom subtypes

    # The v4 OAS lists the properties of PricingLogicAlgorithm, so the v4 API refuses
    # extension attributes on it; @type and @schemaLocation are what G3 is about.
    Scenario: G3 - a custom pricing logic subtype written through v4 reaches v5 unchanged
      When the 'v4' client creates the 'productOfferingPrice' 'rated price' with:
        """
        { "priceType": "recurring", "price": { "unit": "GBP", "value": 10 },
          "pricingLogicAlgorithm": [ { "@type": "RecurringRatingPLA", "@schemaLocation": "https://example.test/schema/RecurringRatingPLA.json", "name": "Monthly rating", "plaSpecId": "pla-spec-1" } ] }
        """
      Then the response status is 201
      And the response has no compatibility warnings
      When the 'v5' client retrieves the 'rated price'
      Then the response status is 200
      And the response attribute 'pricingLogicAlgorithm.0.@type' is 'RecurringRatingPLA'
      And the response attribute 'pricingLogicAlgorithm.0.@schemaLocation' is 'https://example.test/schema/RecurringRatingPLA.json'
      And the response attribute 'pricingLogicAlgorithm.0.plaSpecId' is 'pla-spec-1'
      When the 'v4' client retrieves the 'rated price'
      Then the response has no compatibility warnings
      And the response attribute 'pricingLogicAlgorithm.0.@type' is 'RecurringRatingPLA'

    Scenario: G3, S2 - a characteristic value @type that is not a v5 subtype is replaced, with a warning
      When the 'v4' client creates the 'productSpecification' 'handset' with:
        """
        { "productSpecCharacteristic": [ { "name": "Colour", "productSpecCharacteristicValue": [ { "@type": "StringCharacteristic", "value": "Midnight" } ] } ] }
        """
      Then the response status is 201
      And the response has the compatibility warning 'W-CHARVALUE-TYPE' for 'productSpecCharacteristic[0].productSpecCharacteristicValue[0].@type'
      And the compatibility counter for 'W-CHARVALUE-TYPE' on 'productSpecification' 'create' went up
      When the 'v5' client retrieves the 'handset'
      Then the response matches the TMF620 'v5' specification
      And the response attribute 'productSpecCharacteristic.0.characteristicValueSpecification.0.@type' is 'StringCharacteristicValueSpecification'
      And the response attribute 'productSpecCharacteristic.0.characteristicValueSpecification.0.value' is 'Midnight'

  Rule: R2 - a v5 PartyRoleRef read and updated through v4

    Background:
      Given the 'v5' client has created the 'catalog' 'managed catalogue' with:
        """
        { "relatedParty": [ { "@type": "RelatedPartyRefOrPartyRoleRef", "role": "manager",
            "partyOrPartyRole": { "@type": "PartyRoleRef", "id": "pr-9", "name": "Catalogue manager", "partyId": "ind-1", "partyName": "Sam Jones" } } ] }
        """

    Scenario: R2 - v4 shows a PartyRoleRef without partyId and partyName, with warnings
      When the 'v4' client retrieves the 'managed catalogue'
      Then the response status is 200
      And the response matches the TMF620 'v4' specification
      And the response has the compatibility warning 'W-PARTYROLE' for 'relatedParty[0].partyOrPartyRole.partyId'
      And the response has the compatibility warning 'W-PARTYROLE' for 'relatedParty[0].partyOrPartyRole.partyName'
      And the response attribute 'relatedParty.0.id' is 'pr-9'
      And the response attribute 'relatedParty.0.role' is 'manager'
      And the response has no attribute 'relatedParty.0.partyId'
      And the compatibility counter for 'W-PARTYROLE' on 'catalog' 'read' went up

    Scenario: R2 - a v4 update of the related party keeps partyId and partyName
      When the 'v4' client patches the 'managed catalogue' with:
        """
        { "relatedParty": [ { "id": "pr-9", "name": "Head of catalogue", "role": "manager", "@referredType": "PartyRole" } ] }
        """
      Then the response status is 200
      When the 'v5' client retrieves the 'managed catalogue'
      Then the response attribute 'relatedParty.0.partyOrPartyRole.name' is 'Head of catalogue'
      And the response attribute 'relatedParty.0.partyOrPartyRole.partyId' is 'ind-1'
      And the response attribute 'relatedParty.0.partyOrPartyRole.partyName' is 'Sam Jones'

  Rule: K1 - a v5 Category parent read and filtered through v4

    Background:
      Given the 'v4' client has created the 'category' 'parent' with:
        """
        { "isRoot": true }
        """
      And the 'v5' client has created the 'category' 'child' with:
        """
        { "isRoot": false, "parent": { "@type": "CategoryRef", "id": "{{id:parent}}", "version": "2" } }
        """

    Scenario: K1 - v4 shows a v5 parent as parentId and warns about parent.version
      When the 'v4' client retrieves the 'child'
      Then the response status is 200
      And the response matches the TMF620 'v4' specification
      And the response attribute 'parentId' is '{{id:parent}}'
      And the response has no attribute 'parent'
      And the response has the compatibility warning 'W-V5ONLY-ATTR' for 'parentId.version'
      And the compatibility counter for 'W-V5ONLY-ATTR' on 'category' 'read' went up

    Scenario: K1 - v4 filters on parentId
      When the 'v4' client lists 'category' resources with:
        | parentId | {{id:parent}} |
      Then the list holds only 'child'

  Rule: S2, S3 - characteristic values

    Scenario: S2 - a v4 value that does not fit its valueType is refused, and nothing is stored
      When the 'v4' client creates the 'productSpecification' 'bad value' with:
        """
        { "productSpecCharacteristic": [ { "name": "Data allowance", "valueType": "integer", "productSpecCharacteristicValue": [ { "value": "Unlimited" } ] } ] }
        """
      Then the response status is 422
      And the response error code is 'TMF620-COMPAT-422-CHARVALUE-TYPE'
      And the response message mentions 'productSpecCharacteristic[0].productSpecCharacteristicValue[0]'
      And the response message mentions '"Unlimited" is not an integer'
      And the response message mentions 'StringCharacteristicValueSpecification'
      And nothing was stored under the name that was sent
      And the compatibility counter for 'TMF620-COMPAT-422-CHARVALUE-TYPE' on 'productSpecification' 'create' went up

    Scenario: S3 - a v4 range limit that is not an integer is refused, and nothing is stored
      When the 'v4' client creates the 'productSpecification' 'bad range' with:
        """
        { "productSpecCharacteristic": [ { "name": "Tethering allowance", "valueType": "integer", "productSpecCharacteristicValue": [ { "valueFrom": "0.5", "valueTo": "100" } ] } ] }
        """
      Then the response status is 422
      And the response error code is 'TMF620-COMPAT-422-RANGE-NOT-INTEGER'
      And the response message mentions 'valueFrom'
      And the response message mentions 'unitOfMeasure'
      And nothing was stored under the name that was sent
      And the compatibility counter for 'TMF620-COMPAT-422-RANGE-NOT-INTEGER' on 'productSpecification' 'create' went up

    Scenario: S3 - a v4 filter on a range limit with a value that is not an integer is refused
      When the 'v4' client lists 'productSpecification' resources with:
        | productSpecCharacteristic.productSpecCharacteristicValue.valueTo | 10GB |
      Then the response status is 400
      And the response error code is 'TMF620-COMPAT-400-FILTER-VALUE'
      And the response message mentions 'productSpecCharacteristic.productSpecCharacteristicValue.valueTo'
      And the response message mentions '"10GB" is not an integer'
      And the compatibility counter for 'TMF620-COMPAT-400-FILTER-VALUE' on 'productSpecification' 'filter' went up

  Rule: S4 - characteristic relationships

    Scenario: S4 - a v4 charSpecSeq is refused with a hint to order the array instead
      When the 'v4' client creates the 'productSpecification' 'sequenced' with:
        """
        { "productSpecCharacteristic": [ { "name": "Speed", "productSpecCharRelationship": [ { "id": "ps-other", "name": "Speed", "relationshipType": "dependency", "charSpecSeq": 2 } ] } ] }
        """
      Then the response status is 422
      And the response error code is 'TMF620-COMPAT-422-V4ONLY-ATTR'
      And the response message mentions 'productSpecCharacteristic[0].productSpecCharRelationship[0].charSpecSeq'
      And the response message mentions 'order the relationship array'
      And nothing was stored under the name that was sent
      And the compatibility counter for 'TMF620-COMPAT-422-V4ONLY-ATTR' on 'productSpecification' 'create' went up

    Scenario: S4 - v4 shows a v5 characteristic relationship without characteristicSpecificationId, with a warning
      Given the 'v5' client has created the 'productSpecification' 'related' with:
        """
        { "productSpecCharacteristic": [ { "@type": "CharacteristicSpecification", "name": "Upload speed", "valueType": "integer",
            "charSpecRelationship": [ { "@type": "CharacteristicSpecificationRelationship", "parentSpecificationId": "ps-full-fibre", "name": "Download speed", "relationshipType": "dependency", "characteristicSpecificationId": "ch-7" } ] } ] }
        """
      When the 'v4' client retrieves the 'related'
      Then the response status is 200
      And the response matches the TMF620 'v4' specification
      And the response attribute 'productSpecCharacteristic.0.productSpecCharRelationship.0.id' is 'ps-full-fibre'
      And the response has the compatibility warning 'W-V5ONLY-ATTR' for 'productSpecCharacteristic[0].productSpecCharRelationship[0].characteristicSpecificationId'
      And the compatibility counter for 'W-V5ONLY-ATTR' on 'productSpecification' 'read' went up

  Rule: S5 - the v5 Boolean and Float value subtypes

    Scenario: S5 - v4 Boolean values are stored as the v5 Boolean subtype
      When the 'v4' client creates the 'productSpecification' 'flags' with:
        """
        { "productSpecCharacteristic": [ { "name": "Static IP", "valueType": "boolean", "productSpecCharacteristicValue": [ { "value": false, "isDefault": true }, { "value": true } ] } ] }
        """
      Then the response status is 201
      When the 'v5' client retrieves the 'flags'
      Then the response matches the TMF620 'v5' specification
      And the response attribute 'productSpecCharacteristic.0.characteristicValueSpecification.0.@type' is 'BooleanCharacteristicValueSpecification'
      And the response attribute 'productSpecCharacteristic.0.characteristicValueSpecification.1.value' is 'true'

    Scenario: S5 - the v5 API refuses a value that does not fit its @type
      When the 'v5' client creates the 'productSpecification' 'bad flag' with:
        """
        { "productSpecCharacteristic": [ { "@type": "CharacteristicSpecification", "name": "Static IP", "valueType": "boolean",
            "characteristicValueSpecification": [ { "@type": "BooleanCharacteristicValueSpecification", "value": "yes" } ] } ] }
        """
      Then the response status is 400
      And the response error code is 'TMF620-V5-400-CHARVALUE-TYPE'
      And the response matches the TMF620 'v5' specification
      And nothing was stored under the name that was sent

  Rule: S6, S7 - v4-only schema attributes

    Scenario: S6, S7 - v4 targetServiceSchema and targetProductSchema.@baseType are refused, both named
      When the 'v4' client creates the 'productSpecification' 'firewall' with:
        """
        { "targetProductSchema": { "@type": "Firewall", "@schemaLocation": "https://example.test/schema/Firewall.json", "@baseType": "Product" },
          "serviceSpecification": [ { "id": "ss-1", "targetServiceSchema": { "@type": "FirewallService", "@schemaLocation": "https://example.test/schema/FirewallService.json" } } ] }
        """
      Then the response status is 422
      And the response error code is 'TMF620-COMPAT-422-V4ONLY-ATTR'
      And the response message mentions 'targetProductSchema.@baseType'
      And the response message mentions 'serviceSpecification[0].targetServiceSchema'
      And nothing was stored under the name that was sent
      And the compatibility counter for 'TMF620-COMPAT-422-V4ONLY-ATTR' on 'productSpecification' 'create' went up

  Rule: S8 - attachments

    Scenario: S8 - a v4 attachment that is neither a reference nor a value is refused
      When the 'v4' client creates the 'productOffering' 'with attachment' with:
        """
        { "attachment": [ { "url": "https://example.test/terms.pdf", "mimeType": "application/pdf", "name": "Terms" }, { "name": "nothing to go on" } ] }
        """
      Then the response status is 422
      And the response error code is 'TMF620-COMPAT-422-ATTACHMENT-AMBIGUOUS'
      And the response message mentions 'attachment[1]'
      And nothing was stored under the name that was sent
      And the compatibility counter for 'TMF620-COMPAT-422-ATTACHMENT-AMBIGUOUS' on 'productOffering' 'create' went up

    Scenario: S8 - v4 attachments become a v5 Attachment or AttachmentRef
      When the 'v4' client creates the 'productOffering' 'with attachments' with:
        """
        { "attachment": [ { "url": "https://example.test/terms.pdf", "mimeType": "application/pdf", "name": "Terms" }, { "id": "att-1", "name": "Price guide" } ] }
        """
      Then the response status is 201
      When the 'v5' client retrieves the 'with attachments'
      Then the response matches the TMF620 'v5' specification
      And the response attribute 'attachment.0.@type' is 'Attachment'
      And the response attribute 'attachment.1.@type' is 'AttachmentRef'

  Rule: S9 - v5-only specification attributes

    Background:
      Given the 'v5' client has created the 'productSpecification' 'enriched spec' with:
        """
        { "externalIdentifier": [ { "@type": "ExternalIdentifier", "id": "SKU-5G-1", "owner": "ERP", "externalIdentifierType": "SKU" } ],
          "policy": [ { "@type": "PolicyRef", "id": "pol-fair-use" } ] }
        """

    Scenario: S9 - v4 leaves out v5-only specification attributes, with warnings
      When the 'v4' client retrieves the 'enriched spec'
      Then the response status is 200
      And the response matches the TMF620 'v4' specification
      And the response has the compatibility warning 'W-V5ONLY-ATTR' for 'externalIdentifier'
      And the response has the compatibility warning 'W-V5ONLY-ATTR' for 'policy'
      And the response has no attribute 'externalIdentifier'
      And the compatibility counter for 'W-V5ONLY-ATTR' on 'productSpecification' 'read' went up

    Scenario: S9 - a v4 update keeps the v5-only specification attributes
      When the 'v4' client patches the 'enriched spec' with:
        """
        { "description": "Changed through v4" }
        """
      Then the response status is 200
      When the 'v5' client retrieves the 'enriched spec'
      Then the response attribute 'description' is 'Changed through v4'
      And the response attribute 'externalIdentifier.0.id' is 'SKU-5G-1'
      And the response attribute 'policy.0.id' is 'pol-fair-use'

  Rule: O5 - v5-only offering attributes

    Background:
      Given the 'v5' client has created the 'productOffering' 'enriched offering' with:
        """
        { "allowedAction": [ { "@type": "AllowedProductAction", "action": "add", "channel": [] } ],
          "productOfferingRelationship": [ { "@type": "ProductOfferingRelationship", "id": "po-tv-essentials", "relationshipType": "recommends" } ] }
        """

    Scenario: O5 - v4 leaves out v5-only offering attributes, with warnings
      When the 'v4' client retrieves the 'enriched offering'
      Then the response status is 200
      And the response matches the TMF620 'v4' specification
      And the response has the compatibility warning 'W-V5ONLY-ATTR' for 'allowedAction'
      And the response has the compatibility warning 'W-V5ONLY-ATTR' for 'productOfferingRelationship'
      And the compatibility counter for 'W-V5ONLY-ATTR' on 'productOffering' 'read' went up

    Scenario: O5 - a v4 update keeps the v5-only offering attributes
      When the 'v4' client patches the 'enriched offering' with:
        """
        { "isSellable": false }
        """
      Then the response status is 200
      When the 'v5' client retrieves the 'enriched offering'
      Then the response attribute 'isSellable' is 'false'
      And the response attribute 'productOfferingRelationship.0.relationshipType' is 'recommends'
      And the response attribute 'allowedAction.0.action' is 'add'

  Rule: P2 - v5-only price attributes

    Background:
      Given the 'v5' client has created the 'productOfferingPrice' 'enriched price' with:
        """
        { "priceType": "recurring", "price": { "unit": "GBP", "value": 30 },
          "externalIdentifier": [ { "@type": "ExternalIdentifier", "id": "BILL-5G-30", "owner": "Billing" } ] }
        """

    Scenario: P2 - v4 leaves out v5-only price attributes, with a warning
      When the 'v4' client retrieves the 'enriched price'
      Then the response matches the TMF620 'v4' specification
      And the response has the compatibility warning 'W-V5ONLY-ATTR' for 'externalIdentifier'
      And the compatibility counter for 'W-V5ONLY-ATTR' on 'productOfferingPrice' 'read' went up

    Scenario: P2 - a v4 update keeps the v5-only price attributes
      When the 'v4' client patches the 'enriched price' with:
        """
        { "price": { "unit": "GBP", "value": 28 } }
        """
      Then the response status is 200
      When the 'v5' client retrieves the 'enriched price'
      Then the response attribute 'price.value' is '28'
      And the response attribute 'externalIdentifier.0.id' is 'BILL-5G-30'

  Rule: O1 - embedded prices

    # The v5 OAS needs id and lastUpdate on a price embedded in a create (FVO), but not
    # in a PATCH (MVO), so the id-less case is set up with a v5 PATCH.

    Background:
      Given the 'v4' client has created the 'productOfferingPrice' 'monthly' with:
        """
        { "priceType": "recurring", "price": { "unit": "GBP", "value": 30 } }
        """
      And the 'v5' client has created the 'productOffering' 'with embedded price' with:
        """
        { "productOfferingPrice": [
            { "@type": "ProductOfferingPriceRef", "id": "{{id:monthly}}" },
            { "@type": "ProductOfferingPrice", "id": "{{id:monthly}}-activation", "name": "Activation fee", "priceType": "oneTime", "lifecycleStatus": "Active", "lastUpdate": "2026-11-01T00:00:00Z", "price": { "unit": "GBP", "value": 10 } } ] }
        """

    Scenario: O1 - v4 shows an embedded price as a reference without its price, with a warning
      When the 'v4' client retrieves the 'with embedded price'
      Then the response status is 200
      And the response matches the TMF620 'v4' specification
      And the response attribute 'productOfferingPrice.1.id' is '{{id:monthly}}-activation'
      And the response attribute 'productOfferingPrice.1.name' is 'Activation fee'
      And the response has no attribute 'productOfferingPrice.1.price'
      And the response has the compatibility warning 'W-EMBEDDED-POP' for 'productOfferingPrice[1]'
      And the compatibility counter for 'W-EMBEDDED-POP' on 'productOffering' 'read' went up

    Scenario: O1 - sending the references back through v4 keeps the embedded price; only its name changes
      When the 'v4' client patches the 'with embedded price' with:
        """
        { "productOfferingPrice": [ { "id": "{{id:monthly}}" }, { "id": "{{id:monthly}}-activation", "name": "Connection fee" } ] }
        """
      Then the response status is 200
      When the 'v5' client retrieves the 'with embedded price'
      Then the response attribute 'productOfferingPrice.1.@type' is 'ProductOfferingPrice'
      And the response attribute 'productOfferingPrice.1.name' is 'Connection fee'
      And the response attribute 'productOfferingPrice.1.price.value' is '10'

    Scenario: O1 - v4 leaves out an embedded price that has no id, with a warning
      Given the 'v5' client has patched the 'with embedded price' with:
        """
        { "productOfferingPrice": [
            { "@type": "ProductOfferingPriceRef", "id": "{{id:monthly}}" },
            { "@type": "ProductOfferingPrice", "id": "{{id:monthly}}-activation", "name": "Activation fee", "priceType": "oneTime", "lifecycleStatus": "Active", "lastUpdate": "2026-11-01T00:00:00Z", "price": { "unit": "GBP", "value": 10 } },
            { "@type": "ProductOfferingPrice", "name": "Router delivery", "priceType": "oneTime", "lifecycleStatus": "Active", "lastUpdate": "2026-11-01T00:00:00Z", "price": { "unit": "GBP", "value": 5 } } ] }
        """
      When the 'v4' client retrieves the 'with embedded price'
      Then the response has no attribute 'productOfferingPrice.2'
      And the response has the compatibility warning 'W-EMBEDDED-POP' for 'productOfferingPrice[2]'

    Scenario: O1 - v4 cannot replace embedded prices it cannot see
      Given the 'v5' client has patched the 'with embedded price' with:
        """
        { "productOfferingPrice": [
            { "@type": "ProductOfferingPriceRef", "id": "{{id:monthly}}" },
            { "@type": "ProductOfferingPrice", "id": "{{id:monthly}}-activation", "name": "Activation fee", "priceType": "oneTime", "lifecycleStatus": "Active", "lastUpdate": "2026-11-01T00:00:00Z", "price": { "unit": "GBP", "value": 10 } },
            { "@type": "ProductOfferingPrice", "name": "Router delivery", "priceType": "oneTime", "lifecycleStatus": "Active", "lastUpdate": "2026-11-01T00:00:00Z", "price": { "unit": "GBP", "value": 5 } } ] }
        """
      When the 'v4' client patches the 'with embedded price' with:
        """
        { "productOfferingPrice": [ { "id": "{{id:monthly}}" } ] }
        """
      Then the response status is 409
      And the response error code is 'TMF620-COMPAT-409-UNMATCHED'
      And the response message mentions 'productOfferingPrice'
      And the response message mentions '/v5/productOffering/{{id:with embedded price}}'
      And the compatibility counter for 'TMF620-COMPAT-409-UNMATCHED' on 'productOffering' 'patch' went up

    Scenario: O1 - a v4 update of another attribute keeps every embedded price
      Given the 'v5' client has patched the 'with embedded price' with:
        """
        { "productOfferingPrice": [
            { "@type": "ProductOfferingPriceRef", "id": "{{id:monthly}}" },
            { "@type": "ProductOfferingPrice", "id": "{{id:monthly}}-activation", "name": "Activation fee", "priceType": "oneTime", "lifecycleStatus": "Active", "lastUpdate": "2026-11-01T00:00:00Z", "price": { "unit": "GBP", "value": 10 } },
            { "@type": "ProductOfferingPrice", "name": "Router delivery", "priceType": "oneTime", "lifecycleStatus": "Active", "lastUpdate": "2026-11-01T00:00:00Z", "price": { "unit": "GBP", "value": 5 } } ] }
        """
      When the 'v4' client patches the 'with embedded price' with:
        """
        { "description": "Patched through v4" }
        """
      Then the response status is 200
      When the 'v5' client retrieves the 'with embedded price'
      Then the response attribute 'description' is 'Patched through v4'
      And the response attribute 'productOfferingPrice.2.name' is 'Router delivery'

  Rule: O3 - bundled offering lifecycleStatus

    Scenario: O3 - a v4 bundled offering lifecycleStatus is refused
      When the 'v4' client creates the 'productOffering' 'part' with:
        """
        { "lifecycleStatus": "Active" }
        """
      And the 'v4' client creates the 'productOffering' 'bundle' with:
        """
        { "isBundle": true, "bundledProductOffering": [ { "id": "{{id:part}}", "lifecycleStatus": "Active" } ] }
        """
      Then the response status is 422
      And the response error code is 'TMF620-COMPAT-422-V4ONLY-ATTR'
      And the response message mentions 'bundledProductOffering[0].lifecycleStatus'
      And the response message mentions 'bundled offering itself'
      And nothing was stored under the name that was sent
      And the compatibility counter for 'TMF620-COMPAT-422-V4ONLY-ATTR' on 'productOffering' 'create' went up

  Rule: P1 - price constraint

    Scenario: P1 - a v4 price constraint is refused with the policy hint, and nothing is stored
      When the 'v4' client creates the 'productOfferingPrice' 'constrained' with:
        """
        { "priceType": "recurring", "price": { "unit": "GBP", "value": 30 }, "constraint": [ { "id": "con-1", "name": "UK customers only" } ] }
        """
      Then the response status is 422
      And the response error code is 'TMF620-COMPAT-422-V4ONLY-ATTR'
      And the response message mentions 'constraint'
      And the response message mentions 'policy'
      And nothing was stored under the name that was sent
      And the compatibility counter for 'TMF620-COMPAT-422-V4ONLY-ATTR' on 'productOfferingPrice' 'create' went up

    Scenario: P1 - a v4 filter on constraint is refused, because nothing can be stored there
      When the 'v4' client lists 'productOfferingPrice' resources with:
        | constraint.id | con-1 |
      Then the response status is 400
      And the response error code is 'TMF620-COMPAT-400-V4ONLY-FILTER'
      And the response message mentions 'constraint.id'
      And the compatibility counter for 'TMF620-COMPAT-400-V4ONLY-FILTER' on 'productOfferingPrice' 'filter' went up

  Rule: P3 - price relationships

    Background:
      Given the 'v4' client has created the 'productOfferingPrice' 'half price' with:
        """
        { "priceType": "discount", "percentage": 50 }
        """
      And the 'v5' client has created the 'productOfferingPrice' 'discounted' with:
        """
        { "priceType": "recurring", "price": { "unit": "GBP", "value": 45 },
          "popRelationship": [ { "@type": "ProductOfferingPriceRelationship", "id": "{{id:half price}}", "relationshipType": "discount", "role": "introductory offer" } ] }
        """

    Scenario: P3 - v4 leaves out the v5 relationship role, with a warning
      When the 'v4' client retrieves the 'discounted'
      Then the response matches the TMF620 'v4' specification
      And the response attribute 'popRelationship.0.id' is '{{id:half price}}'
      And the response has the compatibility warning 'W-V5ONLY-ATTR' for 'popRelationship[0].role'
      And the compatibility counter for 'W-V5ONLY-ATTR' on 'productOfferingPrice' 'read' went up

    Scenario: P3 - a v4 update of the relationship keeps the v5 role
      When the 'v4' client patches the 'discounted' with:
        """
        { "popRelationship": [ { "id": "{{id:half price}}", "relationshipType": "discount", "name": "Half price for 6 months" } ] }
        """
      Then the response status is 200
      When the 'v5' client retrieves the 'discounted'
      Then the response attribute 'popRelationship.0.name' is 'Half price for 6 months'
      And the response attribute 'popRelationship.0.role' is 'introductory offer'
