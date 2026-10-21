# Development Container

## Requirements

Install the [Development Container](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension for VS Code.

## Running servers

* Run the editor: `pnpm run watch` (accessible on http://localhost:3000)
* Run the API: `pnpm nx serve api-example` (accessible on http://localhost:4000)
* Run the websites: `pnpm nx run bajour:serve` or `pnpm nx run tsri:serve` etc. (accessible on http://localhost:420x)

## Supporting services

The container automatically runs the following services:

* PostgreSQL database, accessible over port 5432
* PGAdmin, accessible on http://localhost:8000
* MinIO, accessible on http://localhost:9001
* Dragonfly, accessible from the container on `redis://dragonfly:6379` (admin `default`/`dragonfly`)
