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

  Scenario Outline: The '<apiVersion>' client creates, reads, patches and deletes a '<resource>'
    Given the TMF620 '<apiVersion>' client
    When I create a minimal '<resource>' named 'Client round trip'
    Then the response status is 201
    And the response matches the TMF620 '<apiVersion>' specification
    And the response href is under the '<apiVersion>' base path
    When I retrieve the created '<resource>'
    Then the response status is 200
    And the response matches the TMF620 '<apiVersion>' specification
    When I patch the created '<resource>' with:
      """
      { "description": "Patched by the <apiVersion> test client" }
      """
    Then the response status is 200
    And the response attribute 'description' is 'Patched by the <apiVersion> test client'
    And the response matches the TMF620 '<apiVersion>' specification
    When I delete the created '<resource>'
    Then the response status is 204
    When I retrieve the created '<resource>'
    Then the response status is 404

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
