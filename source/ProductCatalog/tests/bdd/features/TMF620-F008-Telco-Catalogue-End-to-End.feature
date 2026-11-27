# End-to-end telco catalogue (issue #87, spec 10.3): the v4 client builds the
# Example Telco consumer catalogue, the v5 client builds the small-business
# catalogue on the categories, specifications and prices v4 created, and enriches
# a consumer offering with v5-only data. Both clients then list and filter the
# whole catalogue, and the last scenario deletes everything and checks nothing is left.
# The Background builds the catalogue again for each scenario, so each one stands alone.

@e2e @TMF620-F008
Feature: TMF620-F008 Telco catalogue end to end

  Background:
    Given the 'v4' client builds the telco catalogue entries:
      | kind            | key             |
      | catalog         | consumer        |
      | productOffering | 5g-unlimited-24 |
      | productOffering | nova-x5-36      |
      | productOffering | ff1000          |
      | productOffering | tv-essentials   |
      | productOffering | home-bundle     |
    And the 'v5' client builds the telco catalogue entries:
      | kind            | key            |
      | catalog         | small-business |
      | productOffering | 5g-100gb-12    |
      | productOffering | ff500          |

  Scenario: The small-business catalogue is built on what v4 created, and both versions list all of it
    # 1 catalogue, 6 categories, 5 specifications, 9 prices and 5 offerings
    Then the 'v4' client built 26 telco catalogue entries
    # 1 catalogue, 2 prices and 2 offerings: everything else is shared with v4
    And the 'v5' client built 5 telco catalogue entries
    And every telco catalogue entry built in this scenario is listed by name in v4 and v5

  Scenario: v4 warns about a v5-only enrichment of a consumer offering
    When the 'v5' client patches the 'ff1000' with:
      """
      { "externalIdentifier": [ { "@type": "ExternalIdentifier", "id": "SKU-FF1000", "owner": "ERP", "externalIdentifierType": "SKU" } ],
        "productOfferingRelationship": [ { "@type": "ProductOfferingRelationship", "id": "{{id:tv-essentials}}", "relationshipType": "recommends" } ] }
      """
    Then the response status is 200
    And the response matches the TMF620 'v5' specification
    When the 'v4' client retrieves the 'ff1000'
    Then the response matches the TMF620 'v4' specification
    And the response has the compatibility warning 'W-V5ONLY-ATTR' for 'externalIdentifier'
    And the response has the compatibility warning 'W-V5ONLY-ATTR' for 'productOfferingRelationship'

  Scenario: A v4 change to an enriched offering keeps the v5-only data
    Given the 'v5' client has patched the 'ff1000' with:
      """
      { "externalIdentifier": [ { "@type": "ExternalIdentifier", "id": "SKU-FF1000", "owner": "ERP", "externalIdentifierType": "SKU" } ],
        "productOfferingRelationship": [ { "@type": "ProductOfferingRelationship", "id": "{{id:tv-essentials}}", "relationshipType": "recommends" } ] }
      """
    When the 'v4' client patches the 'ff1000' with:
      """
      { "lifecycleStatus": "Active" }
      """
    Then the response status is 200
    When the 'v5' client retrieves the 'ff1000'
    Then the response attribute 'lifecycleStatus' is 'Active'
    And the response attribute 'externalIdentifier.0.id' is 'SKU-FF1000'
    And the response attribute 'productOfferingRelationship.0.id' is '{{id:tv-essentials}}'

  Scenario: Both versions filter offerings by category and see offerings from both clients
    When the 'v4' client lists 'productOffering' resources with:
      | category.id | {{id:sim-only}} |
    Then the list holds only '5g-unlimited-24, 5g-100gb-12'
    And the response matches the TMF620 'v4' specification
    When the 'v5' client lists 'productOffering' resources with:
      | category.id | {{id:sim-only}} |
    Then the list holds only '5g-unlimited-24, 5g-100gb-12'
    And the response matches the TMF620 'v5' specification

  Scenario: Both versions filter offerings by specification, and v5 also by lifecycleStatus
    Given the 'v4' client has patched the 'ff1000' with:
      """
      { "lifecycleStatus": "Active" }
      """
    When the 'v4' client lists 'productOffering' resources with:
      | productSpecification.id | {{id:full-fibre}} |
    Then the list holds only 'ff500, ff1000'
    When the 'v5' client lists 'productOffering' resources with:
      | productSpecification.id | {{id:full-fibre}} |
      | lifecycleStatus         | Active            |
    Then the list holds only 'ff1000'

  Scenario: Both versions filter categories by parent, each in its own form
    When the 'v4' client lists 'category' resources with:
      | parentId | {{id:mobile}} |
    Then the list holds only 'sim-only, handsets'
    When the 'v5' client lists 'category' resources with:
      | parent.id | {{id:mobile}} |
    Then the list holds only 'sim-only, handsets'

  Scenario: Both versions filter prices by name, and v5 shows the discount relationship
    When the 'v4' client lists 'productOfferingPrice' resources with:
      | name | {{name:ff500-monthly}} |
    Then the list holds only 'ff500-monthly'
    When the 'v5' client lists 'productOfferingPrice' resources with:
      | name | {{name:ff1000-monthly}} |
    Then the list holds only 'ff1000-monthly'
    And the response attribute '0.popRelationship.0.id' is '{{id:ff1000-discount}}'

  Scenario: Deleting the whole catalogue leaves nothing in either version
    When everything built in this scenario is deleted
    Then none of it can be found through v4 or v5
