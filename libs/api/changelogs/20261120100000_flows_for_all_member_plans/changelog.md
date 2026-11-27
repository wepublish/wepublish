---
title: A communication flow can be for all member plans
lead: Until now a flow of your own belonged to exactly one member plan. A flow can now be for the matching subscriptions of every member plan, for example one flow for all yearly subscriptions, so the same messages no longer have to be set up once per plan.
actionRequired: false
---

- **Creating one.** Under “Automated messages”, “New flow”: choose “All member plans” instead of a member plan, then the payment methods, terms and renewal the flow is for. A field you leave empty does not narrow: “Yearly” alone covers yearly subscriptions with any payment method. At least one field must be filled in.
- **Which flow a subscription gets.** First a flow of its own member plan, if one matches. Then a flow for all member plans. If neither matches, the default flow.
- **In the overview.** Flows for all member plans are listed right after the default flow and stay visible when you filter by member plan. “Affected subscriptions” counts only those no member plan flow takes first.
- **How early it may act.** As for a member plan's flow: the shortest term in its conditions sets the earliest day. A flow for “Yearly” only may create invoices up to 360 days ahead.
- **No overlaps.** Two flows for all member plans cannot be for the same subscriptions; the second is refused. An empty field counts as every value here.
- **A grouped list with more filters.** The overview heads the flows by what they are for: “Default”, “For all member plans”, then each member plan. Besides the member plan you can filter by payment method, term and renewal, by flows with a warning, and by flows with or without subscriptions.
