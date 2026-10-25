# Local observability stack (opt-in)

OpenTelemetry from the apps: logs and traces into Elasticsearch (directly and
through Logstash), metrics into Prometheus, dashboards in Grafana and Kibana.
Every signal is pushed over OTLP to the collector; Prometheus scrapes no app.
Nothing here runs unless you start the `observability` compose profile, and
the apps send nothing unless you set the env gate below.

The infrastructure runs in containers. The apps run on your machine the way
they always do (`pnpm nx serve …` or the built bundle with `node`).

## Architecture

```
 host (your machine)                containers (profile "observability", network app-tier)
 ───────────────────                ─────────────────────────────────────────────────────
 api-example  :4000 ─┐
 api-example  :4001 ─┤   OTLP/HTTP logs + traces + metrics
 api-example  :4002 ─┼──────────────────────────────► otel-collector  127.0.0.1:4317 / :4318
 media        :4100 ─┤   http://localhost:4318           │  memory_limiter → (redact e-mails) → batch
 editor (built) :3002┤                                   ├──► elasticsearch :9200  (logs-*, traces-*)
 website-example :4200┘                                  ├──► logstash :8080 ──► elasticsearch (logstash-wepublish-*)
                                                         └──► prometheus :9090 /api/v1/otlp ──► grafana :3001
                                                              (OTLP receiver, recording rules)  kibana :5601
```

- Traces only go to Elasticsearch (`traces-*`); there is no Jaeger or Tempo.
  Browse them in Kibana or through the `es-traces` Grafana datasource.
- Metrics are pushed every 15 s (cumulative) to the collector, which forwards
  them to Prometheus's native OTLP receiver (`--web.enable-otlp-receiver`). No
  app opens a metrics port, so several API instances need no extra config.
- Prometheus promotes `service.name`, `service.namespace`,
  `service.instance.id` and `deployment.environment.name` to the labels
  `service_name`, `service_namespace`, `service_instance_id` and
  `deployment_environment_name` on every series. `job` is
  `<service.namespace>/<service.name>` (just `service.name` without a
  namespace) and `instance` is `service.instance.id`. The rules and the
  dashboard use the `service_*` labels.
- There is no `up` for pushed metrics. An instance counts as present while its
  `target_info` series (one per process, written with every push) was seen in
  the last 2 minutes: `service_instance:reporting` and
  `service:reporting_instances:count` in [rules.yml](prometheus/rules.yml).
  `ApiDown` fires when no `wepublish-api` process has pushed for 2 minutes.
- Prometheus still scrapes itself and the collector's own metrics
  (`otel-collector:8888`).

## The env gate

Telemetry is on for a process only when `OTEL_EXPORTER_OTLP_ENDPOINT` is
non-empty and `OTEL_SDK_DISABLED` is not `true`. With the endpoint unset,
api, media and the editor server load none of the OTel SDK, exporter or
instrumentation modules (only `@opentelemetry/api`, which Sentry already
uses) and nothing is exported.

api and media log through Nest's `ConsoleLogger`, built by `createNestLogger()`
in `@wepublish/utils/api/otel/logger`: one JSON object per line when
`NODE_ENV=production`, Nest's coloured output otherwise. With OTel logs on, the
same lines are also emitted over OTLP (`log.source: nest`); `console.*` calls
are bridged as `log.source: console`.

| Variable | Meaning |
| --- | --- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | The gate. `http://localhost:4318` for this stack. |
| `OTEL_SDK_DISABLED=true` | Forces telemetry off even with an endpoint. |
| `OTEL_SERVICE_NAME` | `wepublish-api`, `wepublish-media`, `wepublish-editor`, `website-example`. |
| `OTEL_SERVICE_INSTANCE_ID` | Distinguishes API instances (`api-1`, `api-2`, …). Every process, the editor included, falls back to the hostname when it is unset. |
| `OTEL_METRICS_EXPORTER=otlp` | Push metrics over OTLP (`none` turns them off for api, media and editor). |
| `OTEL_METRIC_EXPORT_INTERVAL` | Push interval in ms. Defaults to `15000` in our code when unset or invalid (the SDK's own default is 60 s, too slow for the `[1m]` rates). |
| `OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE=cumulative` | Prometheus needs cumulative counters. Cumulative is also the SDK default; websites always send cumulative. |
| `OTEL_LOGS_EXPORTER=none` | Metrics and traces only, no logs. |
| `OTEL_NODE_DISABLED_INSTRUMENTATIONS` | Comma list of instrumentation names to skip, e.g. `@opentelemetry/instrumentation-nestjs-core`. |
| `OTEL_WEBSITE_TRACES=true` | Websites only: also export traces. Sentry then gets `enableOpenTelemetrySetup: false`, so that process's Next.js spans go to Elasticsearch instead of Sentry. Without it websites send metrics and logs only. |

The variables every process shares are in [otel.env](otel.env).

**Where to put them.** Export them in the shell you start the app from, or pass
them inline. Do **not** put them in `.env` or `apps/<app>/.env*`: nx loads
those files into every task of the project, tests included, so the test runs
would switch telemetry on. nx gives shell variables precedence over every
`.env` file, so the root `.env` keeps supplying `DATABASE_URL`, JWT keys and
the rest while the shell adds the `OTEL_*` values. The same holds for
`node --env-file`: a variable already set in the shell wins.

Give each process its own `OTEL_SERVICE_INSTANCE_ID` (`api-1`, `api-2`, …);
two processes with the same name and instance id write the same series.

## Start the stack

Needs about 3 GB for the containers; give the podman machine 8 GB
(`podman machine set --memory 8192`, with the machine stopped). If
Elasticsearch exits with a `vm.max_map_count` error, run
`podman machine ssh sudo sysctl -w vm.max_map_count=262144`.

```bash
pnpm run start:docker                               # database, storage, dragonfly as usual
podman compose --profile observability up -d \
  otel-collector elasticsearch logstash kibana kibana-setup prometheus grafana
```

A bare `podman compose --profile observability up -d` works too, but it also
starts every service without a profile, including the `api`, `editor` and
`media` containers, which take ports 4000, 3000 and 4100 from the apps you run
on the host. Name the services as above when the apps run on the host.

Elasticsearch needs 30–60 s before the collector and Kibana start;
`kibana-setup` retries until Kibana answers and then creates the data views.
Stop with `podman compose --profile observability down` (add `-v` to drop the
`elasticsearch`, `prometheus` and `grafana` volumes).

## Run the apps with telemetry

All commands run from the repository root. Load the shared variables into the
shell once:

```bash
set -a; . docker/observability/otel.env; set +a
```

Do not run `pnpm nx test` from that shell (see "Where to put them").

**API, one instance** (watch mode, as in normal development):

```bash
OTEL_SERVICE_NAME=wepublish-api OTEL_SERVICE_INSTANCE_ID=api-1 \
pnpm nx serve api-example
```

**API, two or three instances.** `nx serve` rebuilds `dist/apps/api-example`
in place and opens the inspector on 9229, so running it twice clashes. Build
once and start the bundle with `node`; `--env-file` loads the same files nx
would (later files win, the shell wins over all of them):

```bash
pnpm nx build api-example

for i in 1 2 3; do
  PORT=$((3999 + i)) \
  OTEL_SERVICE_NAME=wepublish-api OTEL_SERVICE_INSTANCE_ID=api-$i \
  node --env-file=.env --env-file-if-exists=.env.local \
       --env-file-if-exists=apps/api-example/.env --env-file-if-exists=apps/api-example/.env.local \
       --env-file=docker/observability/otel.env \
       dist/apps/api-example/main.js &
done
```

Instance 1 is on 4000, which is what `HOST_URL`, the editor and the websites
point at; 4001 and 4002 serve the same API and you can load-test them directly.
Every instance runs every `@nestjs/schedule` cron job (mail sending,
subscription renewals, Mailchimp sync), so with three instances those jobs run
three times. Stop them with `kill %1 %2 %3` (or `pkill -f dist/apps/api-example/main.js`).

**Media:**

```bash
OTEL_SERVICE_NAME=wepublish-media OTEL_SERVICE_INSTANCE_ID=media-1 \
pnpm nx serve media
```

**Editor.** `pnpm nx serve editor` is the Vite dev server: it has no
server-side telemetry. Only the built express server (`apps/editor/server.ts`)
is instrumented, and it never sends logs:

```bash
pnpm nx build editor
PORT=3002 API_URL=http://localhost:4000 \
OTEL_SERVICE_NAME=wepublish-editor OTEL_SERVICE_INSTANCE_ID=editor-1 OTEL_LOGS_EXPORTER=none \
node dist/apps/editor/main.js
```

**Website** (the same works for any tenant):

```bash
OTEL_SERVICE_NAME=website-example \
pnpm nx serve website-example
```

Add `OTEL_WEBSITE_TRACES=true` for website traces. Telemetry only starts in
the Node.js runtime; browser bundles and edge middleware never load it, and no
`OTEL_*` value is baked into the Next.js `env` block.

## URLs

| What | URL |
| --- | --- |
| Grafana (anonymous admin; `admin` / `admin`) | http://localhost:3001, dashboard "We.Publish API" |
| Kibana (data views `logs-*`, `traces-*`, `logstash-wepublish-*`) | http://localhost:5601 |
| Prometheus (OTLP receiver at `/api/v1/otlp`) | http://localhost:9090 |
| Elasticsearch | http://localhost:9200 |
| OTLP receiver (gRPC / HTTP) | localhost:4317 / http://localhost:4318 |

All ports are published on 127.0.0.1 only.

## Caveats

- **Crons run per instance.** See the API section above.
- **Logs contain PII.** `LogMailProvider` logs recipients, subjects and
  bodies. The collector masks e-mail addresses in log bodies; subjects, bodies
  and other attributes still reach Elasticsearch. Local demo only; do not point
  this at production data.
- **The editor dev server is Vite** and is not instrumented; use the built
  server for editor metrics and traces.
- **Metric names** follow the stable HTTP semantic conventions
  (`OTEL_SEMCONV_STABILITY_OPT_IN=http`), e.g.
  `http_server_request_duration_count` / `_bucket`. Prometheus translates
  OTLP names with `translation_strategy: UnderscoreEscapingWithoutSuffixes`,
  so no unit or `_total` suffix is added: it is `nodejs_eventloop_delay_p99`,
  not `…_seconds`, and `v8js_memory_heap_used`, not `…_bytes`. If a dashboard
  panel stays empty, check the name in Prometheus first.
- **Security is off** in Elasticsearch and Grafana is anonymous admin. Both are
  bound to 127.0.0.1.
