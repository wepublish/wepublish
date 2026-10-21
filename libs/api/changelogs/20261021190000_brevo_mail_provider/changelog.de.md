---
title: Brevo als E-Mail-Dienst
lead: Brevo (früher Sendinblue) kann jetzt die Transaktionsmails von We.Publish verschicken. Zustellmeldungen, der nächtliche Abgleich und die Sperrliste von Brevo fliessen wie bei Mandrill und Mailgun in den E-Mail-Status ein.
---

- Wähle in der E-Mail-Integration den Typ BREVO und trage deinen Brevo-API-Schlüssel ein. In Brevo gespeicherte Vorlagen lassen sich wie bei Mandrill importieren.
- Für Zustellmeldungen legst du in Brevo einen Transaktions-Webhook auf `/mail-webhooks/<Integrations-ID>?key=<Secret>` deiner API an, mit dem Secret, das du als Webhook-Endpoint-Secret einträgst. Ohne Webhook holt der nächtliche Abgleich die Status nach.
