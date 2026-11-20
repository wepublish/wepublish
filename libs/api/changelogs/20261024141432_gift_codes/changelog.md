---
title: Gift codes, and free subscriptions with a 100 % discount code
lead: Subscriptions and upgrades that a 100 % discount code makes free now go through. Gift codes can be sold and redeemed on your website through two new blocks; they are switched on per medium.
actionRequired: false
---

This part is already live on every medium: a new subscription or an upgrade
that costs CHF 0 is now confirmed right away, without going to the payment
provider. That happens with a 100 % discount code, for example, or when the
credit from the current subscription covers the whole upgrade. Until now
these orders failed at the provider.

Gift codes are switched on per medium. As long as they are off, nothing about
gift codes changes in the editor or on your website.

Once gift codes are switched on:

- Under **Gifts → Gift offers** you set up what can be given: one
  subscription plan with one duration, a name, a description, an image and
  how many months the code can be redeemed (empty means unlimited).
- Each offer has its own price. The form fills in the plan's price for the
  chosen duration and tells you when the gift is cheaper or more expensive
  than subscribing. The subscription a code starts still costs the plan's
  normal price.
- Each offer has its own payment methods. Stripe, Stripe Checkout, Payrexx and
  Mollie can take gift payments; Bexio invoices cannot yet.
- Buyers see their code once the payment has arrived. An order that stays
  unpaid is canceled after 14 days.
- **Allow discount codes** lets buyers enter a discount code of the offer's
  plan. With a 100 % code the gift is free and the code is issued at once.
- **Renew automatically** decides whether the subscription started with a
  code continues after the gift period, and with which of the plan's payment
  methods. Each code keeps the setting it was sold or created with.
- **Gifts → Gift codes** lists every code with its status, buyer, who redeemed
  it, the recipient name and the payment. You can filter by payment (paid or
  unpaid) and by source (purchase or created by an admin), cancel a code, or
  mark its invoice as paid. Cancelling does not refund the money; you still
  do refunds at the payment provider.
- **Create codes** in the same list hands out codes without a purchase, for
  example at events: pick an offer, how many codes (up to 500) and optionally
  a recipient name. The codes are valid right away and can all be copied at
  once.
- When a reader redeems a code, We.Publish decides what happens. If the
  reader already has a subscription with the same plan and duration that is
  not canceled, the code pays its open invoice or its next period. Otherwise
  the code starts a new subscription with the offer's renewal setting. The
  subscription's payment method never changes. The code list shows which
  invoice a code paid, with a link to the subscription.
- The **Sell gift codes** block sells gift codes on your website. You pick
  which offers it shows and in which order, which registration fields
  logged-out buyers fill in, whether buyers enter the recipient's name and
  whether they may enter a discount code. Readers pay with the same payment
  methods and redirects as when subscribing.
- In the **Redeem gift code** block readers enter a code. Readers who are not
  logged in can log in or register in the same form. Afterwards the block
  tells them whether the code started a new subscription, extended theirs or
  paid an open invoice.
- In the **Subscribe** block, **Link to the gift code redemption** adds the link
  «Willst du ein Geschenkabo einlösen? Hier klicken.» next to the plan
  choice. It leads to the page you pick, usually the one with the redeem
  block.
- Under **Emails** in each gift offer you pick a mail template for when a
  code is bought and one for when it is redeemed. The first goes to the
  buyer as soon as the payment has arrived, the second to the reader who
  redeemed the code. Without a template, no mail goes out. In the mail
  templates, the mail types **Gift code bought** and **Gift code redeemed**
  list the placeholders, such as the code, the recipient name and the date
  until which the code can be redeemed. Word documents attached to the
  template, such as a gift voucher, are filled in with the same placeholders
  and sent along as PDF; the offer names the documents the chosen template
  attaches.

Buyers cannot see their codes in their profile on the website yet, and a
gift code mail cannot be sent again from the editor.
