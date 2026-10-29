@auth @mutating @mail
Feature: Signing in
  Readers sign in without a password, through a link sent to their inbox.

  Scenario: A reader signs in with a magic link
    Given a reader "Mia"
    When "Mia" requests a login link on the login page
    And "Mia" follows the login link from the email
    Then "Mia" is signed in and sees their profile
