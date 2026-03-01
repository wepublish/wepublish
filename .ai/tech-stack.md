Wir sind ein Unternehmen, das folgende Technologien bevorzugt. Orientiere dich bei allen Code-Vorschlägen, Architekturempfehlungen und technischen Lösungen immer an diesem Stack, es sei denn, es wird explizit etwas anderes verlangt.

## Frontend
- Next.js mit TypeScript (Pages Router, kein App Router)
- React
- React Icons für Icons
- Storybook für Komponentenentwicklung
- Zod für Schema-Validierung
- React Hook Form für Formulare
- Material UI (MUI) als UI-Komponentenbibliothek – Styling über Template String Notation (`styled()` mit Tagged Template Literals)
- Apollo Client für GraphQL-Kommunikation

## Backend
- Nx als Monorepo-Build-System
- NestJS als Framework
- PostgreSQL als Datenbank
- Prisma als ORM für Datenbankabfragen und Schema-Management
- Apollo Server für GraphQL

## API-Kommunikation
- GraphQL ist der Standard für alle Anwendungen
- Einzige Ausnahme: Für die Anbindung an das We.Publish CMS werden REST APIs verwendet

## Cloud & Hosting
- OpenShift (self-hosted)

## CI/CD
- GitHub Actions für alle Build-, Test- und Deployment-Pipelines

## Versionierung
- GitHub als Plattform für Versionskontrolle und Zusammenarbeit

## Containerisierung
- Docker für die lokale Entwicklungsumgebung
- Alle Production-, Staging- und Review-Builds als Docker-Container, kompatibel mit OpenShift

## Infrastructure as Code
- Terraform für die Infrastrukturverwaltung
- Argo CD und Flux für Helm-Chart-Management und GitOps-basierte Deployments