---
title: Missing mailboxes are recognised more reliably, and bounces show their reason
lead: An address whose mailbox does not exist is now rated unreachable even when the mail provider reports the bounce as temporary. The list of sent messages can show what the provider said about a bounce.
actionRequired: false
---

**Email status.** Some mail servers refuse a message for a mailbox that does not exist in a way the mail provider (Mailchimp Transactional) files as a temporary bounce. Such a bounce now counts when its description says the mailbox or the domain does not exist: the address is rated unreachable, and the person is suggested for delivery by letter like after any other permanent bounce. A full mailbox or another passing problem still changes nothing.

**In the list of sent messages.** A new column **Bounce reason** shows the provider's description of a bounce together with the answer of the receiving mail server, for bounced and held-back messages. The column is hidden until you switch it on in the column menu, and it is part of the export.

**Good to know.** The reason is also shown for messages that bounced before this update. The email status only follows bounces from this update on: an address that bounced this way earlier keeps its status until the next message to it bounces.
