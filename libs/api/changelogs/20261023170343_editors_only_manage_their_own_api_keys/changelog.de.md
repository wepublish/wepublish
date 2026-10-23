---
title: Die Rolle Editor verwaltet nur noch eigene API-Schlüssel
lead: Wer die Rolle Editor hat, sieht und widerruft nur noch die API-Schlüssel, die er selbst erstellt hat. Admins sehen und widerrufen weiterhin alle Schlüssel.
---

Bisher konnte die Rolle **Editor** unter **Einstellungen → API-Schlüssel** die Schlüssel aller Benutzer sehen und widerrufen. Wer nur diese Rolle hat, sieht dort jetzt nur noch die eigenen Schlüssel und kann nur diese widerrufen.

Wer auch die Schlüssel anderer verwalten soll, braucht eine Rolle mit den Berechtigungen *Allows to get the api tokens of every user* und *Allows to revoke the api tokens of every user*.
