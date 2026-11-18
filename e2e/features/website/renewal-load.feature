@app:neuewege @mutating @bexio @mail @letter @load @mode:serial @timeout:12600000
Feature: The nightly run renews all yearly subscriptions at once
  Neue Wege bills per calendar year: most subscriptions end on 31 December
  and get their renewal invoice in the same nightly run, about 1200 by mail
  and 300 by letter (E2E_LOAD_READERS=1200/300). The run creates each invoice
  in the bexio test company and sends it with bexio's pdf, one after the
  other in one API process. Once such a run crashed the API: every mail cost
  memory. The process must neither restart nor come near its memory limit.
  The readers are synthetic and deleted afterwards.

  Scenario: The renewal invoices of all yearly subscriptions go out in one night
    Given We.Publish delivers the bexio invoices
    And the load readers with a "nw-jahresabo" subscription paying with "bexio", due for their renewal invoice
    When the nightly run starts
    Then the run finishes without the API restarting or nearing its memory limit
    And every load reader got the renewal invoice on their channel
    And the mailbox received a renewal mail for every mail reader, the samples with the bexio invoice attached
