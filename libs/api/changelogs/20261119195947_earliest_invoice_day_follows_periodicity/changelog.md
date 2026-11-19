---
title: How early a flow may create invoices now depends on the periodicities
lead: The days of a communication flow were limited to 25 days before a subscription ends. The limit now follows the shortest periodicity the flow applies to, so a flow for yearly subscriptions can create invoices and send messages up to 360 days ahead.
actionRequired: false
---

- **The earliest day per periodicity.** Monthly 25 days before the end, quarterly 85, half-yearly 175, yearly 360, two-yearly and lifetime 720. An invoice can only be created once the current period has begun, which is why shorter subscriptions allow less lead.
- **Which periodicity counts.** For the flow of a member plan: the shortest periodicity in its conditions. For the default flow: the shortest periodicity any active member plan offers, or that a subscription without a flow of its own still runs with.
- **On the flow page.** The (i) next to the day of “Invoice creation” says what the earliest day is and why. “Change day” and “Add day” only take days within the range.
- **On the member plan.** “Payment settings” shows the earliest invoice day that follows from the periodicities you tick.
- **When a plan later offers a shorter periodicity.** The plan can still be saved. The member plan, the flow page and the overview of flows show a warning, and for the shorter subscriptions the invoice is created on their own earliest day.

Existing flows keep their days; nothing changes until you move an event.
