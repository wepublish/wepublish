@engagement @mutating
Feature: Content gates
  Metered engagement rules let anonymous readers read a few articles for free,
  then keep the rest of an article back until they register or sign in.

  Scenario: An anonymous reader reaches the registration wall and reads on after signing in
    Given a registration wall "Sign-up wall" after 2 free articles
    And the articles "Morning news", "Local politics" and "Weekend tips"
    And a reader "Lea"
    When "Lea" opens the article "Morning news"
    Then "Lea" can read the article "Morning news" in full
    When "Lea" opens the article "Local politics"
    Then "Lea" can read the article "Local politics" in full
    When "Lea" opens the article "Weekend tips"
    Then the registration wall "Sign-up wall" cuts the article off
    When "Lea" signs in with their password from the registration wall
    Then "Lea" can read the article "Weekend tips" in full
