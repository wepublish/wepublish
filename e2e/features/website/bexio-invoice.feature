@app:neuewege @mutating @bexio
Feature: Invoices from bexio
  Readers who pay by invoice get it from bexio: the bexio payment provider
  creates the invoice in the bexio test company, and bexio emails it to them.

  Scenario: A reader paying by invoice gets an open invoice in bexio
    Given a reader "Lea" with an open "nw-jahresabo" invoice
    When "Lea" pays the open invoice with "bexio"
    Then bexio has an open invoice for "Lea"

  @inbound-mail
  Scenario: bexio emails the invoice to the reader
    Given a reader "Jon" with an inbound mailbox and an open "nw-jahresabo" invoice
    When "Jon" pays the open invoice with "bexio"
    Then bexio has an open invoice for "Jon"
    And "Jon" receives the invoice from bexio by email
