@membership @mutating
Feature: Referral discount codes
  A discount code can be reserved for readers who referred others to a paid
  subscription.

  Background:
    Given a subscribe page that accepts discount codes
    And a discount code "FRIENDS" of 20% for the plan "test-abo-chf" that requires 2 referrals

  Scenario: A reader who referred enough readers gets the referral discount
    Given a signed-in reader "Noah"
    And "Noah" referred 2 readers to a paid subscription
    When "Noah" enters the discount code "FRIENDS" for the plan "test-abo-chf"
    Then "Noah" sees a discount of 20% applied

  Scenario: A reader who referred too few readers can not redeem the referral discount
    Given a signed-in reader "Mia"
    And "Mia" referred 1 reader to a paid subscription
    When "Mia" enters the discount code "FRIENDS" for the plan "test-abo-chf"
    Then "Mia" is told the discount code is invalid
