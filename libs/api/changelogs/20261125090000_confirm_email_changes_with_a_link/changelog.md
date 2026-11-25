---
title: Check the link in your email-change mail
lead: When readers change their email address, the confirmation mail now goes to the new address and its link opens a page of its own. Please check that your mail template links to it.
actionRequired: true
---

**What to do**

Open the mail template you use for changing the email address and make sure its link reads:

`https://<your website>/confirm-email?token={{jwt}}`

A link to the profile of the kind `…/profile?jwt={{jwt}}&confirmEmailChange=…` keeps working and is passed on to the new page. Any other link no longer confirms the address.

**What changed for your readers**

- The confirmation mail goes to the new address, so only someone who can read that inbox can confirm it.
- After confirming, readers who are logged in land in their profile; everyone else is offered the login.
