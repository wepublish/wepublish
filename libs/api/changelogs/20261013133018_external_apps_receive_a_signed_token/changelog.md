---
title: Apps know who you are
lead: Apps under «We.Publish Apps» now receive a signed token with your editor identity when you open them, in the editor and in a new tab, so an app can show you as logged in without a second login.
actionRequired: false
---

**Apps on the dashboard** (Dashboard → We.Publish Apps)

- **One click, logged in.** When you open an app, the editor hands it a signed token that identifies you (name, e-mail, roles). Apps that support it skip their own login.
- **Both ways of opening.** Apps embedded in the editor and apps that open in a new tab receive the token the same way.
- **No token, no app.** If no token can be issued, the app does not open and the editor shows the reason instead.
- **For whoever builds an app:** the token is in the URL fragment (`#token=…`), valid for 4 hours, and can be checked via `GET /external-apps/userinfo` or the public key at `/.well-known/jwks.json`. The token is issued for the app's origin, so apps registered with a path or a trailing slash are verified too.
