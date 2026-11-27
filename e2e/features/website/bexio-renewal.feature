@app:neuewege @mutating @bexio @mail @letter @mode:serial @timeout:180000
Feature: Renewal invoices from bexio, delivered by We.Publish
  Where the medium has We.Publish deliver the bexio invoices, a renewal
  creates the invoice in the bexio test company, and We.Publish sends bexio's
  pdf to the reader: attached to the renewal mail, or printed after the
  renewal letter for a reader who gets letters. Where bexio delivers its own
  invoices, as for most media, bexio emails the renewal invoice itself.

  Scenario: The bexio renewal invoice goes out by mail and by letter
    Given We.Publish delivers the bexio invoices
    And a reader "Mia" with a paid "nw-jahresabo" subscription paying with "bexio"
    And a letter reader "Leo" with a paid "nw-jahresabo" subscription paying with "bexio"
    When the subscriptions of "Mia" and "Leo" are renewed
    Then bexio has an open invoice for "Mia"
    And bexio has an open invoice for "Leo"
    And "Mia" receives the renewal mail with the bexio invoice attached
    And a letter to "Leo" was handed to Pingen

  @inbound-mail
  Scenario: bexio emails the renewal invoice itself
    Given bexio delivers its invoices itself
    And a reader "Nia" with an inbound mailbox and a paid "nw-jahresabo" subscription paying with "bexio"
    When the subscription of "Nia" is renewed
    Then bexio has an open invoice for "Nia"
    And "Nia" receives the invoice from bexio by email
