---
title: API-Schlüssel handeln im Namen der Person, die sie erstellt hat
lead: Ein API-Schlüssel kann jetzt nur noch, was die Person, die ihn erstellt hat, gerade darf, und alles, was er tut, nennt den Schlüssel und diese Person. Prüfen Sie Ihre API-Schlüssel nach diesem Update einmal.
---

Ein API-Schlüssel wird von Programmen verwendet, die mit Ihrer Instanz arbeiten, etwa ein Import, ein Kassensystem oder eine externe App. Ab jetzt steht die Person, die einen Schlüssel erstellt hat, für ihn ein:

- **Bei jeder Verwendung geprüft.** Ein Schlüssel kann nur, was seine Erstellerin oder sein Ersteller noch darf. Verliert diese Person ein Recht, verliert es auch der Schlüssel; wird sie deaktiviert, gelöscht oder darf sie keine API-Schlüssel mehr erstellen, funktioniert der Schlüssel nicht mehr.
- **Mit Schlüssel und Person festgehalten.** Das **Audit-Log** zeigt Aktionen mit einem Schlüssel als «API-Schlüssel: Name · E-Mail der Person». Wo der Editor anzeigt, wer etwas getan hat, zum Beispiel im Verlauf der Versandart und bei den **Druckausgaben**, steht neu «via API-Schlüssel «Name»».

Die Liste **API-Schlüssel** zeigt, was das für jeden Schlüssel bedeutet:

- **Blockiert**: Die Person existiert nicht mehr, ist deaktiviert oder darf keine API-Schlüssel mehr erstellen. Fahren Sie mit der Maus über die Markierung, um den Grund zu sehen. Programme mit diesem Schlüssel werden abgewiesen.
- **n Rechte fehlen**: Die Person hat einige Rechte des Schlüssels nicht mehr. Fahren Sie mit der Maus über die Markierung, um zu sehen, welche; für den Rest funktioniert der Schlüssel weiterhin.

Die Liste lässt sich jetzt auch nach Status, Anzahl Rechte, Besitzer, letzter Verwendung und Ablauf sortieren. Bei einem Schlüssel, dessen Person gelöscht wurde, steht als Besitzer «Gelöschter User».

**Was zu tun ist:** Öffnen Sie einmal **API-Schlüssel** und suchen Sie nach Schlüsseln, die **Blockiert** sind oder bei denen Rechte fehlen. Braucht ein Programm einen solchen Schlüssel noch, lassen Sie jemanden mit den nötigen Rechten einen neuen erstellen und tragen Sie ihn im Programm ein.
