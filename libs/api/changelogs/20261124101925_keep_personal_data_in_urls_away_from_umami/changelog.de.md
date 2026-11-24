---
title: Persönliche Daten in URLs bleiben von Umami fern
lead: Du kannst jetzt URL-Parameter festlegen, die Umami nie erhält, zum Beispiel die E-Mail-Adresse, die ein Newsletter an seine Links hängt.
actionRequired: false
---

Unter *Website-Einstellungen → Analytics* hat der Umami-Bereich ein neues Feld **Erweitert**. Trage dort die Namen der URL-Parameter ein, die wegfallen sollen, etwa `mail`, `firstName` oder `lastName`. Sie werden aus der Seitenadresse und dem Referrer entfernt, bevor etwas an Umami geht. Alle anderen Parameter, wie die `utm_`-Kampagnenparameter, werden weiterhin erfasst.

Die Liste ist optional: Solange sie leer ist, erfasst Umami alles genau wie bisher. Gross- und Kleinschreibung der Parameternamen spielt keine Rolle.
