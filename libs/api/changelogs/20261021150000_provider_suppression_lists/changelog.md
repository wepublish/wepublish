---
title: The mail service's block lists count towards the email status
lead: Addresses your mail service refuses to deliver to, for any mail sent through the account, now show as "dead" in We.Publish, and Mailgun delivery states are polled like Mandrill's.
actionRequired: false
---

- Every night, and when you press "Refresh statuses", We.Publish reads the block lists of the mail service: Mandrill's rejection denylist, Mailgun's bounces, complaints and unsubscribes. An address on them counts as "dead", even when the mail that bounced was not sent by We.Publish.
- An unsubscribe from a single Mailgun tag counts as an opt-out, not as a dead address.
- For Mailgun, late delivery states are now fetched from the events API when the webhook did not arrive, as was already the case for Mandrill.
