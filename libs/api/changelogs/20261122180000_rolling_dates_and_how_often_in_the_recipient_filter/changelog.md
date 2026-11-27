---
title: Recipient filter: rolling dates and "at least x times"
lead: Dates in the recipient filter can now be set relative to today, for example "in the last 30 days" or "more than 14 days ago", and a condition on received messages can ask how often a template was sent.
actionRequired: false
---

**Rolling dates.** Next to every date field of the recipient filter there is now a switch between **Fixed dates** and **Rolling**. With **Rolling** you choose a number of days instead of two dates:

- **in the last** x days
- **more than** x days ago
- **in the next** x days, for the start and the end of a subscription

Quick picks set 7, 30 or 90 days. The fixed dates you entered are kept when you switch and come back when you switch again.

The switch is available for the start and end of a subscription, for the period a subscription was deactivated in, and for the send date under **Messages received**.

**At least x times.** Each condition under **Messages received** has a new field **At least … times**. "Was sent the template at least 2 times" selects only people who received it that often; with "was not sent" it selects everyone who received it less often.

Both work in **Manual messages** and in the manual assignment of the delivery channel.

**Good to know.** A rolling range is resolved the moment a send or a channel change is started. The history of channel changes then shows the dates that applied, not the rolling range.
