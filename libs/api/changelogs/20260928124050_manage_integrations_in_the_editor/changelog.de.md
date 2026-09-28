---
title: Integrationen im Editor verwalten
lead: Zahlungs-, Mail-, Captcha- und Tracking-Pixel-Anbieter richtest du neu vollständig unter Einstellungen → Integrationen ein — und eine Änderung greift, sobald du speicherst. Ohne Deployment, ohne Wartezeit.
---

Bisher stand in einer Konfigurationsdatei, welche Anbieter es überhaupt gibt; ändern konnte sie nur euer Hosting-Partner. Diese Liste ist jetzt im Editor.

**Was neu möglich ist**

- **Zahlungsanbieter und Tracking-Pixel selbst hinzufügen und entfernen**, unter *Einstellungen → Integrationen*.
- **Den Typ wechseln** beim Mail- oder Captcha-Anbieter — etwa von Mailchimp auf SMTP oder von Turnstile auf hCaptcha.
- **Die Gültigkeitsdauer einer Anmeldung** festlegen, unter *Einstellungen → Login*.

**Entfernen ist bewusst behutsam**

Ein entfernter Anbieter verschwindet aus den Listen, sodass nichts Neues mehr damit eingerichtet werden kann — im Hintergrund läuft er aber weiter. Eine Zahlung, die gerade verarbeitet wird, bricht nicht ab, und eine Rechnung von letztem Jahr zeigt weiterhin den Anbieter, über den das Geld kam. Fügst du denselben Anbieter später wieder hinzu, ist seine Konfiguration unverändert vorhanden.

**Ein Typwechsel löscht die Konfiguration**

Zugangsdaten des einen Anbieters sind für einen anderen wertlos, deshalb werden sie beim Typwechsel gelöscht. Der Editor fragt vorher nach.

**Nach dem Update**

Eure bestehenden Anbieter werden unverändert übernommen. Es lohnt sich trotzdem, *Einstellungen → Integrationen* einmal zu öffnen und zu prüfen, ob die Liste dem entspricht, was ihr tatsächlich anbietet — Anbieter, die irgendwann einmal eingerichtet waren und längst nicht mehr genutzt werden, tauchen dort nicht mehr auf.
