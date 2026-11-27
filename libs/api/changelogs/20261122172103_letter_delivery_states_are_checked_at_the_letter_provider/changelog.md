---
title: Letter delivery states are checked at the letter provider
lead: «Refresh states» under «Sent messages» and the nightly job now also ask the letter provider how printed letters are doing, so a letter no longer stays on an old state when a status message got lost.
actionRequired: false
---

This concerns installations that send printed letters.

- **Sent messages:** «Refresh states» now asks the letter provider as well as the mail provider. The message afterwards tells you how many letters were checked and how many changed.
- **Every night:** the nightly job does the same on its own. Under **Periodic Job Logs** you find it as the step «Letter delivery states», with the number of letters checked and updated.
- **Returned post:** a letter that was handed to the post is checked for another 30 days, because a letter that comes back as undeliverable is reported late.

A status message that arrives late or twice no longer sets a letter back to an earlier state.
