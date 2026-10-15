---
title: The Mailchimp contact now follows a member's new email address
lead: When a member's email address changes to one Mailchimp already knows, their Mailchimp contact now moves to the new address. Before, the member dropped out of the Mailchimp sync.
actionRequired: false
---

**Changing a member's email address**

This applies whether you change the address in the editor or the member changes it themselves.

- **The member's contact moves along.** It keeps its history, tags and newsletter groups and continues under the new email address. The nightly Mailchimp sync updates it as before.
- **The other contact is archived.** The contact Mailchimp already had for the new address is archived under `moved-…@wepublish.ch`. You can restore it in Mailchimp if you need it.
- **Only when both contacts are subscribed.** If the contact for the new address is unsubscribed, cleaned or pending, nothing is moved and the member shows up under "Sync Errors", so you can decide which contact to keep.
- **Members whose email change failed before this update** are still listed under "Sync Errors". Fix their contacts once in Mailchimp, then delete the entry.

**Clearer sync errors**

- Under Integrations → Mailchimp Sync → "Sync Errors", an error now gives Mailchimp's actual reason where it only said "see the 'errors' array" before — for example which field was rejected, or that Mailchimp only changes the email address of subscribed contacts.
- Every sync skips a member listed there until you have fixed the cause and deleted the entry.
