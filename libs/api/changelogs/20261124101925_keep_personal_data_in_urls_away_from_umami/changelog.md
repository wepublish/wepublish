---
title: Keep personal data in URLs away from Umami
lead: You can now list URL parameters that Umami should never receive, for example the email address a newsletter adds to its links.
actionRequired: false
---

Under *Website settings → Analytics*, the Umami section has a new **Advanced** panel. Add the names of the URL parameters to leave out, such as `mail`, `firstName` or `lastName`. They are removed from the page address and from the referrer before anything is sent to Umami. All other parameters, like the `utm_` campaign parameters, are still tracked.

The list is optional: as long as it is empty, Umami tracks exactly as before. Upper and lower case in parameter names do not matter.
