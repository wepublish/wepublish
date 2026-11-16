@app:neuewege @mutating @bexio @mail @letter @mode:serial
Feature: Renewal invoices from bexio, delivered by We.Publish
  Where the medium has We.Publish deliver the bexio invoices, a renewal
  creates the invoice in the bexio test company, and We.Publish sends bexio's
  pdf to the reader: attached to the renewal mail, or printed after the
  renewal letter for a reader who gets letters.

  Scenario: The bexio renewal invoice goes out by mail and by letter
    Given We.Publish delivers the bexio invoices
    And a reader "Mia" with a paid "nw-jahresabo" subscription paying with "bexio"
    And a letter reader "Leo" with a paid "nw-jahresabo" subscription paying with "bexio"
    When the subscriptions of "Mia" and "Leo" are renewed
    Then bexio has an open invoice for "Mia"
    And bexio has an open invoice for "Leo"
    And "Mia" receives the renewal mail with the bexio invoice attached
    And a letter to "Leo" was handed to Pingen
