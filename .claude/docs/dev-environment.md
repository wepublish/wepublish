# Running the Dev Environment

Command reference and env vars live in `.ai/development.md`. **This file is about
agent discipline** — which processes are long-running, what order they start in,
and what must never happen during setup.

## The one rule that matters

**A long-running process never belongs in a setup or verification step.**

`npm run dev`, `npm run watch`, `npm run serve`, `nx serve <app>`, and
`npm run try` do not terminate. Start them only when the user explicitly asks to
run the app — and then start them in the **background**, report the URLs, and
hand back. Never start one to "check whether the change works" when a test or a
typecheck answers the question, and never leave a foreground server blocking the
session.

If you genuinely need the running app to verify something visual, say so, start
it in the background, and tell the user what you are looking for.

## Startup order

`npm run dev` = `start:docker` then `watch`, and `watch` = `migrate` then serve.
So the dependency chain is:

```
docker (database + storage)  →  prisma migrate + seed  →  services
```

Skipping a step fails in a way that looks like an application bug:

- **No Docker** → Prisma cannot reach Postgres; `migrate` fails on connect.
- **No migrate** → the API boots against a schema that does not match the client,
  and resolvers fail at query time rather than at boot.

```bash
npm run dev            # everything: docker → migrate → api, editor, media, website-example
npm run start:docker   # just Postgres + MinIO
npm run migrate        # prisma migrate deploy + seed
```

To run one service, still bring up Docker and migrate first, then
`npm run watch:api-example` / `watch:editor` / `watch:media` /
`watch:website-example`.

## Which URL is which

| Service | URL | Notes |
| --- | --- | --- |
| API (GraphQL) | http://localhost:4000 | `api-example` |
| Editor | http://localhost:3000 | Vite dev server, client-rendered |
| Media | http://localhost:4100 | |
| Website example | http://localhost:4200 | |
| PGAdmin | http://localhost:8000 | |
| MinIO console | http://localhost:9001 | S3-compatible storage |

`docker-compose.yml` also defines `mailpit` for catching outbound mail locally,
and a `migration` service used by the full-stack `npm run try` path.

## Handling common requests

- **"Start everything"** → `npm run dev`, backgrounded. Report the URLs above once
  the services are up.
- **"Start just the API"** → `npm run start:docker`, then `npm run migrate`, then
  `npm run watch:api-example`.
- **"Reset my database"** → **destructive, and there is no script for it.** The
  volumes are `wepublish_database` (Postgres) and `wepublish_storage` (MinIO):

  ```bash
  docker compose down
  docker volume rm wepublish_database    # or wepublish_storage for media
  npm run start:docker && npm run migrate
  ```

  `npm run clean:media` removes `wepublish_storage` for you. There is no
  equivalent for the database — drop `wepublish_database` explicitly as above.

  `docker volume rm` refuses while a container still references the volume, so
  run `docker compose down` first. Confirm with the user *before* dropping
  anything and say exactly what is lost.
- **"Why is my GraphQL type missing?"** → almost always a stale
  `schema-v2.graphql`. Start the API to regenerate it, then `npm run generate-api`.
  See [gotchas.md](gotchas.md).
- **"Is my setup healthy?"** → `docker ps` (database + storage up?), then check the
  ports above. Do not start services to answer this.

## Guardrails

- **Never commit a `.env` file**, and never print secrets from one into the
  transcript. `docker-compose.yml` carries local-only dev credentials; real
  secrets come from the deployment environment.
- **Confirm before dropping a volume or resetting the database.** Losing local
  seed data is cheap; losing a developer's hand-made test fixtures is not.
- **Do not run Prettier manually** — the Husky `pre-commit` hook runs
  `pretty-quick --staged`. See [verification.md](verification.md).
- **Do not run `npm install` to "fix" a failing build** without saying why. It
  rewrites `package-lock.json` and produces a large unrelated diff.
