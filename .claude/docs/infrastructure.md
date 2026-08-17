# Infrastructure

## Cloud & Hosting

- **OpenShift** (self-hosted Kubernetes)
- **Helm** charts for deployment configuration
- **Argo CD / Flux** for GitOps-based deployments

## CI/CD

- **GitHub Actions** for all build, test, and deployment pipelines
- Review environments deployed per PR
- Docker images pushed to GitHub Container Registry (GHCR)

## Containerization

- **Docker** for local development (`docker-compose.yml`)
- Multi-stage Dockerfile for all production builds (API, editor, website, media, migration, storybook)
- **MinIO** as S3-compatible object storage for media in local dev

## Infrastructure as Code

- **Terraform** for infrastructure management
