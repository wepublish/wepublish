@membership @mutating @payment @feature:referrals
Feature: Referral discount codes
  Readers share the referral link from their profile. Whoever subscribes
  through it and pays counts as their referral, and enough referrals unlock a
  discount code reserved for referrers.

  Background:
    Given a subscribe page that accepts discount codes
    And a discount code "FRIENDS" of 20% for the tenant's subscribe plan that requires 2 referrals

  Scenario: A reader who brought two paying readers gets the referral discount
    Given a signed-in reader "Noah"
    And a signed-in reader "Lea"
    And a signed-in reader "Tim"
    When "Noah" copies their referral link from their profile
    And "Lea" opens the referral link of "Noah"
    Then "Lea" sees the referral code of "Noah" filled in
    When "Lea" subscribes to the tenant's subscribe plan
    And "Lea" pays on the simulated checkout
    And "Tim" opens the referral link of "Noah"
    And "Tim" subscribes to the tenant's subscribe plan
    And "Tim" pays on the simulated checkout
    And "Noah" enters the discount code "FRIENDS" for the tenant's subscribe plan
    Then "Noah" sees a discount of 20% applied

  Scenario: A referral who never paid does not count towards the referral discount
    Given a signed-in reader "Mia"
    And a signed-in reader "Lea"
    And a signed-in reader "Tim"
    When "Mia" copies their referral link from their profile
    And "Lea" opens the referral link of "Mia"
    And "Lea" subscribes to the tenant's subscribe plan
    And "Lea" pays on the simulated checkout
    And "Tim" opens the referral link of "Mia"
    And "Tim" subscribes to the tenant's subscribe plan
    And "Tim" declines the payment on the simulated checkout
    And "Mia" enters the discount code "FRIENDS" for the tenant's subscribe plan
    Then "Mia" is told the discount code is invalid
