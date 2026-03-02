We are a company that prefers the following technologies. Always align all code suggestions, architecture recommendations, and technical solutions with this stack, unless explicitly requested otherwise.

## Frontend
- Next.js with TypeScript (Pages Router, not App Router)
- React
- React Icons for icons
- Storybook for component development
- Zod for schema validation
- React Hook Form for forms
- Material UI (MUI) as UI component library – styling via template string notation (`styled()` with tagged template literals)
- Apollo Client for GraphQL communication

## Backend
- Nx as monorepo build system
- NestJS as framework
- PostgreSQL as database
- Prisma as ORM for database queries and schema management
- Apollo Server for GraphQL

## API Communication
- GraphQL is the standard for all applications
- Only exception: REST APIs are used for connecting to the We.Publish CMS

## Cloud & Hosting
- OpenShift (self-hosted)

## CI/CD
- GitHub Actions for all build, test, and deployment pipelines

## Version Control
- GitHub as platform for version control and collaboration

## Containerization
- Docker for the local development environment
- All production, staging, and review builds as Docker containers, compatible with OpenShift

## Infrastructure as Code
- Terraform for infrastructure management
- Argo CD and Flux for Helm chart management and GitOps-based deployments