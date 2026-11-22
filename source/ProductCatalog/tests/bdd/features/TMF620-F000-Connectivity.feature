# This feature checks that the test clients can reach both TMF620 API versions
# exposed by the Product Catalog component (issue #87), before the CRUD,
# cross-version and compatibility features run.

@smoke @TMF620-F000
Feature: TMF620-F000 Connectivity: both API versions answer

  Scenario Outline: The '<apiVersion>' API lists '<resource>' resources
    Given the TMF620 '<apiVersion>' API
    When I list '<resource>' resources
    Then the response status is 200
    And the response body is a JSON array

    Examples:
      | apiVersion | resource             |
      | v4         | catalog              |
      | v4         | category             |
      | v4         | productOffering      |
      | v4         | productOfferingPrice |
      | v4         | productSpecification |
      | v5         | catalog              |
      | v5         | category             |
      | v5         | productOffering      |
      | v5         | productOfferingPrice |
      | v5         | productSpecification |
