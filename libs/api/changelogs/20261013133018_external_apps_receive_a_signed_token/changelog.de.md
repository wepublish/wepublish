---
title: Apps wissen, wer du bist
lead: Apps unter «We.Publish Apps» erhalten beim Öffnen neu ein signiertes Token mit deiner Editor-Identität, im Editor wie in einem neuen Tab. So kann dich eine App ohne zweites Login als angemeldet erkennen.
---

**Apps auf dem Dashboard** (Dashboard → We.Publish Apps)

- **Ein Klick, angemeldet.** Öffnest du eine App, übergibt ihr der Editor ein signiertes Token, das dich ausweist (Name, E-Mail, Rollen). Apps, die das unterstützen, überspringen ihr eigenes Login.
- **Beide Arten des Öffnens.** Im Editor eingebettete Apps und Apps, die in einem neuen Tab aufgehen, erhalten das Token auf dieselbe Weise.
- **Kein Token, keine App.** Kann kein Token ausgestellt werden, öffnet sich die App nicht; der Editor zeigt stattdessen den Grund.
- **Für alle, die eine App bauen:** Das Token steht im URL-Fragment (`#token=…`), gilt 4 Stunden und lässt sich über `GET /external-apps/userinfo` oder den öffentlichen Schlüssel unter `/.well-known/jwks.json` prüfen. Es wird für den Origin der App ausgestellt, deshalb funktionieren auch Apps, die mit einem Pfad oder einem Schrägstrich am Ende registriert sind.
