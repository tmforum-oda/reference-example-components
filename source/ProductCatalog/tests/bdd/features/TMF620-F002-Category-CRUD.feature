# Category create, read, list, update and delete through both TMF620 API
# versions (issue #87, spec 10.3), with the telco catalogue test data (spec 10.2).
# Root categories and sub-categories (with a parent).
# One scenario per operation or filter; each creates what it needs.
# Lifecycle: create (In design) -> Active -> change -> Retired -> DELETE -> 404.

@crud @TMF620-F002
Feature: TMF620-F002 Category CRUD and lifecycle

  Scenario Outline: '<apiVersion>': create the '<key>' category
    Given the TMF620 '<apiVersion>' client
    And the telco catalogue entries that the 'category' '<key>' refers to exist
    When I create the 'category' '<key>' from the telco catalogue
    Then the response status is 201
    And the response matches the TMF620 '<apiVersion>' specification
    And the response href is under the '<apiVersion>' base path
    And the response holds the content that was sent
    And the response attribute 'lifecycleStatus' is 'In design'

    @v4
    Examples: TMF620 v4
      | apiVersion | key      |
      | v4         | mobile   |
      | v4         | sim-only |
      | v4         | bundles  |

    @v5
    Examples: TMF620 v5
      | apiVersion | key      |
      | v5         | mobile   |
      | v5         | sim-only |
      | v5         | bundles  |

  Scenario Outline: '<apiVersion>': retrieve the '<key>' category
    Given the TMF620 '<apiVersion>' client
    And the 'category' '<key>' has been created from the telco catalogue
    When I retrieve the created 'category'
    Then the response status is 200
    And the response matches the TMF620 '<apiVersion>' specification
    And the response holds the content that was sent

    @v4
    Examples: TMF620 v4
      | apiVersion | key      |
      | v4         | mobile   |
      | v4         | sim-only |
      | v4         | bundles  |

    @v5
    Examples: TMF620 v5
      | apiVersion | key      |
      | v5         | mobile   |
      | v5         | sim-only |
      | v5         | bundles  |

  Scenario Outline: '<apiVersion>': list categories by name
    Given the TMF620 '<apiVersion>' client
    And the 'category' '<key>' has been created from the telco catalogue
    When I list 'category' resources with the created name
    Then the list holds only the created 'category'
    And the response matches the TMF620 '<apiVersion>' specification

    @v4
    Examples: TMF620 v4
      | apiVersion | key    |
      | v4         | mobile |

    @v5
    Examples: TMF620 v5
      | apiVersion | key    |
      | v5         | mobile |

  Scenario Outline: '<apiVersion>': filter categories by lifecycleStatus
    Given the TMF620 '<apiVersion>' client
    And the 'category' '<key>' has been created from the telco catalogue
    When I list 'category' resources with the created name and 'lifecycleStatus' 'In design'
    Then the list holds only the created 'category'
    When I list 'category' resources with the created name and 'lifecycleStatus' 'Active'
    Then the list is empty

    @v4
    Examples: TMF620 v4
      | apiVersion | key    |
      | v4         | mobile |

    @v5
    Examples: TMF620 v5
      | apiVersion | key    |
      | v5         | mobile |

  Scenario Outline: '<apiVersion>': filter categories by lastUpdate
    Given the TMF620 '<apiVersion>' client
    And the 'category' '<key>' has been created from the telco catalogue
    When I list 'category' resources with the created name, updated since it was created
    Then the list holds only the created 'category'
    When I list 'category' resources with the created name, updated before it was created
    Then the list is empty

    @v4
    Examples: TMF620 v4
      | apiVersion | key    |
      | v4         | mobile |

    @v5
    Examples: TMF620 v5
      | apiVersion | key    |
      | v5         | mobile |

  Scenario Outline: '<apiVersion>': select the attributes of listed categories with fields
    Given the TMF620 '<apiVersion>' client
    And the 'category' '<key>' has been created from the telco catalogue
    When I list 'category' resources with the created name and fields 'name,lifecycleStatus'
    Then the response status is 200
    And every listed item has only the attributes 'name,lifecycleStatus'

    @v4
    Examples: TMF620 v4
      | apiVersion | key    |
      | v4         | mobile |

    @v5
    Examples: TMF620 v5
      | apiVersion | key    |
      | v5         | mobile |

  Scenario Outline: '<apiVersion>': activate a category
    Given the TMF620 '<apiVersion>' client
    And the 'category' '<key>' has been created from the telco catalogue
    When I patch the created 'category' with:
      """
      { "lifecycleStatus": "Active" }
      """
    Then the response status is 200
    And the response attribute 'lifecycleStatus' is 'Active'
    And the response matches the TMF620 '<apiVersion>' specification

    @v4
    Examples: TMF620 v4
      | apiVersion | key    |
      | v4         | mobile |

    @v5
    Examples: TMF620 v5
      | apiVersion | key    |
      | v5         | mobile |

  Scenario Outline: '<apiVersion>': change the active '<key>' category
    Given the TMF620 '<apiVersion>' client
    And the 'category' '<key>' has been created from the telco catalogue
    And the created 'category' is 'Active'
    When I patch the created 'category' with:
      """
      <change>
      """
    Then the response status is 200
    And the response attribute '<attribute>' is '<value>'
    And the response attribute 'lifecycleStatus' is 'Active'
    And the response matches the TMF620 '<apiVersion>' specification
    When I retrieve the created 'category'
    Then the response attribute '<attribute>' is '<value>'

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

  Scenario Outline: '<apiVersion>': retire an active category
    Given the TMF620 '<apiVersion>' client
    And the 'category' '<key>' has been created from the telco catalogue
    And the created 'category' is 'Active'
    When I patch the created 'category' with:
      """
      { "lifecycleStatus": "Retired" }
      """
    Then the response status is 200
    When I retrieve the created 'category'
    Then the response attribute 'lifecycleStatus' is 'Retired'
    And the response matches the TMF620 '<apiVersion>' specification

    @v4
    Examples: TMF620 v4
      | apiVersion | key    |
      | v4         | mobile |

    @v5
    Examples: TMF620 v5
      | apiVersion | key    |
      | v5         | mobile |

  Scenario Outline: '<apiVersion>': delete a category
    Given the TMF620 '<apiVersion>' client
    And the 'category' '<key>' has been created from the telco catalogue
    When I delete the created 'category'
    Then the response status is 204
    When I retrieve the created 'category'
    Then the response status is 404

    @v4
    Examples: TMF620 v4
      | apiVersion | key    |
      | v4         | mobile |

    @v5
    Examples: TMF620 v5
      | apiVersion | key    |
      | v5         | mobile |
