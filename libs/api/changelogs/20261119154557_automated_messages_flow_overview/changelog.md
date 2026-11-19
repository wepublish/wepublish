---
title: Automated messages start with an overview of all flows
lead: “Automated messages” now opens a list of every subscription flow, the default one and those of member plans, with the subscriptions each applies to. Each flow has its own page, and new flows are created from the list.
actionRequired: false
---

- **Overview.** The list shows per flow which subscriptions it is for (payment method, periodicity, renewal), how many subscriptions that are, and how many of its events send a message. The default flow is always first. A filter narrows the list to member plans; the default flow stays visible because it applies wherever no other flow matches.
- **One page per flow.** Click a flow to edit its events and timeline. The page of a member plan's flow says that it replaces the default flow completely for its subscriptions: an event without a template sends nothing.
- **Warnings.** The list and a flow's page say when a flow does less than its conditions say: when the member plan no longer offers a payment method or periodicity (the flow then only applies to existing subscriptions for it), when it applies to no subscription, or when its member plan was deleted.
- **New flow.** The button “New flow” asks for the member plan and the conditions and opens the new flow. Flows are deleted from the list or from their page.
- **Messages for account & login events** (registration, login link, password reset, changed email address) are now below the list instead of next to the default flow, as a table: event type, the action that triggers it, the message template and “Send test email to me”.
- In the member plan list, the link in the “Edit flow” column opens the overview narrowed to that plan. Old links and bookmarks keep working.

Nothing changes in which messages are sent.
