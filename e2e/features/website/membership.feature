@membership @paywall @mutating @payment
Feature: Membership
  Readers buy a subscription to unlock paywalled articles.

  Scenario: A reader buys a subscription to read a paywalled article
    Given a paywalled article "Paid story" for the plan "test-abo-chf"
    And a signed-in reader "Noah"
    When "Noah" opens the article "Paid story"
    Then the paywall hides the rest of the article
    When "Noah" subscribes to the plan "test-abo-chf" from the paywall
    And "Noah" pays on the simulated checkout
    And "Noah" opens the article "Paid story"
    Then "Noah" can read the article "Paid story" in full
