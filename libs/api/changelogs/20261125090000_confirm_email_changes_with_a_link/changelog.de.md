---
title: Link in der E-Mail zur Adressänderung prüfen
lead: Wenn Leser:innen ihre E-Mail-Adresse ändern, geht die Bestätigungs-E-Mail neu an die neue Adresse, und ihr Link öffnet eine eigene Seite. Bitte prüft, ob eure Mail-Vorlage dorthin verlinkt.
---

**Was zu tun ist**

Öffnet die Mail-Vorlage, die ihr für die Änderung der E-Mail-Adresse verwendet, und stellt sicher, dass der Link so lautet:

`https://<eure Website>/confirm-email?token={{jwt}}`

Ein Link zum Profil in der Form `…/profile?jwt={{jwt}}&confirmEmailChange=…` funktioniert weiterhin und wird auf die neue Seite weitergeleitet. Jeder andere Link bestätigt die Adresse nicht mehr.

**Was sich für eure Leser:innen ändert**

- Die Bestätigungs-E-Mail geht an die neue Adresse. So kann nur bestätigen, wer dieses Postfach lesen kann.
- Nach der Bestätigung landen angemeldete Leser:innen in ihrem Profil; allen anderen wird die Anmeldung angeboten.
