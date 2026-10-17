---
title: Email status in the communication tool
lead: The recipient filter now knows whether an address still works. Pick "Placeholder" and "Dead" to reach everyone by letter, "Unknown" to try them by mail, and see what a send achieved in the job's result.
actionRequired: false
---

Every person now carries an **email status**, derived automatically from what the mail provider reports and from the person's own activity:

- **Active** – logged in or clicked a link in a mail recently.
- **Unknown** – nothing decided yet.
- **Unresponsive** – mails were delivered, but no login and no click for a long time (how long is set under *Settings → Email quality*).
- **Dead** – the address bounced, is invalid, or the person complained or unsubscribed.
- **Placeholder** – a generated address from an import; such people can only be reached by letter.

**Communication tool:** the audience step shows how the chosen audience splits into these statuses and lets you pick one or several of them. A letter to *Placeholder + Dead* reaches everyone who certainly cannot be reached by mail; a mail to *Unknown* is the first pass whose bounces then land in the statuses by themselves.

**Result of a send:** a job now shows how many mails were delivered, clicked, bounced, and how many recipients count as dead by now. Bounces arrive over hours or days; *Refresh statuses* pulls what the provider has not reported yet and re-evaluates everyone. The same happens every night.

The status is also shown on the user page below the email address. Changing an address starts its status over.
