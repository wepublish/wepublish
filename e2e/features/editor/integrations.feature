@editor @integrations @mutating
Feature: Setting up integrations
  Admins connect the services We.Publish works with in the editor: they find
  the integration, add a provider, register the webhook address its setup
  guide shows at the provider, and save the provider's keys.

  Scenario: An admin connects a payment provider
    Given a signed-in admin "Mia" in the editor
    When "Mia" looks for "stripe" among the integrations
    Then the integrations offer "Payments"
    When "Mia" adds a "Stripe Checkout" payment provider "Shop checkout"
    Then the setup guide of "Shop checkout" shows its webhook address
    When "Mia" saves an API key and a webhook secret for "Shop checkout"
    Then "Shop checkout" is ready to take payments
