@editor @engagement @mutating
Feature: Audience engagement
  Staff set up the prompts readers see — announcements, newsletter and
  membership prompts and content gates — in one place.

  Scenario: An editor announces a campaign on a page and takes it down again
    Given a page "Crowdfunding"
    And an editor signed in to the editor
    When the editor announces "Crowdfunding launch" on the page "Crowdfunding"
    Then readers of the page "Crowdfunding" see the announcement "Crowdfunding launch"
    When the editor switches off the rule "Crowdfunding launch"
    Then readers of the page "Crowdfunding" do not see the announcement "Crowdfunding launch"

  # The editor works out conflicts with its own copy of the API's order, and
  # the website shows one banner at a time: only together do they agree.
  Scenario: An editor decides which of two competing announcements readers see
    Given a page "Crowdfunding"
    And an announcement "Summer festival" on the page "Crowdfunding"
    And an editor signed in to the editor
    When the editor announces "Crowdfunding launch" on the page "Crowdfunding"
    Then the editor is told that "Crowdfunding launch" competes with "Summer festival"
    And readers of the page "Crowdfunding" see the announcement "Crowdfunding launch"
    When the editor shows the rule "Summer festival" first
    Then readers of the page "Crowdfunding" see the announcement "Summer festival"

  Scenario: An editor offers an upgrade only to members of one plan
    Given a page "Members area"
    And a reader "Mia" with a subscription to the plan "test-abo-chf"
    And an editor signed in to the editor
    When the editor announces "Go yearly" on the page "Members area" to members of the plan "test-abo-chf"
    Then "Mia" sees the announcement "Go yearly" on the page "Members area"
    And readers of the page "Members area" do not see the announcement "Go yearly"
