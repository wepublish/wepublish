---
title: Rerun failed jobs, clearer error messages
lead: When the nightly jobs for subscriptions fail, an admin can now start them again from the dashboard, and they catch up every missed night up to today. Error messages now say which provider failed and where.
---

**Rerun failed jobs**

- **"Run again" on a failed job.** Admins see the button on the failed job in the "Notifications" box on the dashboard and on the "Notifications" page under "Periodic Job Logs". The failed night runs again, then every night missed since, up to and including today. It goes on in the background, so you can leave the page.
- **You see when a job is running.** A running job shows "Running" and refreshes by itself until it has finished, also when the nightly schedule started it.
- **Never two runs at once.** While a job is running, no second one can be started, whether automatically or by hand. This keeps renewals from being charged twice.
- **A job cut off by a server restart** shows up as failed after about two minutes and can be started again right away.

**Clearer error messages**

- **When a job fails, the message says what went wrong and where:** which payment or mail provider failed, in which step, and for which subscription or invoice. Before, it often showed only a bare code like `401 Unauthorized`. You see it in the job log, and the We.Publish team sees it too.
- **A failed charge keeps its reason** on the payment, readable instead of empty.

**"Renewal failed" mail**

- If charging fails because of a technical problem at the payment provider, the `errorCode` in the "renewal failed" mail is now `payment-provider-error`. Before, it could contain technical details from the provider. Check your template if it shows `errorCode`.

**More reliable delivery status**

- Delivery reports from Mailgun and Mailchimp (Mandrill) are now only accepted with a valid signature. If the "Webhook Endpoint Secret" in your mail integration does not match the webhook signing key in Mailgun or Mandrill, delivery statuses no longer update.
