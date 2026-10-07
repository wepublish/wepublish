---
title: Manage integrations in the editor
lead: Payment, mail, captcha and tracking pixel providers are now set up entirely under Settings → Integrations, and a change takes effect the moment you save it — no deployment, no waiting.
actionRequired: false
---

Until now, which providers existed was fixed in a configuration file that only your hosting partner could change. That list has moved into the editor.

**What you can do now**

- **Add and remove payment providers and tracking pixels** yourself, under *Settings → Integrations*.
- **Switch the type** of your mail provider or your captcha provider — for example from Mailchimp to SMTP, or from Turnstile to hCaptcha.
- **Set how long a login stays valid** under *Settings → Login*.

**Removing an integration is deliberately gentle**

A removed provider disappears from the lists and is no longer offered: readers can no longer pick its payment method for a new subscription, and a removed tracking pixel is no longer added to new articles. What already exists keeps working — a payment that is still being processed is not cut off, existing subscriptions keep renewing, articles keep their tracking pixels, and an invoice from last year still shows the provider that took the money. Add the same provider back later and its configuration is exactly as you left it.

**Switching a type clears the configuration**

Access details for one provider are meaningless for another, so switching the type deletes them. The editor asks you to confirm before it does.

**After the update**

Your existing providers carry over unchanged. It is still worth opening *Settings → Integrations* once to check that the list matches what you actually offer — providers that were configured at some point in the past but are no longer in use no longer show up there.
