---
title: The Editor role only manages its own API keys
lead: Users with the Editor role now see and revoke only the API keys they created themselves. Admins still see and revoke every key.
actionRequired: false
---

Until now the **Editor** role could list and revoke every user's API keys under **Settings → API Keys**. Someone with only that role now sees their own keys there and can revoke only those.

To let someone manage other people's keys, give them a role with the permissions *Allows to get the api tokens of every user* and *Allows to revoke the api tokens of every user*.
