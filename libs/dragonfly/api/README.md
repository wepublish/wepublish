# dragonfly-api

The one connection to Dragonfly, and what is built directly on it: health,
claims, locks and counters. Caches live in
[kv-ttl-cache](../../kv-ttl-cache/api/README.md).

`DragonflyModule.forRoot({ env? })` is global and imported only by app roots
(api, media); feature modules inject `DragonflyConnection`, `DragonflyHealth`,
`DistributedClaims`, `DistributedLocks`, `DistributedCounters`, `RELEASE_ID`
(`APP_RELEASE_ID`, `DEV_RELEASE_ID` = `dev` when unset). Whether Dragonfly is
configured is `DragonflyConnection.shared`; only `DragonflyHealth` reads
`DRAGONFLY_OPTIONS`, for its boot warning.

| Environment | Connection |
| --- | --- |
| `REDIS_URL` unset (unit tests, dev without Docker) | `MemoryDragonflyConnection`, `shared: false`: caches and resets stay on this replica, claims/locks/counters answer `not-configured` |
| `REDIS_URL` + `REDIS_KEY_PREFIX` | `RedisDragonflyConnection`, every key `<REDIS_KEY_PREFIX>::<key>` |
| `REDIS_URL` without `REDIS_KEY_PREFIX` | refuses to start |
| production | refuses `redis://`, and `rediss://` without a readable `NODE_EXTRA_CA_CERTS` |

The env is read in the module's factory, so `.env` values nx loads into tests
never reach it (`vitest.setup-*.ts` delete them; pinned by
`dragonfly.module.spec.ts`).

## Connection

Every command answers a `DragonflyReply`: `{ok: true, value}` or
`{ok: false, reason: 'unavailable' | 'rejected'}`, never a throw.

- A command that fails on the transport or does not answer within 2 s
  (Dragonfly stalls about a second per snapshot) is `unavailable`: the replica
  sends nothing for 5 s and `outageSince()` remembers when it started, until a
  command is answered again. `Dragonfly unavailable, caching on this replica
  only …` is logged at most every 5 s.
- An error reply (full, `NOPERM`) is `rejected` and does not pause anything.
- Commands sent while the connection is set up wait for that one connect (1 s,
  then the half-open client is destroyed; node-redis' own timeout does not
  cover the handshake). A connection is dropped only once a command has gone
  unanswered for 5 s, so a stall costs no reconnect but a dead socket is
  replaced.
- The client is created once (`reconnectStrategy: false`, offline queue off);
  it closes in `onApplicationShutdown`, after which nothing is sent. Both apps
  call `enableShutdownHooks()`, so this runs on `SIGTERM`.

Only `GET`/`MGET`/`SET` (`NX`, `PX`)/`INCR`/`PEXPIRE`/`DEL` are sent, every
key under the prefix (pinned by `redis-dragonfly-connection.spec.ts`; see the
ACL gotcha). No Lua: the production ACL has `-script`, so nothing below is
atomic across two commands.

## Health

`DragonflyHealth.status()` (`/health`, watched by UptimeRobot) answers
`not-configured`, `reachable` or `unreachable` by writing
`<prefix>::health` (60 s). The probe is sent even during the 5 s pause and does
not start one, so `/health` shows whether Dragonfly answers now. The Kubernetes
probes ignore it. At boot `bootCheck()` writes the same key once and logs an
error when it fails (wrong password, ACL user or CA); production without
`REDIS_URL` logs a warning.

## Claims, locks, counters

| Call | Key | Answers |
| --- | --- | --- |
| `claims.claim(name, ttlMs, {retryForMs?})` | `lock:<name>`, `SET NX PX`, never released | `claimed` / `taken` / `not-configured` / `unavailable`; with `retryForMs` asks again every 5 s while `unavailable` |
| `locks.acquire(name, ttlMs)` | `lock:<name>` while a job runs | `{status: 'acquired', lock}` or the claim statuses; `lock` renews every `ttlMs / 4` (`GET`, then `PEXPIRE` while the token is its own, `SET NX` when the key ran out), `release()` deletes it if it still holds its token, `lost` turns true once another replica holds it |
| `locks.isLocked(name)` | `lock:<name>` | `true` / `false` / `not-configured` / `unavailable` |
| `counters.increment(name, windowMs)` / `forget(name)` | `count:<name>`, `SET 0 NX PX`, `INCR`, `PEXPIRE` | `{status: 'counted', count}` or `not-configured` / `unavailable`; the key is born with its expiry, the window restarts with every increment |

The token is per call, so a retry whose earlier `SET NX` landed although its
answer got lost still wins. A holder that misses renewals for a whole `ttlMs`
can lose a lock.

Users:

- `PeriodicJobExecutor` claims `nightly-job` for 12 h: that replica runs the
  periodic jobs and then the Mailchimp sync. `not-configured` falls back to the
  database (`concurrentExecute`); `unavailable` runs nothing (a double run could
  charge twice), the next run catches up. Every run of the periodic jobs, and a
  retry from the editor (`retryPeriodicJob`), holds `lock('periodic-job-run')`
  for 2 min; a second run is skipped or refused with a `ConflictException`, and
  the editor reads `PeriodicJob.running` from `isLocked`.
- `AuditLogRetentionService` claims `audit-log-retention`, but runs on every
  replica when the claim is not `claimed`/`taken` (deleting twice is harmless).
- `SlateToPmMigrator` claims each cron job for 1 s less than its interval and
  migrates anyway without an answer.
- `TrackingPixelService` claims `tracking-pixels:<articleId>` for 60 s, so
  concurrent first reads request one pixel.
- `TotpService` refuses a code once `lock:totp-used:<user>:<time step>` exists
  (90 s, the step, not the code) and counts every attempt in
  `count:totp-failures:<user>` (15 min, forgotten on success); the per-replica
  maps stay as fallback.
- `ReleaseAnnouncer` ([website-revalidation](../../website-revalidation/api/README.md)).

## Testing

`@wepublish/dragonfly/api/testing`: `DragonflyTestingModule.forRoot({connection?,
releaseId?})` and `FakeDragonfly`, a `DragonflyConnection` that records
commands, fails on demand and answers like Dragonfly.

```bash
pnpm nx test dragonfly-api
```
