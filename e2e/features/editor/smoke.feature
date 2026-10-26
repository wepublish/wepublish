@editor
Feature: Editor smoke
  The editor is reachable and lets staff sign in.

  @smoke
  Scenario: The editor shows its sign-in form
    Given I open "/login"
    Then the editor asks for an email and a password
