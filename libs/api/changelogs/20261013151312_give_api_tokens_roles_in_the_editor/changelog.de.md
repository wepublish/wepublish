---
title: API-Tokens erhalten ihre Rollen im Editor
lead: Beim Erstellen eines API-Tokens wählst du neu die Rollen, deren Berechtigungen es erhält, und bei bestehenden Tokens kannst du die Rollen ändern. Bisher hatte ein Token keine Berechtigungen, ausser jemand trug sie direkt in der Datenbank ein.
---

**API-Tokens** (Peering → Tokens)

- **Rollen beim Erstellen.** Im Bereich «Token generieren» gibt es eine Rollenauswahl. Programme mit diesem Token erhalten genau die Berechtigungen dieser Rollen, derselben Rollen, die auch Benutzer:innen haben. Ohne Rolle darf das Token nichts; der Bereich weist darauf hin.
- **Spalte «Rollen».** Die Token-Liste zeigt die Rollen jedes Tokens oder «Keine Rollen – keine Berechtigungen».
- **Rollen bearbeiten.** Mit dem Stift neben einem Token änderst du seine Rollen. Änderungen gelten sofort, auch für Programme, die bereits mit dem Token verbunden sind.
- **Tipp:** Erstelle für ein Programm eine Rolle mit genau den nötigen Berechtigungen (z. B. Abos lesen für einen Export), statt ihm die Rolle «Admin» zu geben.
