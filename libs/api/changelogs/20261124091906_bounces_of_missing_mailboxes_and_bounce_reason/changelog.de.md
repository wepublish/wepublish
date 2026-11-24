---
title: Fehlende Postfächer werden zuverlässiger erkannt, und Bounces zeigen ihren Grund
lead: Eine Adresse, deren Postfach nicht existiert, gilt jetzt auch dann als nicht erreichbar, wenn der Mailanbieter den Bounce als vorübergehend meldet. Die Liste der gesendeten Mitteilungen kann anzeigen, was der Anbieter zu einem Bounce gemeldet hat.
---

**E-Mail-Status.** Manche Mailserver lehnen eine Mitteilung an ein nicht existierendes Postfach so ab, dass der Mailanbieter (Mailchimp Transactional) sie als vorübergehenden Bounce einordnet. Ein solcher Bounce zählt jetzt, wenn seine Beschreibung sagt, dass es das Postfach oder die Domain nicht gibt: Die Adresse gilt als nicht erreichbar, und die Person wird wie nach jedem anderen dauerhaften Bounce für die Zustellung per Brief vorgeschlagen. Ein volles Postfach oder eine andere vorübergehende Störung ändert weiterhin nichts.

**In der Liste der gesendeten Mitteilungen.** Eine neue Spalte **Bounce-Grund** zeigt bei gebouncten und zurückgehaltenen Mitteilungen die Beschreibung des Anbieters zusammen mit der Antwort des empfangenden Mailservers. Die Spalte ist ausgeblendet, bis sie im Spaltenmenü eingeschaltet wird, und sie ist Teil des Exports.

**Gut zu wissen.** Der Grund wird auch für Mitteilungen angezeigt, die vor diesem Update gebounct sind. Der E-Mail-Status folgt solchen Bounces erst ab diesem Update: Eine Adresse, die früher auf diese Weise gebounct ist, behält ihren Status, bis die nächste Mitteilung an sie bounct.
