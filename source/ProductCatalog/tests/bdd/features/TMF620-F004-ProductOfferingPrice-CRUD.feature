# ProductOfferingPrice create, read, list, update and delete through both TMF620 API
# versions (issue #87, spec 10.3), with the telco catalogue test data (spec 10.2).
# Recurring, one-off, instalment, usage and discount prices. The change is a price change (FF500 from 32.00 to 30.00 a month).
# One scenario per operation or filter; each creates what it needs.
# Lifecycle: create (In design) -> Active -> change -> Retired -> DELETE -> 404.

@crud @TMF620-F004
Feature: TMF620-F004 ProductOfferingPrice CRUD and lifecycle

  Scenario Outline: '<apiVersion>': create the '<key>' price
    Given the TMF620 '<apiVersion>' client
    And the telco catalogue entries that the 'productOfferingPrice' '<key>' refers to exist
    When I create the 'productOfferingPrice' '<key>' from the telco catalogue
    Then the response status is 201
    And the response matches the TMF620 '<apiVersion>' specification
    And the response href is under the '<apiVersion>' base path
    And the response holds the content that was sent
    And the response attribute 'lifecycleStatus' is 'In design'

    @v4
    Examples: TMF620 v4
      | apiVersion | key                |
      | v4         | ff500-monthly      |
      | v4         | ff1000-monthly     |
      | v4         | installation       |
      | v4         | handset-instalment |
      | v4         | roaming-day        |
      | v4         | ff1000-discount    |

    @v5
    Examples: TMF620 v5
      | apiVersion | key                |
      | v5         | ff500-monthly      |
      | v5         | ff1000-monthly     |
      | v5         | installation       |
      | v5         | handset-instalment |
      | v5         | roaming-day        |
      | v5         | ff1000-discount    |

  Scenario Outline: '<apiVersion>': retrieve the '<key>' price
    Given the TMF620 '<apiVersion>' client
    And the 'productOfferingPrice' '<key>' has been created from the telco catalogue
    When I retrieve the created 'productOfferingPrice'
    Then the response status is 200
    And the response matches the TMF620 '<apiVersion>' specification
    And the response holds the content that was sent

    @v4
    Examples: TMF620 v4
      | apiVersion | key                |
      | v4         | ff500-monthly      |
      | v4         | ff1000-monthly     |
      | v4         | installation       |
      | v4         | handset-instalment |
      | v4         | roaming-day        |
      | v4         | ff1000-discount    |

    @v5
    Examples: TMF620 v5
      | apiVersion | key                |
      | v5         | ff500-monthly      |
      | v5         | ff1000-monthly     |
      | v5         | installation       |
      | v5         | handset-instalment |
      | v5         | roaming-day        |
      | v5         | ff1000-discount    |

  Scenario Outline: '<apiVersion>': list prices by name
    Given the TMF620 '<apiVersion>' client
    And the 'productOfferingPrice' '<key>' has been created from the telco catalogue
    When I list 'productOfferingPrice' resources with the created name
    Then the list holds only the created 'productOfferingPrice'
    And the response matches the TMF620 '<apiVersion>' specification

    @v4
    Examples: TMF620 v4
      | apiVersion | key           |
      | v4         | ff500-monthly |

    @v5
    Examples: TMF620 v5
      | apiVersion | key           |
      | v5         | ff500-monthly |

  Scenario Outline: '<apiVersion>': filter prices by lifecycleStatus
    Given the TMF620 '<apiVersion>' client
    And the 'productOfferingPrice' '<key>' has been created from the telco catalogue
    When I list 'productOfferingPrice' resources with the created name and 'lifecycleStatus' 'In design'
    Then the list holds only the created 'productOfferingPrice'
    When I list 'productOfferingPrice' resources with the created name and 'lifecycleStatus' 'Active'
    Then the list is empty

    @v4
    Examples: TMF620 v4
      | apiVersion | key           |
      | v4         | ff500-monthly |

    @v5
    Examples: TMF620 v5
      | apiVersion | key           |
      | v5         | ff500-monthly |

  Scenario Outline: '<apiVersion>': filter prices by lastUpdate
    Given the TMF620 '<apiVersion>' client
    And the 'productOfferingPrice' '<key>' has been created from the telco catalogue
    When I list 'productOfferingPrice' resources with the created name, updated since it was created
    Then the list holds only the created 'productOfferingPrice'
    When I list 'productOfferingPrice' resources with the created name, updated before it was created
    Then the list is empty

    @v4
    Examples: TMF620 v4
      | apiVersion | key           |
      | v4         | ff500-monthly |

    @v5
    Examples: TMF620 v5
      | apiVersion | key           |
      | v5         | ff500-monthly |

  Scenario Outline: '<apiVersion>': select the attributes of listed prices with fields
    Given the TMF620 '<apiVersion>' client
    And the 'productOfferingPrice' '<key>' has been created from the telco catalogue
    When I list 'productOfferingPrice' resources with the created name and fields 'name,lifecycleStatus'
    Then the response status is 200
    And every listed item has only the attributes 'name,lifecycleStatus'

    @v4
    Examples: TMF620 v4
      | apiVersion | key           |
      | v4         | ff500-monthly |

    @v5
    Examples: TMF620 v5
      | apiVersion | key           |
      | v5         | ff500-monthly |

  Scenario Outline: '<apiVersion>': activate a price
    Given the TMF620 '<apiVersion>' client
    And the 'productOfferingPrice' '<key>' has been created from the telco catalogue
    When I patch the created 'productOfferingPrice' with:
      """
      { "lifecycleStatus": "Active" }
      """
    Then the response status is 200
    And the response attribute 'lifecycleStatus' is 'Active'
    And the response matches the TMF620 '<apiVersion>' specification

    @v4
    Examples: TMF620 v4
      | apiVersion | key           |
      | v4         | ff500-monthly |

    @v5
    Examples: TMF620 v5
      | apiVersion | key           |
      | v5         | ff500-monthly |

  Scenario Outline: '<apiVersion>': change the active '<key>' price
    Given the TMF620 '<apiVersion>' client
    And the 'productOfferingPrice' '<key>' has been created from the telco catalogue
    And the created 'productOfferingPrice' is 'Active'
    When I patch the created 'productOfferingPrice' with:
      """
      <change>
      """
    Then the response status is 200
    And the response attribute '<attribute>' is '<value>'
    And the response attribute 'lifecycleStatus' is 'Active'
    And the response matches the TMF620 '<apiVersion>' specification
    When I retrieve the created 'productOfferingPrice'
    Then the response attribute '<attribute>' is '<value>'

    @v4
    Examples: TMF620 v4
      | apiVersion | key                | change                                         | attribute   | value |
      | v4         | ff500-monthly      | { "price": { "unit": "GBP", "value": 30.00 } } | price.value | 30    |
      | v4         | ff1000-monthly     | { "price": { "unit": "GBP", "value": 42.50 } } | price.value | 42.5  |
      | v4         | installation       | { "price": { "unit": "GBP", "value": 0 } }     | price.value | 0     |
      | v4         | handset-instalment | { "price": { "unit": "GBP", "value": 33.00 } } | price.value | 33    |
      | v4         | roaming-day        | { "price": { "unit": "GBP", "value": 2.50 } }  | price.value | 2.5   |
      | v4         | ff1000-discount    | { "percentage": 40 }                           | percentage  | 40    |

    @v5
    Examples: TMF620 v5
      | apiVersion | key                | change                                         | attribute   | value |
      | v5         | ff500-monthly      | { "price": { "unit": "GBP", "value": 30.00 } } | price.value | 30    |
      | v5         | ff1000-monthly     | { "price": { "unit": "GBP", "value": 42.50 } } | price.value | 42.5  |
      | v5         | installation       | { "price": { "unit": "GBP", "value": 0 } }     | price.value | 0     |
      | v5         | handset-instalment | { "price": { "unit": "GBP", "value": 33.00 } } | price.value | 33    |
      | v5         | roaming-day        | { "price": { "unit": "GBP", "value": 2.50 } }  | price.value | 2.5   |
      | v5         | ff1000-discount    | { "percentage": 40 }                           | percentage  | 40    |

  Scenario Outline: '<apiVersion>': retire an active price
    Given the TMF620 '<apiVersion>' client
    And the 'productOfferingPrice' '<key>' has been created from the telco catalogue
    And the created 'productOfferingPrice' is 'Active'
    When I patch the created 'productOfferingPrice' with:
      """
      { "lifecycleStatus": "Retired" }
      """
    Then the response status is 200
    When I retrieve the created 'productOfferingPrice'
    Then the response attribute 'lifecycleStatus' is 'Retired'
    And the response matches the TMF620 '<apiVersion>' specification

    @v4
    Examples: TMF620 v4
      | apiVersion | key           |
      | v4         | ff500-monthly |

    @v5
    Examples: TMF620 v5
      | apiVersion | key           |
      | v5         | ff500-monthly |

  Scenario Outline: '<apiVersion>': delete a price
    Given the TMF620 '<apiVersion>' client
    And the 'productOfferingPrice' '<key>' has been created from the telco catalogue
    When I delete the created 'productOfferingPrice'
    Then the response status is 204
    When I retrieve the created 'productOfferingPrice'
    Then the response status is 404

    @v4
    Examples: TMF620 v4
      | apiVersion | key           |
      | v4         | ff500-monthly |

    @v5
    Examples: TMF620 v5
      | apiVersion | key           |
      | v5         | ff500-monthly |
