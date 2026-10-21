---
title: Brevo as a mail service
lead: Brevo (formerly Sendinblue) can now send We.Publish's transactional mails, with delivery reports, a nightly poll and its block list feeding the email status like Mandrill and Mailgun.
actionRequired: false
---

- Choose BREVO as the type of the mail integration and enter your Brevo API key. Templates stored in Brevo can be imported like Mandrill's.
- For delivery reports, create a transactional webhook in Brevo pointing at your API's `/mail-webhooks/<integration id>?key=<secret>` with the secret you enter as webhook endpoint secret. Without it, the nightly poll still catches up.
