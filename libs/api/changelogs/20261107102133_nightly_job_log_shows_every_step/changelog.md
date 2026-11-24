---
title: The job log shows what every night did
lead: The automatic job logs now list each step of the night, with what it did and any error, and the dashboard tells you when a step had problems, such as Bexio refusing some contacts.
actionRequired: false
---

**What changes**

- **Every step of the night in the log.** Under Notifications → "Periodic Job Logs", each night now lists its steps: subscription mails, invoices, charging and deactivations, and the syncs that run afterwards (contacts to Bexio, Mailchimp, mail delivery states, suppressed addresses, email quality, delivery channel suggestions). Each step shows whether it went through, partly failed, failed or is not in use, with its numbers, for example "1,821 readers · 1,814 sent · 7 failed".
- **Problems reach the dashboard.** Until now the notifications only showed the nightly job when it failed as a whole. Now a step that partly or fully failed in the latest night also appears there, naming the step and its error. It disappears once a later night runs without problems.
- **Bexio says why.** When Bexio refuses a contact, the error now includes Bexio's reasons, for example which field is invalid, instead of stopping at "The form could not be saved due to the following errors:".
- **Contact sync status in plain view.** In Integrations → Payment providers → Bexio, how the last contact sync went now shows below the switch, in green, orange or red, instead of hiding in the tooltip.
