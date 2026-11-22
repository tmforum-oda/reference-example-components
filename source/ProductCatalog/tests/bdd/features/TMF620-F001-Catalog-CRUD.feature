# Catalog create, read, list, update and delete through both TMF620 API
# versions (issue #87, spec 10.3), with the telco catalogue test data (spec 10.2).
# The consumer and small-business catalogues.
# One scenario per operation or filter; each creates what it needs.
# Lifecycle: create (In design) -> Active -> change -> Retired -> DELETE -> 404.

@crud @TMF620-F001
Feature: TMF620-F001 Catalog CRUD and lifecycle

  Scenario Outline: '<apiVersion>': create the '<key>' catalog
    Given the TMF620 '<apiVersion>' client
    And the telco catalogue entries that the 'catalog' '<key>' refers to exist
    When I create the 'catalog' '<key>' from the telco catalogue
    Then the response status is 201
    And the response matches the TMF620 '<apiVersion>' specification
    And the response href is under the '<apiVersion>' base path
    And the response holds the content that was sent
    And the response attribute 'lifecycleStatus' is 'In design'

    @v4
    Examples: TMF620 v4
      | apiVersion | key            |
      | v4         | consumer       |
      | v4         | small-business |

    @v5
    Examples: TMF620 v5
      | apiVersion | key            |
      | v5         | consumer       |
      | v5         | small-business |

  Scenario Outline: '<apiVersion>': retrieve the '<key>' catalog
    Given the TMF620 '<apiVersion>' client
    And the 'catalog' '<key>' has been created from the telco catalogue
    When I retrieve the created 'catalog'
    Then the response status is 200
    And the response matches the TMF620 '<apiVersion>' specification
    And the response holds the content that was sent

    @v4
    Examples: TMF620 v4
      | apiVersion | key            |
      | v4         | consumer       |
      | v4         | small-business |

    @v5
    Examples: TMF620 v5
      | apiVersion | key            |
      | v5         | consumer       |
      | v5         | small-business |

  Scenario Outline: '<apiVersion>': list catalogs by name
    Given the TMF620 '<apiVersion>' client
    And the 'catalog' '<key>' has been created from the telco catalogue
    When I list 'catalog' resources with the created name
    Then the list holds only the created 'catalog'
    And the response matches the TMF620 '<apiVersion>' specification

    @v4
    Examples: TMF620 v4
      | apiVersion | key      |
      | v4         | consumer |

    @v5
    Examples: TMF620 v5
      | apiVersion | key      |
      | v5         | consumer |

  Scenario Outline: '<apiVersion>': filter catalogs by lifecycleStatus
    Given the TMF620 '<apiVersion>' client
    And the 'catalog' '<key>' has been created from the telco catalogue
    When I list 'catalog' resources with the created name and 'lifecycleStatus' 'In design'
    Then the list holds only the created 'catalog'
    When I list 'catalog' resources with the created name and 'lifecycleStatus' 'Active'
    Then the list is empty

    @v4
    Examples: TMF620 v4
      | apiVersion | key      |
      | v4         | consumer |

    @v5
    Examples: TMF620 v5
      | apiVersion | key      |
      | v5         | consumer |

  Scenario Outline: '<apiVersion>': filter catalogs by lastUpdate
    Given the TMF620 '<apiVersion>' client
    And the 'catalog' '<key>' has been created from the telco catalogue
    When I list 'catalog' resources with the created name, updated since it was created
    Then the list holds only the created 'catalog'
    When I list 'catalog' resources with the created name, updated before it was created
    Then the list is empty

    @v4
    Examples: TMF620 v4
      | apiVersion | key      |
      | v4         | consumer |

    @v5
    Examples: TMF620 v5
      | apiVersion | key      |
      | v5         | consumer |

  Scenario Outline: '<apiVersion>': select the attributes of listed catalogs with fields
    Given the TMF620 '<apiVersion>' client
    And the 'catalog' '<key>' has been created from the telco catalogue
    When I list 'catalog' resources with the created name and fields 'name,lifecycleStatus'
    Then the response status is 200
    And every listed item has only the attributes 'name,lifecycleStatus'

    @v4
    Examples: TMF620 v4
      | apiVersion | key      |
      | v4         | consumer |

    @v5
    Examples: TMF620 v5
      | apiVersion | key      |
      | v5         | consumer |

  Scenario Outline: '<apiVersion>': activate a catalog
    Given the TMF620 '<apiVersion>' client
    And the 'catalog' '<key>' has been created from the telco catalogue
    When I patch the created 'catalog' with:
      """
      { "lifecycleStatus": "Active" }
      """
    Then the response status is 200
    And the response attribute 'lifecycleStatus' is 'Active'
    And the response matches the TMF620 '<apiVersion>' specification

    @v4
    Examples: TMF620 v4
      | apiVersion | key      |
      | v4         | consumer |

    @v5
    Examples: TMF620 v5
      | apiVersion | key      |
      | v5         | consumer |

  Scenario Outline: '<apiVersion>': change the active '<key>' catalog
    Given the TMF620 '<apiVersion>' client
    And the 'catalog' '<key>' has been created from the telco catalogue
    And the created 'catalog' is 'Active'
    When I patch the created 'catalog' with:
      """
      <change>
      """
    Then the response status is 200
    And the response attribute '<attribute>' is '<value>'
    And the response attribute 'lifecycleStatus' is 'Active'
    And the response matches the TMF620 '<apiVersion>' specification
    When I retrieve the created 'catalog'
    Then the response attribute '<attribute>' is '<value>'

    @v4
    Examples: TMF620 v4
      | apiVersion | key            | change                                                                    | attribute   | value                                                |
      | v4         | consumer       | { "version": "2026.12" }                                                  | version     | 2026.12                                              |
      | v4         | small-business | { "description": "Connectivity for businesses with up to 250 employees" } | description | Connectivity for businesses with up to 250 employees |

    @v5
    Examples: TMF620 v5
      | apiVersion | key            | change                                                                    | attribute   | value                                                |
      | v5         | consumer       | { "version": "2026.12" }                                                  | version     | 2026.12                                              |
      | v5         | small-business | { "description": "Connectivity for businesses with up to 250 employees" } | description | Connectivity for businesses with up to 250 employees |

  Scenario Outline: '<apiVersion>': retire an active catalog
    Given the TMF620 '<apiVersion>' client
    And the 'catalog' '<key>' has been created from the telco catalogue
    And the created 'catalog' is 'Active'
    When I patch the created 'catalog' with:
      """
      { "lifecycleStatus": "Retired" }
      """
    Then the response status is 200
    When I retrieve the created 'catalog'
    Then the response attribute 'lifecycleStatus' is 'Retired'
    And the response matches the TMF620 '<apiVersion>' specification

    @v4
    Examples: TMF620 v4
      | apiVersion | key      |
      | v4         | consumer |

    @v5
    Examples: TMF620 v5
      | apiVersion | key      |
      | v5         | consumer |

  Scenario Outline: '<apiVersion>': delete a catalog
    Given the TMF620 '<apiVersion>' client
    And the 'catalog' '<key>' has been created from the telco catalogue
    When I delete the created 'catalog'
    Then the response status is 204
    When I retrieve the created 'catalog'
    Then the response status is 404

    @v4
    Examples: TMF620 v4
      | apiVersion | key      |
      | v4         | consumer |

    @v5
    Examples: TMF620 v5
      | apiVersion | key      |
      | v5         | consumer |
