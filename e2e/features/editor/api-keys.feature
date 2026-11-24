@mutating @api-keys
Feature: API keys act for the person who created them
  An API key may only do what its creator may do right now, checked on every
  call. What a key does is recorded with the key and its creator: in the audit
  log and on the record it changed. When the creator loses a permission, the
  key loses it too; when the creator is deactivated or deleted, the key stops.

  Scenario: A key's action names the key and its creator
    Given an editor "Kim" who may create API keys and mark invoices as paid
    And "Kim" created an API key "Kassensystem" that may mark invoices as paid
    And a reader "Ria" with an open invoice for the tenant's subscribe plan
    When the API key "Kassensystem" marks the open invoice of "Ria" as paid
    Then the invoice of "Ria" was marked as paid by "Kim" with the API key "Kassensystem"
    And the audit log names the API key "Kassensystem" and "Kim" for "markInvoiceAsPaid"

  Scenario: A key loses what its creator loses
    Given an editor "Kim" who may create API keys and mark invoices as paid
    And "Kim" created an API key "Kassensystem" that may mark invoices as paid
    And a reader "Ria" with an open invoice for the tenant's subscribe plan
    When "Kim" may no longer mark invoices as paid
    Then the API key "Kassensystem" is limited, missing "CAN_CREATE_INVOICE"
    And the API key "Kassensystem" is refused when marking the open invoice of "Ria" as paid
    But the API key "Kassensystem" may still read the open invoice of "Ria"
    When "Kim" is deactivated
    Then every call with the API key "Kassensystem" is refused because "Kim" is inactive
    When "Kim" is deleted
    Then every call with the API key "Kassensystem" is refused because "Kim" no longer exists
