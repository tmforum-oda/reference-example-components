# ProductSpecification create, read, list, update and delete through both TMF620 API
# versions (issue #87, spec 10.3), with the telco catalogue test data (spec 10.2).
# The five product specifications, with typed characteristics and a bundle.
# Lifecycle: create (In design) -> Active -> change -> Retired -> DELETE -> 404.

@crud @TMF620-F003
Feature: TMF620-F003 ProductSpecification CRUD and lifecycle

  Scenario Outline: '<apiVersion>': the '<key>' specification from In design to Retired
    Given the TMF620 '<apiVersion>' client
    And the telco catalogue entries that the 'productSpecification' '<key>' refers to exist
    When I create the 'productSpecification' '<key>' from the telco catalogue
    Then the response status is 201
    And the response matches the TMF620 '<apiVersion>' specification
    And the response href is under the '<apiVersion>' base path
    And the response holds the content that was sent
    And the response attribute 'lifecycleStatus' is 'In design'
    When I retrieve the created 'productSpecification'
    Then the response status is 200
    And the response matches the TMF620 '<apiVersion>' specification
    And the response holds the content that was sent
    When I list 'productSpecification' resources with the created name
    Then the list holds only the created 'productSpecification'
    And the response matches the TMF620 '<apiVersion>' specification
    When I list 'productSpecification' resources with the created name and 'lifecycleStatus' 'In design'
    Then the list holds only the created 'productSpecification'
    When I list 'productSpecification' resources with the created name and 'lifecycleStatus' 'Active'
    Then the list is empty
    When I list 'productSpecification' resources with the created name, updated since it was created
    Then the list holds only the created 'productSpecification'
    When I list 'productSpecification' resources with the created name, updated before it was created
    Then the list is empty
    When I list 'productSpecification' resources with the created name and fields 'name,lifecycleStatus'
    Then the response status is 200
    And every listed item has only the attributes 'name,lifecycleStatus'
    When I patch the created 'productSpecification' with:
      """
      { "lifecycleStatus": "Active" }
      """
    Then the response status is 200
    And the response attribute 'lifecycleStatus' is 'Active'
    And the response matches the TMF620 '<apiVersion>' specification
    When I patch the created 'productSpecification' with:
      """
      <change>
      """
    Then the response status is 200
    And the response attribute '<attribute>' is '<value>'
    And the response attribute 'lifecycleStatus' is 'Active'
    When I patch the created 'productSpecification' with:
      """
      { "lifecycleStatus": "Retired" }
      """
    Then the response status is 200
    When I retrieve the created 'productSpecification'
    Then the response status is 200
    And the response attribute 'lifecycleStatus' is 'Retired'
    And the response attribute '<attribute>' is '<value>'
    And the response matches the TMF620 '<apiVersion>' specification
    When I delete the created 'productSpecification'
    Then the response status is 204
    When I retrieve the created 'productSpecification'
    Then the response status is 404

    @v4
    Examples: TMF620 v4
      | apiVersion | key         | change                                                      | attribute     | value                                  |
      | v4         | 5g-mobile   | { "version": "1.1" }                                        | version       | 1.1                                    |
      | v4         | full-fibre  | { "productNumber": "BB-FTTP-2" }                            | productNumber | BB-FTTP-2                              |
      | v4         | smartphone  | { "brand": "Nova Mobile" }                                  | brand         | Nova Mobile                            |
      | v4         | iptv        | { "version": "1.1" }                                        | version       | 1.1                                    |
      | v4         | home-bundle | { "description": "Full Fibre and IPTV together, one bill" } | description   | Full Fibre and IPTV together, one bill |

    @v5
    Examples: TMF620 v5
      | apiVersion | key         | change                                                      | attribute     | value                                  |
      | v5         | 5g-mobile   | { "version": "1.1" }                                        | version       | 1.1                                    |
      | v5         | full-fibre  | { "productNumber": "BB-FTTP-2" }                            | productNumber | BB-FTTP-2                              |
      | v5         | smartphone  | { "brand": "Nova Mobile" }                                  | brand         | Nova Mobile                            |
      | v5         | iptv        | { "version": "1.1" }                                        | version       | 1.1                                    |
      | v5         | home-bundle | { "description": "Full Fibre and IPTV together, one bill" } | description   | Full Fibre and IPTV together, one bill |
