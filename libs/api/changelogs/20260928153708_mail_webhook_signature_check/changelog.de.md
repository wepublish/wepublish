---
title: Zustellstatus von Mandrill und Mailgun wird jetzt korrekt geprüft
lead: Statusmeldungen Ihres Mailanbieters (zugestellt, gebounct, abgewiesen) werden nur noch angenommen, wenn sie die richtige Webhook-Signatur tragen. Bitte prüfen Sie einmalig, ob das Webhook-Secret im Editor mit dem bei Ihrem Anbieter übereinstimmt.
---

Bisher wurden Statusmeldungen von Mandrill oder Mailgun auch dann übernommen, wenn ihre Signatur nicht stimmte. Neu werden Meldungen mit falscher Signatur abgewiesen.

**Was ist zu tun:** Öffnen Sie **Integrationen → E-Mail Provider** und vergleichen Sie das **Webhook Endpoint Secret** mit dem Webhook-Schlüssel bei Ihrem Anbieter (Mandrill: *Settings → Webhooks*, Mailgun: *Sending → Webhooks → HTTP webhook signing key*). Stimmen sie nicht überein, kopieren Sie den Schlüssel Ihres Anbieters in den Editor.

Stimmen sie nicht überein, bleiben Mail-Status auf «submitted» stehen. Mit «Status aktualisieren» im Mail-Log können Sie diese weiterhin manuell abholen.

Ausserdem kann eine gebouncte oder abgewiesene Mail durch eine verspätete Statusmeldung nicht mehr auf «zugestellt» zurückspringen.
