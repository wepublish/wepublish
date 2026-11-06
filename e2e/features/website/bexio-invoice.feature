@app:neuewege @mutating @bexio @inbound-mail
Feature: Invoices from bexio
  Readers who pay by invoice get it from bexio: the bexio payment provider
  creates the invoice in the bexio test company, and bexio emails it to them.

  Scenario: A reader paying by invoice gets it from bexio
    Given a reader "Lea" with an inbound mailbox and an open "nw-jahresabo" invoice
    When "Lea" pays the open invoice with "bexio"
    Then bexio has an open invoice for "Lea"
    And "Lea" receives the invoice from bexio by email
