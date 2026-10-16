# Nest HTTP adapter benchmark

Compares `@nestjs/platform-express` against the vendored
`@nestjs/platform-node` (see `vendor/nestjs-platform-node`) on an identical
Nest application.

```bash
cd tools/benchmarks/platform-adapter
npm install
npm run bench
```

Results are written to `results.json`; the committed copy is the run quoted in
the performance report.

## What it runs

Four servers, booted once and kept warm for the whole run:

| Server | Adapter | Middleware |
| --- | --- | --- |
| `server-express.ts` | Express | the api-example stack |
| `server-node.ts` | node:http | the api-example stack |
| `server-express-bare.ts` | Express | none |
| `server-node-bare.ts` | node:http | none |

"The api-example stack" mirrors `apps/api-example/src/main.ts`: `bodyParser:
false`, CORS with credentials, helmet, the webhook-skipping conditional JSON
parser at a 1MB limit, and urlencoded. The bare pair exists so the report can
separate *adapter* cost from *Express middleware* cost — without it a single
number cannot tell you which half the win came from.

`graphqlUploadExpress` is deliberately excluded. It is Express-specific, has no
counterpart on the other adapter, and only does real work on multipart
requests, so including it would confound the comparison rather than inform it.

## Method

Each round benchmarks every adapter on every scenario. Adapter order is
reversed on even-numbered rounds: with all four servers resident, whichever
runs first in a round benefits from a cooler CPU, and alternating cancels that
bias instead of baking it into the result. Reported figures are the **median
across rounds**, not the best round.

Defaults are 5 rounds x 10s at 50 connections, after a 3s warmup per
adapter/scenario. Override with env vars:

```bash
DURATION=30 ROUNDS=9 CONNECTIONS=100 npm run bench
BARE=0 npm run bench
```

## Reading the numbers

The load generator shares a machine with four Node servers, so absolute
requests/sec are a property of this laptop and are not comparable to published
figures. The **ratios** are the result; the absolute numbers are not.

These scenarios do no I/O on purpose, which is what makes the adapter visible.
A real We.Publish GraphQL request spends milliseconds in Postgres, and the
adapter saves tens of microseconds — so do not expect these ratios to show up
end-to-end. They apply to cheap, high-rate endpoints.
