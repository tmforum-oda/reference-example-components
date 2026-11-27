# ProductSpecification create, read, list, update and delete through both TMF620 API
# versions (issue #87, spec 10.3), with the telco catalogue test data (spec 10.2).
# The five product specifications, with typed characteristics and a bundle.
# One scenario per operation or filter; each creates what it needs.
# Lifecycle: create (In design) -> Active -> change -> Retired -> DELETE -> 404.

@crud @TMF620-F003
Feature: TMF620-F003 ProductSpecification CRUD and lifecycle

  Scenario Outline: '<apiVersion>': create the '<key>' specification
    Given the TMF620 '<apiVersion>' client
    And the telco catalogue entries that the 'productSpecification' '<key>' refers to exist
    When I create the 'productSpecification' '<key>' from the telco catalogue
    Then the response status is 201
    And the response matches the TMF620 '<apiVersion>' specification
    And the response href is under the '<apiVersion>' base path
    And the response holds the content that was sent
    And the response attribute 'lifecycleStatus' is 'In design'

    @v4
    Examples: TMF620 v4
      | apiVersion | key         |
      | v4         | 5g-mobile   |
      | v4         | full-fibre  |
      | v4         | smartphone  |
      | v4         | iptv        |
      | v4         | home-bundle |

    @v5
    Examples: TMF620 v5
      | apiVersion | key         |
      | v5         | 5g-mobile   |
      | v5         | full-fibre  |
      | v5         | smartphone  |
      | v5         | iptv        |
      | v5         | home-bundle |

  Scenario Outline: '<apiVersion>': retrieve the '<key>' specification
    Given the TMF620 '<apiVersion>' client
    And the 'productSpecification' '<key>' has been created from the telco catalogue
    When I retrieve the created 'productSpecification'
    Then the response status is 200
    And the response matches the TMF620 '<apiVersion>' specification
    And the response holds the content that was sent

    @v4
    Examples: TMF620 v4
      | apiVersion | key         |
      | v4         | 5g-mobile   |
      | v4         | full-fibre  |
      | v4         | smartphone  |
      | v4         | iptv        |
      | v4         | home-bundle |

    @v5
    Examples: TMF620 v5
      | apiVersion | key         |
      | v5         | 5g-mobile   |
      | v5         | full-fibre  |
      | v5         | smartphone  |
      | v5         | iptv        |
      | v5         | home-bundle |

  Scenario Outline: '<apiVersion>': list specifications by name
    Given the TMF620 '<apiVersion>' client
    And the 'productSpecification' '<key>' has been created from the telco catalogue
    When I list 'productSpecification' resources with the created name
    Then the list holds only the created 'productSpecification'
    And the response matches the TMF620 '<apiVersion>' specification

    @v4
    Examples: TMF620 v4
      | apiVersion | key       |
      | v4         | 5g-mobile |

    @v5
    Examples: TMF620 v5
      | apiVersion | key       |
      | v5         | 5g-mobile |

  Scenario Outline: '<apiVersion>': filter specifications by lifecycleStatus
    Given the TMF620 '<apiVersion>' client
    And the 'productSpecification' '<key>' has been created from the telco catalogue
    When I list 'productSpecification' resources with the created name and 'lifecycleStatus' 'In design'
    Then the list holds only the created 'productSpecification'
    When I list 'productSpecification' resources with the created name and 'lifecycleStatus' 'Active'
    Then the list is empty

    @v4
    Examples: TMF620 v4
      | apiVersion | key       |
      | v4         | 5g-mobile |

    @v5
    Examples: TMF620 v5
      | apiVersion | key       |
      | v5         | 5g-mobile |

  Scenario Outline: '<apiVersion>': filter specifications by lastUpdate
    Given the TMF620 '<apiVersion>' client
    And the 'productSpecification' '<key>' has been created from the telco catalogue
    When I list 'productSpecification' resources with the created name, updated since it was created
    Then the list holds only the created 'productSpecification'
    When I list 'productSpecification' resources with the created name, updated before it was created
    Then the list is empty

    @v4
    Examples: TMF620 v4
      | apiVersion | key       |
      | v4         | 5g-mobile |

    @v5
    Examples: TMF620 v5
      | apiVersion | key       |
      | v5         | 5g-mobile |

  Scenario Outline: '<apiVersion>': select the attributes of listed specifications with fields
    Given the TMF620 '<apiVersion>' client
    And the 'productSpecification' '<key>' has been created from the telco catalogue
    When I list 'productSpecification' resources with the created name and fields 'name,lifecycleStatus'
    Then the response status is 200
    And every listed item has only the attributes 'name,lifecycleStatus'

    @v4
    Examples: TMF620 v4
      | apiVersion | key       |
      | v4         | 5g-mobile |

    @v5
    Examples: TMF620 v5
      | apiVersion | key       |
      | v5         | 5g-mobile |

  Scenario Outline: '<apiVersion>': activate a specification
    Given the TMF620 '<apiVersion>' client
    And the 'productSpecification' '<key>' has been created from the telco catalogue
    When I patch the created 'productSpecification' with:
      """
      { "lifecycleStatus": "Active" }
      """
    Then the response status is 200
    And the response attribute 'lifecycleStatus' is 'Active'
    And the response matches the TMF620 '<apiVersion>' specification

    @v4
    Examples: TMF620 v4
      | apiVersion | key       |
      | v4         | 5g-mobile |

    @v5
    Examples: TMF620 v5
      | apiVersion | key       |
      | v5         | 5g-mobile |

  Scenario Outline: '<apiVersion>': change the active '<key>' specification
    Given the TMF620 '<apiVersion>' client
    And the 'productSpecification' '<key>' has been created from the telco catalogue
    And the created 'productSpecification' is 'Active'
    When I patch the created 'productSpecification' with:
      """
      <change>
      """
    Then the response status is 200
    And the response attribute '<attribute>' is '<value>'
    And the response attribute 'lifecycleStatus' is 'Active'
    And the response matches the TMF620 '<apiVersion>' specification
    When I retrieve the created 'productSpecification'
    Then the response attribute '<attribute>' is '<value>'

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

  Scenario Outline: '<apiVersion>': retire an active specification
    Given the TMF620 '<apiVersion>' client
    And the 'productSpecification' '<key>' has been created from the telco catalogue
    And the created 'productSpecification' is 'Active'
    When I patch the created 'productSpecification' with:
      """
      { "lifecycleStatus": "Retired" }
      """
    Then the response status is 200
    When I retrieve the created 'productSpecification'
    Then the response attribute 'lifecycleStatus' is 'Retired'
    And the response matches the TMF620 '<apiVersion>' specification

    @v4
    Examples: TMF620 v4
      | apiVersion | key       |
      | v4         | 5g-mobile |

    @v5
    Examples: TMF620 v5
      | apiVersion | key       |
      | v5         | 5g-mobile |

  Scenario Outline: '<apiVersion>': delete a specification
    Given the TMF620 '<apiVersion>' client
    And the 'productSpecification' '<key>' has been created from the telco catalogue
    When I delete the created 'productSpecification'
    Then the response status is 204
    When I retrieve the created 'productSpecification'
    Then the response status is 404

    @v4
    Examples: TMF620 v4
      | apiVersion | key       |
      | v4         | 5g-mobile |

    @v5
    Examples: TMF620 v5
      | apiVersion | key       |
      | v5         | 5g-mobile |
