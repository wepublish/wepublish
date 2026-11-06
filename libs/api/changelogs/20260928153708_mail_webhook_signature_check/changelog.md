---
title: Delivery status from Mandrill and Mailgun is now properly checked
lead: Status updates from your mail provider (delivered, bounced, rejected) are only accepted when they carry the correct webhook signature. Please check once that the webhook secret in the editor matches the one at your provider.
actionRequired: true
---

Until now, status updates sent by Mandrill or Mailgun were accepted even when their signature did not match. From now on, updates with a wrong signature are refused.

**What to do:** open **Integrations → Mail Provider** and compare the **Webhook Endpoint Secret** with the webhook key shown at your provider (Mandrill: *Settings → Webhooks*, Mailgun: *Sending → Webhooks → HTTP webhook signing key*). If they differ, copy the key from your provider into the editor.

If they don't match, mail statuses stay at «submitted». You can still fetch them manually with «Refresh states» in the mail log.

A bounced or rejected mail also can no longer be switched back to «delivered» by a late status update.
