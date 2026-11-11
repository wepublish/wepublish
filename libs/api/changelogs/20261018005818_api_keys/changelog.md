---
title: API keys
lead: You can now create API keys so a script or another system can call the API without signing in as a person. A key only carries the permissions you give it, and every key expires on a date you choose.
actionRequired: false
---

**Settings → API Keys**

- **Create API key** asks for a name, the permissions the key should carry, and an expiry date. You can only grant permissions you hold yourself.
- **Every key expires.** The longest a key may last is three years, and anything beyond a year is flagged as not recommended — the longer a key exists, the longer it keeps working if it ever leaks.
- The key itself is shown **once**, right after you create it. Copy it then — it cannot be retrieved again. If you lose it, create a new one.
- The overview leads with the status — active, expired or revoked — followed by the start of the key, how many permissions it carries, when it expires, and when it was last used. It can be filtered by status, and by owner if you may see everyone’s keys.
- **Revoke** stops a key working immediately. Anything still using it will be refused.
