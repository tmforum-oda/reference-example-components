# Category create, read, list, update and delete through both TMF620 API
# versions (issue #87, spec 10.3), with the telco catalogue test data (spec 10.2).
# Root categories and sub-categories (with a parent).
# Lifecycle: create (In design) -> Active -> change -> Retired -> DELETE -> 404.

@crud @TMF620-F002
Feature: TMF620-F002 Category CRUD and lifecycle

  Scenario Outline: '<apiVersion>': the '<key>' category from In design to Retired
    Given the TMF620 '<apiVersion>' client
    And the telco catalogue entries that the 'category' '<key>' refers to exist
    When I create the 'category' '<key>' from the telco catalogue
    Then the response status is 201
    And the response matches the TMF620 '<apiVersion>' specification
    And the response href is under the '<apiVersion>' base path
    And the response holds the content that was sent
    And the response attribute 'lifecycleStatus' is 'In design'
    When I retrieve the created 'category'
    Then the response status is 200
    And the response matches the TMF620 '<apiVersion>' specification
    And the response holds the content that was sent
    When I list 'category' resources with the created name
    Then the list holds only the created 'category'
    And the response matches the TMF620 '<apiVersion>' specification
    When I list 'category' resources with the created name and 'lifecycleStatus' 'In design'
    Then the list holds only the created 'category'
    When I list 'category' resources with the created name and 'lifecycleStatus' 'Active'
    Then the list is empty
    When I list 'category' resources with the created name, updated since it was created
    Then the list holds only the created 'category'
    When I list 'category' resources with the created name, updated before it was created
    Then the list is empty
    When I list 'category' resources with the created name and fields 'name,lifecycleStatus'
    Then the response status is 200
    And every listed item has only the attributes 'name,lifecycleStatus'
    When I patch the created 'category' with:
      """
      { "lifecycleStatus": "Active" }
      """
    Then the response status is 200
    And the response attribute 'lifecycleStatus' is 'Active'
    And the response matches the TMF620 '<apiVersion>' specification
    When I patch the created 'category' with:
      """
      <change>
      """
    Then the response status is 200
    And the response attribute '<attribute>' is '<value>'
    And the response attribute 'lifecycleStatus' is 'Active'
    When I patch the created 'category' with:
      """
      { "lifecycleStatus": "Retired" }
      """
    Then the response status is 200
    When I retrieve the created 'category'
    Then the response status is 200
    And the response attribute 'lifecycleStatus' is 'Retired'
    And the response attribute '<attribute>' is '<value>'
    And the response matches the TMF620 '<apiVersion>' specification
    When I delete the created 'category'
    Then the response status is 204
    When I retrieve the created 'category'
    Then the response status is 404

    @v4
    Examples: TMF620 v4
      | apiVersion | key      | change                                                              | attribute   | value                                          |
      | v4         | mobile   | { "description": "Mobile plans, handsets and accessories" }         | description | Mobile plans, handsets and accessories         |
      | v4         | sim-only | { "description": "Mobile plans without a device, 12 or 24 months" } | description | Mobile plans without a device, 12 or 24 months |
      | v4         | bundles  | { "isRoot": false }                                                 | isRoot      | false                                          |

    @v5
    Examples: TMF620 v5
      | apiVersion | key      | change                                                              | attribute   | value                                          |
      | v5         | mobile   | { "description": "Mobile plans, handsets and accessories" }         | description | Mobile plans, handsets and accessories         |
      | v5         | sim-only | { "description": "Mobile plans without a device, 12 or 24 months" } | description | Mobile plans without a device, 12 or 24 months |
      | v5         | bundles  | { "isRoot": false }                                                 | isRoot      | false                                          |
