# ProductOffering create, read, list, update and delete through both TMF620 API
# versions (issue #87, spec 10.3), with the telco catalogue test data (spec 10.2).
# The seven offerings, each with its specification, prices and categories created first.
# One scenario per operation or filter; each creates what it needs.
# Lifecycle: create (In design) -> Active -> change -> Retired -> DELETE -> 404.

@crud @TMF620-F005
Feature: TMF620-F005 ProductOffering CRUD and lifecycle

  Scenario Outline: '<apiVersion>': create the '<key>' offering
    Given the TMF620 '<apiVersion>' client
    And the telco catalogue entries that the 'productOffering' '<key>' refers to exist
    When I create the 'productOffering' '<key>' from the telco catalogue
    Then the response status is 201
    And the response matches the TMF620 '<apiVersion>' specification
    And the response href is under the '<apiVersion>' base path
    And the response holds the content that was sent
    And the response attribute 'lifecycleStatus' is 'In design'

    @v4
    Examples: TMF620 v4
      | apiVersion | key             |
      | v4         | 5g-unlimited-24 |
      | v4         | 5g-100gb-12     |
      | v4         | nova-x5-36      |
      | v4         | ff500           |
      | v4         | ff1000          |
      | v4         | tv-essentials   |
      | v4         | home-bundle     |

    @v5
    Examples: TMF620 v5
      | apiVersion | key             |
      | v5         | 5g-unlimited-24 |
      | v5         | 5g-100gb-12     |
      | v5         | nova-x5-36      |
      | v5         | ff500           |
      | v5         | ff1000          |
      | v5         | tv-essentials   |
      | v5         | home-bundle     |

  Scenario Outline: '<apiVersion>': retrieve the '<key>' offering
    Given the TMF620 '<apiVersion>' client
    And the 'productOffering' '<key>' has been created from the telco catalogue
    When I retrieve the created 'productOffering'
    Then the response status is 200
    And the response matches the TMF620 '<apiVersion>' specification
    And the response holds the content that was sent

    @v4
    Examples: TMF620 v4
      | apiVersion | key             |
      | v4         | 5g-unlimited-24 |
      | v4         | 5g-100gb-12     |
      | v4         | nova-x5-36      |
      | v4         | ff500           |
      | v4         | ff1000          |
      | v4         | tv-essentials   |
      | v4         | home-bundle     |

    @v5
    Examples: TMF620 v5
      | apiVersion | key             |
      | v5         | 5g-unlimited-24 |
      | v5         | 5g-100gb-12     |
      | v5         | nova-x5-36      |
      | v5         | ff500           |
      | v5         | ff1000          |
      | v5         | tv-essentials   |
      | v5         | home-bundle     |

  Scenario Outline: '<apiVersion>': list offerings by name
    Given the TMF620 '<apiVersion>' client
    And the 'productOffering' '<key>' has been created from the telco catalogue
    When I list 'productOffering' resources with the created name
    Then the list holds only the created 'productOffering'
    And the response matches the TMF620 '<apiVersion>' specification

    @v4
    Examples: TMF620 v4
      | apiVersion | key             |
      | v4         | 5g-unlimited-24 |

    @v5
    Examples: TMF620 v5
      | apiVersion | key             |
      | v5         | 5g-unlimited-24 |

  Scenario Outline: '<apiVersion>': filter offerings by lifecycleStatus
    Given the TMF620 '<apiVersion>' client
    And the 'productOffering' '<key>' has been created from the telco catalogue
    When I list 'productOffering' resources with the created name and 'lifecycleStatus' 'In design'
    Then the list holds only the created 'productOffering'
    When I list 'productOffering' resources with the created name and 'lifecycleStatus' 'Active'
    Then the list is empty

    @v4
    Examples: TMF620 v4
      | apiVersion | key             |
      | v4         | 5g-unlimited-24 |

    @v5
    Examples: TMF620 v5
      | apiVersion | key             |
      | v5         | 5g-unlimited-24 |

  Scenario Outline: '<apiVersion>': filter offerings by lastUpdate
    Given the TMF620 '<apiVersion>' client
    And the 'productOffering' '<key>' has been created from the telco catalogue
    When I list 'productOffering' resources with the created name, updated since it was created
    Then the list holds only the created 'productOffering'
    When I list 'productOffering' resources with the created name, updated before it was created
    Then the list is empty

    @v4
    Examples: TMF620 v4
      | apiVersion | key             |
      | v4         | 5g-unlimited-24 |

    @v5
    Examples: TMF620 v5
      | apiVersion | key             |
      | v5         | 5g-unlimited-24 |

  Scenario Outline: '<apiVersion>': select the attributes of listed offerings with fields
    Given the TMF620 '<apiVersion>' client
    And the 'productOffering' '<key>' has been created from the telco catalogue
    When I list 'productOffering' resources with the created name and fields 'name,lifecycleStatus'
    Then the response status is 200
    And every listed item has only the attributes 'name,lifecycleStatus'

    @v4
    Examples: TMF620 v4
      | apiVersion | key             |
      | v4         | 5g-unlimited-24 |

    @v5
    Examples: TMF620 v5
      | apiVersion | key             |
      | v5         | 5g-unlimited-24 |

  Scenario Outline: '<apiVersion>': activate a offering
    Given the TMF620 '<apiVersion>' client
    And the 'productOffering' '<key>' has been created from the telco catalogue
    When I patch the created 'productOffering' with:
      """
      { "lifecycleStatus": "Active" }
      """
    Then the response status is 200
    And the response attribute 'lifecycleStatus' is 'Active'
    And the response matches the TMF620 '<apiVersion>' specification

    @v4
    Examples: TMF620 v4
      | apiVersion | key             |
      | v4         | 5g-unlimited-24 |

    @v5
    Examples: TMF620 v5
      | apiVersion | key             |
      | v5         | 5g-unlimited-24 |

  Scenario Outline: '<apiVersion>': change the active '<key>' offering
    Given the TMF620 '<apiVersion>' client
    And the 'productOffering' '<key>' has been created from the telco catalogue
    And the created 'productOffering' is 'Active'
    When I patch the created 'productOffering' with:
      """
      <change>
      """
    Then the response status is 200
    And the response attribute '<attribute>' is '<value>'
    And the response attribute 'lifecycleStatus' is 'Active'
    And the response matches the TMF620 '<apiVersion>' specification
    When I retrieve the created 'productOffering'
    Then the response attribute '<attribute>' is '<value>'

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

  Scenario Outline: '<apiVersion>': retire an active offering
    Given the TMF620 '<apiVersion>' client
    And the 'productOffering' '<key>' has been created from the telco catalogue
    And the created 'productOffering' is 'Active'
    When I patch the created 'productOffering' with:
      """
      { "lifecycleStatus": "Retired" }
      """
    Then the response status is 200
    When I retrieve the created 'productOffering'
    Then the response attribute 'lifecycleStatus' is 'Retired'
    And the response matches the TMF620 '<apiVersion>' specification

    @v4
    Examples: TMF620 v4
      | apiVersion | key             |
      | v4         | 5g-unlimited-24 |

    @v5
    Examples: TMF620 v5
      | apiVersion | key             |
      | v5         | 5g-unlimited-24 |

  Scenario Outline: '<apiVersion>': delete a offering
    Given the TMF620 '<apiVersion>' client
    And the 'productOffering' '<key>' has been created from the telco catalogue
    When I delete the created 'productOffering'
    Then the response status is 204
    When I retrieve the created 'productOffering'
    Then the response status is 404

    @v4
    Examples: TMF620 v4
      | apiVersion | key             |
      | v4         | 5g-unlimited-24 |

    @v5
    Examples: TMF620 v5
      | apiVersion | key             |
      | v5         | 5g-unlimited-24 |
