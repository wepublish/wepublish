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
    Then readers of the page "Crowdfunding" no longer see the announcement "Crowdfunding launch"
