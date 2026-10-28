@membership @paywall @mutating @payment
Feature: Membership
  Readers buy a subscription to unlock paywalled articles.

  Scenario Outline: A reader buys a subscription to read an article behind an <kind> paywall
    Given an article "Paid story" behind an <kind> paywall for the plan "test-abo-chf"
    And a signed-in reader "Noah"
    When "Noah" opens the article "Paid story"
    Then the paywall hides the rest of the article
    When "Noah" subscribes to the plan "test-abo-chf" from the paywall
    And "Noah" pays on the simulated checkout
    And "Noah" opens the article "Paid story"
    Then "Noah" can read the article "Paid story" in full

    # An ordinary paywall hides the content in the browser; an enforced one
    # is cut on the server and only unlocked by viewArticle after paying.
    Examples:
      | kind     |
      | ordinary |
      | enforced |
