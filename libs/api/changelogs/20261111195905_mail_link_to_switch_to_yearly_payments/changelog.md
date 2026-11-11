---
title: Mail link to switch to yearly payments
lead: A link in a mail can now open the switch to yearly payments directly. Readers who pay monthly can change with two clicks, without logging in first.
actionRequired: false
---

Add `?switchTo=yearly` to the link to a subscription's page in the profile. Together with the login token that every subscription mail has, the reader lands logged in on their subscription and the confirmation to switch to yearly payments opens right away:

```
https://<your-website>/profile/subscription/{{optional.subscription.id}}?jwt={{jwt}}&switchTo=yearly
```

A good place for it is a mail in a subscription flow limited to monthly payments, for example a few days before the renewal.

If the subscription can't be switched (it is already paid yearly, cancelled or unpaid), the page says so instead of opening the confirmation.
