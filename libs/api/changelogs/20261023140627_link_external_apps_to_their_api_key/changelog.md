---
title: Link external apps to their API key
lead: An external app that reads data from We.Publish can now be linked to its API key, so you see in time when that key expires or stops working.
actionRequired: false
---

Under **Dashboard → Apps**, an app's settings now have an **API key** field. Pick the key the app uses to read data from We.Publish. The key itself stays stored in the app; We.Publish only records which one it is.

Once linked:

- The app's tile on the dashboard and its settings page warn 30 days before the key expires, and again once it has expired or been revoked. From then on the app can no longer read any data.
- To renew, create a new key under **Settings → API Keys**, store it in the app and link it here. Then revoke the old one.

Only keys you can see in the API keys list can be linked, and only while they are still valid.
