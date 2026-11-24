---
title: Die Sperrlisten des E-Mail-Dienstes zählen zum E-Mail-Status
lead: Adressen, an die dein E-Mail-Dienst nicht mehr zustellt, egal über welches System die Mail verschickt wurde, gelten in We.Publish jetzt als «nicht erreichbar», und bei Mailgun werden Zustellstatus wie bei Mandrill nachgeholt.
---

- Jede Nacht und bei «Status aktualisieren» liest We.Publish die Sperrlisten des E-Mail-Dienstes: die Ablehnungsliste von Mandrill, die Bounces, Beschwerden und Abmeldungen von Mailgun. Eine Adresse darauf gilt als «nicht erreichbar», auch wenn die gebouncte Mail nicht von We.Publish verschickt wurde.
- Eine Abmeldung von einem einzelnen Mailgun-Tag zählt als Abmeldung, nicht als nicht erreichbare Adresse.
- Bei Mailgun werden verspätete Zustellstatus jetzt aus der Ereignis-API geholt, wenn der Webhook ausgeblieben ist, so wie bisher schon bei Mandrill.
