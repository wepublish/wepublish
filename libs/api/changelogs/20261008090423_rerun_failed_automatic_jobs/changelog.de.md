---
title: Fehlgeschlagene Jobs neu starten, verständlichere Fehlermeldungen
lead: Schlagen die nächtlichen Jobs für die Abos fehl, kann ein Admin sie jetzt direkt im Dashboard neu starten, und sie holen alle verpassten Nächte bis heute nach. Fehlermeldungen sagen neu, welcher Anbieter wo fehlgeschlagen ist.
---

**Fehlgeschlagene Jobs neu starten**

- **«Erneut ausführen» beim fehlgeschlagenen Job.** Admins sehen den Button beim fehlgeschlagenen Job in der Kachel «Mitteilungen» auf dem Dashboard und auf der Seite «Mitteilungen» im Tab «Automatische Job-Logs». Die fehlgeschlagene Nacht läuft nochmals, danach alle seither verpassten Nächte bis und mit heute. Das läuft im Hintergrund weiter, du kannst die Seite verlassen.
- **Du siehst, wenn ein Job läuft.** Ein laufender Job zeigt «Läuft gerade» und aktualisiert sich selbst, bis er fertig ist, auch wenn ihn der nächtliche Zeitplan gestartet hat.
- **Nie zwei Läufe gleichzeitig.** Solange ein Job läuft, kann kein zweiter gestartet werden, weder automatisch noch von Hand. So werden Erneuerungen nicht doppelt belastet.
- **Ein Job, den ein Server-Neustart unterbrochen hat,** erscheint nach rund zwei Minuten als fehlgeschlagen und kann sofort neu gestartet werden.

**Verständlichere Fehlermeldungen**

- **Schlägt ein Job fehl, sagt die Meldung, was wo schiefging:** welcher Zahlungs- oder Mail-Anbieter, in welchem Schritt und bei welchem Abo bzw. welcher Rechnung. Bisher stand dort oft nur ein Code wie `401 Unauthorized`. Du siehst die Meldung in den Job-Logs, und das We.Publish-Team sieht sie ebenfalls.
- **Eine fehlgeschlagene Belastung behält ihren Grund** bei der Zahlung, lesbar statt leer.

**Mail «Erneuerung fehlgeschlagen»**

- Scheitert die Belastung an einem technischen Problem beim Zahlungsanbieter, enthält `errorCode` in der Mail «Erneuerung fehlgeschlagen» neu `payment-provider-error`. Bisher konnten dort technische Details des Anbieters stehen. Prüfe deine Vorlage, falls sie `errorCode` anzeigt.

**Zuverlässigerer Zustellstatus**

- Zustellmeldungen von Mailgun und Mailchimp (Mandrill) werden nur noch mit gültiger Signatur angenommen. Stimmt das «Webhook Endpoint Secret» in deiner Mail-Integration nicht mit dem Webhook-Signaturschlüssel in Mailgun bzw. Mandrill überein, wird der Zustellstatus nicht mehr aktualisiert.
