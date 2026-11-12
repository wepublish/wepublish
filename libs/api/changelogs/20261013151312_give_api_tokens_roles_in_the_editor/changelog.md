---
title: Give API tokens their roles in the editor
lead: When you generate an API token you now pick the roles whose permissions it gets, and you can change the roles of existing tokens. Until now a token had no permissions unless someone set them directly in the database.
actionRequired: false
---

**API tokens** (Peering → Tokens)

- **Roles when generating.** The «Generate Token» panel has a role picker. Programs using the token get exactly the permissions of these roles, the same roles users get. Without a role the token may do nothing; the panel says so.
- **Roles column.** The token list shows the roles of every token, or «No roles – no permissions».
- **Edit roles.** The pencil next to a token changes its roles. Changes apply immediately, also to programs already connected with the token.
- **Tip:** create a role with only the permissions a program needs (e.g. reading subscriptions for an export) instead of giving it the Admin role.
