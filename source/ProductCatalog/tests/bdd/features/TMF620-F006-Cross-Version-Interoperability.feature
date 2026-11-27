# Cross-version interoperability (issue #87, spec 10.3): both API versions serve
# one store, so a resource created through one version is read, changed and
# deleted through the other. "Business content" is what that version's own
# payload builder renders for the telco catalogue entry, with the same ids:
# the builders are independent of the translator in the v4 service.

@cross @TMF620-F006
Feature: TMF620-F006 Cross-version interoperability

  Scenario Outline: '<kind>' '<key>' created through <from> reads the same through <to>
    Given the '<from>' client has created the '<kind>' '<key>' from the telco catalogue
    When the '<to>' client retrieves the '<key>'
    Then the response status is 200
    And the response matches the TMF620 '<to>' specification
    And the response href is under the '<to>' base path
    And the response holds the '<to>' content of the telco '<kind>' '<key>'
    And the response has no compatibility warnings

    Examples: from v4 to v5
      | from | to | kind                 | key             |
      | v4   | v5 | catalog              | consumer        |
      | v4   | v5 | category             | sim-only        |
      | v4   | v5 | productSpecification | 5g-mobile       |
      | v4   | v5 | productOfferingPrice | ff1000-monthly  |
      | v4   | v5 | productOfferingPrice | handset-instalment |
      | v4   | v5 | productOffering      | home-bundle     |
      | v4   | v5 | productOffering      | nova-x5-36      |

    Examples: from v5 to v4
      | from | to | kind                 | key             |
      | v5   | v4 | catalog              | consumer        |
      | v5   | v4 | category             | sim-only        |
      | v5   | v4 | productSpecification | 5g-mobile       |
      | v5   | v4 | productOfferingPrice | ff1000-monthly  |
      | v5   | v4 | productOfferingPrice | handset-instalment |
      | v5   | v4 | productOffering      | home-bundle     |
      | v5   | v4 | productOffering      | nova-x5-36      |

  Scenario Outline: '<kind>' '<key>' created through <from> and changed through <to> shows the change in <from>
    Given the '<from>' client has created the '<kind>' '<key>' from the telco catalogue
    When the '<to>' client patches the '<key>' with:
      """
      { "description": "Changed through <to>" }
      """
    Then the response status is 200
    And the response matches the TMF620 '<to>' specification
    When the '<from>' client retrieves the '<key>'
    Then the response status is 200
    And the response matches the TMF620 '<from>' specification
    And the response attribute 'description' is 'Changed through <to>'
    And the response holds the '<from>' content of the telco '<kind>' '<key>' apart from the description

    Examples: from v4 to v5
      | from | to | kind                 | key             |
      | v4   | v5 | catalog              | consumer        |
      | v4   | v5 | category             | sim-only        |
      | v4   | v5 | productSpecification | 5g-mobile       |
      | v4   | v5 | productOfferingPrice | ff1000-monthly  |
      | v4   | v5 | productOfferingPrice | handset-instalment |
      | v4   | v5 | productOffering      | home-bundle     |
      | v4   | v5 | productOffering      | nova-x5-36      |

    Examples: from v5 to v4
      | from | to | kind                 | key             |
      | v5   | v4 | catalog              | consumer        |
      | v5   | v4 | category             | sim-only        |
      | v5   | v4 | productSpecification | 5g-mobile       |
      | v5   | v4 | productOfferingPrice | ff1000-monthly  |
      | v5   | v4 | productOfferingPrice | handset-instalment |
      | v5   | v4 | productOffering      | home-bundle     |
      | v5   | v4 | productOffering      | nova-x5-36      |

  # One entry per resource type
  Scenario Outline: '<kind>' '<key>' created through <from> is listed with the same id in v4 and v5
    Given the '<from>' client has created the '<kind>' '<key>' from the telco catalogue
    Then listing '<kind>' resources by the name of the '<key>' gives the same ids in v4 and v5

    Examples: from v4 to v5
      | from | to | kind                 | key             |
      | v4   | v5 | catalog              | consumer        |
      | v4   | v5 | category             | sim-only        |
      | v4   | v5 | productSpecification | 5g-mobile       |
      | v4   | v5 | productOfferingPrice | ff1000-monthly  |
      | v4   | v5 | productOffering      | home-bundle     |

    Examples: from v5 to v4
      | from | to | kind                 | key             |
      | v5   | v4 | catalog              | consumer        |
      | v5   | v4 | category             | sim-only        |
      | v5   | v4 | productSpecification | 5g-mobile       |
      | v5   | v4 | productOfferingPrice | ff1000-monthly  |
      | v5   | v4 | productOffering      | home-bundle     |

  Scenario Outline: '<kind>' '<key>' deleted through <from> is gone in <to>
    Given the '<from>' client has created the '<kind>' '<key>' from the telco catalogue
    When the '<from>' client deletes the '<key>'
    Then the response status is 204
    And the '<key>' is gone in '<to>'

    Examples: from v4 to v5
      | from | to | kind                 | key             |
      | v4   | v5 | catalog              | consumer        |
      | v4   | v5 | category             | sim-only        |
      | v4   | v5 | productSpecification | 5g-mobile       |
      | v4   | v5 | productOfferingPrice | ff1000-monthly  |
      | v4   | v5 | productOffering      | home-bundle     |

    Examples: from v5 to v4
      | from | to | kind                 | key             |
      | v5   | v4 | catalog              | consumer        |
      | v5   | v4 | category             | sim-only        |
      | v5   | v4 | productSpecification | 5g-mobile       |
      | v5   | v4 | productOfferingPrice | ff1000-monthly  |
      | v5   | v4 | productOffering      | home-bundle     |

  Scenario Outline: a list through <to> shows what <from> created, in that version's shape
    Given the telco catalogue entries that the 'productOffering' 'home-bundle' refers to exist in '<from>'
    When the '<to>' client lists 'productOffering' resources with:
      | productSpecification.id | {{id:full-fibre}} |
    Then the list holds only 'ff1000'
    And the response matches the TMF620 '<to>' specification
    When the '<to>' client lists 'category' resources with:
      | name | {{name:bundles}} |
    Then the list holds only 'bundles'
    And the response matches the TMF620 '<to>' specification

    Examples:
      | from | to |
      | v4   | v5 |
      | v5   | v4 |
