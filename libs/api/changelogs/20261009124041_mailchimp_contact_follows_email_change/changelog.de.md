---
title: Der Mailchimp-Kontakt folgt jetzt der neuen E-Mail-Adresse eines Mitglieds
lead: Wechselt ein Mitglied auf eine E-Mail-Adresse, die Mailchimp schon kennt, zieht sein Mailchimp-Kontakt jetzt auf die neue Adresse um. Bisher fiel das Mitglied aus dem Mailchimp-Sync.
---

**E-Mail-Adresse eines Mitglieds ändern**

Das gilt, ob Sie die Adresse im Editor ändern oder das Mitglied sie selbst ändert.

- **Der Kontakt des Mitglieds zieht mit.** Er behält seinen Verlauf, seine Tags und Newsletter-Gruppen und läuft unter der neuen E-Mail-Adresse weiter. Der nächtliche Mailchimp-Sync aktualisiert ihn wie gewohnt.
- **Der andere Kontakt wird archiviert.** Der Kontakt, den Mailchimp für die neue Adresse bereits hatte, wird unter `moved-…@wepublish.ch` archiviert. Bei Bedarf können Sie ihn in Mailchimp wiederherstellen.
- **Nur wenn beide Kontakte abonniert sind.** Ist der Kontakt der neuen Adresse abgemeldet, bereinigt oder ausstehend, wird nichts verschoben, und das Mitglied erscheint unter «Sync-Fehler». So entscheiden Sie, welchen Kontakt Sie behalten.
- **Mitglieder, deren Adressänderung vor diesem Update scheiterte,** stehen weiterhin unter «Sync-Fehler». Korrigieren Sie ihre Kontakte einmalig in Mailchimp und löschen Sie danach den Eintrag.

**Verständlichere Sync-Fehler**

- Unter Integrationen → Mailchimp-Sync → «Sync-Fehler» nennt ein Fehler jetzt den eigentlichen Grund von Mailchimp, wo bisher nur «see the 'errors' array» stand – etwa welches Feld abgelehnt wurde oder dass Mailchimp die E-Mail-Adresse nur bei abonnierten Kontakten ändert.
- Jeder Sync überspringt ein Mitglied, das dort aufgeführt ist, bis Sie die Ursache behoben und den Eintrag gelöscht haben.
