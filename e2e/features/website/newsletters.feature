@newsletter @mutating @mailchimp @mode:serial
Feature: Newsletters in the profile
  Readers choose the newsletters they get in their profile. The newsletters
  are Mailchimp interests the tenant's Mailchimp sync provider offers; the
  choice is saved in the Mailchimp audience, not in we.publish.

  Scenario: A reader subscribes to a newsletter in their profile and unsubscribes again
    Given the newsletter "Morning briefing" offered through Mailchimp
    And a signed-in reader "Mia"
    When "Mia" opens their profile
    Then "Mia" is not subscribed to the newsletter "Morning briefing"
    When "Mia" subscribes to the newsletter "Morning briefing" in their profile
    Then "Mia" sees that their newsletter choice was saved
    When "Mia" opens their profile
    Then "Mia" is subscribed to the newsletter "Morning briefing"
    When "Mia" unsubscribes from the newsletter "Morning briefing" in their profile
    Then "Mia" sees that their newsletter choice was saved
    When "Mia" opens their profile
    Then "Mia" is not subscribed to the newsletter "Morning briefing"
