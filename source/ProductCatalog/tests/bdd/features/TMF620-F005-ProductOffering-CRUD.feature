# ProductOffering create, read, list, update and delete through both TMF620 API
# versions (issue #87, spec 10.3), with the telco catalogue test data (spec 10.2).
# The seven offerings, each with its specification, prices and categories created first.
# Lifecycle: create (In design) -> Active -> change -> Retired -> DELETE -> 404.

@crud @TMF620-F005
Feature: TMF620-F005 ProductOffering CRUD and lifecycle

  Scenario Outline: '<apiVersion>': the '<key>' offering from In design to Retired
    Given the TMF620 '<apiVersion>' client
    And the telco catalogue entries that the 'productOffering' '<key>' refers to exist
    When I create the 'productOffering' '<key>' from the telco catalogue
    Then the response status is 201
    And the response matches the TMF620 '<apiVersion>' specification
    And the response href is under the '<apiVersion>' base path
    And the response holds the content that was sent
    And the response attribute 'lifecycleStatus' is 'In design'
    When I retrieve the created 'productOffering'
    Then the response status is 200
    And the response matches the TMF620 '<apiVersion>' specification
    And the response holds the content that was sent
    When I list 'productOffering' resources with the created name
    Then the list holds only the created 'productOffering'
    And the response matches the TMF620 '<apiVersion>' specification
    When I list 'productOffering' resources with the created name and 'lifecycleStatus' 'In design'
    Then the list holds only the created 'productOffering'
    When I list 'productOffering' resources with the created name and 'lifecycleStatus' 'Active'
    Then the list is empty
    When I list 'productOffering' resources with the created name, updated since it was created
    Then the list holds only the created 'productOffering'
    When I list 'productOffering' resources with the created name, updated before it was created
    Then the list is empty
    When I list 'productOffering' resources with the created name and fields 'name,lifecycleStatus'
    Then the response status is 200
    And every listed item has only the attributes 'name,lifecycleStatus'
    When I patch the created 'productOffering' with:
      """
      { "lifecycleStatus": "Active" }
      """
    Then the response status is 200
    And the response attribute 'lifecycleStatus' is 'Active'
    And the response matches the TMF620 '<apiVersion>' specification
    When I patch the created 'productOffering' with:
      """
      <change>
      """
    Then the response status is 200
    And the response attribute '<attribute>' is '<value>'
    And the response attribute 'lifecycleStatus' is 'Active'
    When I patch the created 'productOffering' with:
      """
      { "lifecycleStatus": "Retired" }
      """
    Then the response status is 200
    When I retrieve the created 'productOffering'
    Then the response status is 200
    And the response attribute 'lifecycleStatus' is 'Retired'
    And the response attribute '<attribute>' is '<value>'
    And the response matches the TMF620 '<apiVersion>' specification
    When I delete the created 'productOffering'
    Then the response status is 204
    When I retrieve the created 'productOffering'
    Then the response status is 404

    @v4
    Examples: TMF620 v4
      | apiVersion | key             | change                                                                        | attribute   | value                                                    |
      | v4         | 5g-unlimited-24 | { "isSellable": false }                                                       | isSellable  | false                                                    |
      | v4         | 5g-100gb-12     | { "description": "100GB of 5G data on a 12-month plan, EU roaming included" } | description | 100GB of 5G data on a 12-month plan, EU roaming included |
      | v4         | nova-x5-36      | { "version": "1.1" }                                                          | version     | 1.1                                                      |
      | v4         | ff500           | { "isSellable": false }                                                       | isSellable  | false                                                    |
      | v4         | ff1000          | { "version": "1.1" }                                                          | version     | 1.1                                                      |
      | v4         | tv-essentials   | { "description": "The Essentials channel pack, up to four streams" }          | description | The Essentials channel pack, up to four streams          |
      | v4         | home-bundle     | { "version": "1.1" }                                                          | version     | 1.1                                                      |

    @v5
    Examples: TMF620 v5
      | apiVersion | key             | change                                                                        | attribute   | value                                                    |
      | v5         | 5g-unlimited-24 | { "isSellable": false }                                                       | isSellable  | false                                                    |
      | v5         | 5g-100gb-12     | { "description": "100GB of 5G data on a 12-month plan, EU roaming included" } | description | 100GB of 5G data on a 12-month plan, EU roaming included |
      | v5         | nova-x5-36      | { "version": "1.1" }                                                          | version     | 1.1                                                      |
      | v5         | ff500           | { "isSellable": false }                                                       | isSellable  | false                                                    |
      | v5         | ff1000          | { "version": "1.1" }                                                          | version     | 1.1                                                      |
      | v5         | tv-essentials   | { "description": "The Essentials channel pack, up to four streams" }          | description | The Essentials channel pack, up to four streams          |
      | v5         | home-bundle     | { "version": "1.1" }                                                          | version     | 1.1                                                      |
