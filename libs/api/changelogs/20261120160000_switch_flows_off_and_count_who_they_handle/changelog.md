---
title: Communication flows can be switched off, and their counts add up
lead: A flow can now be switched off without deleting it, for example to prepare it before it goes live. “Subscriptions” counts only who a flow still sends to, and the column header shows the total.
actionRequired: false
---

- **Switching a flow off and on.** Under “Automated messages”, each flow except the default flow has a switch in “Actions”. Before switching, you are told how many subscriptions move to other flows, or how many this flow takes over. A switched-off flow is greyed out and its page says so.
- **Where the subscriptions go.** While a flow is off, its subscriptions get the messages of the next matching flow: a flow for all member plans, otherwise the default flow. The default flow cannot be switched off.
- **Overlaps.** A switched-off flow does not block others. Switching it on is refused if it would cover the same subscriptions as an active flow.
- **“Subscriptions” counts who a flow still handles:** running subscriptions, and ended ones whose end lies within the flow's latest event, e.g. 5 days for “Deactivation due to unpaid invoice”. Subscriptions that ended long ago are no longer counted.
- **The total in the header.** Each subscription is counted in exactly one flow, so the numbers add up. When the list is filtered by member plan, every count follows the filter, and the total sums the rows shown.
