# kv-ttl-cache.module-api

`KvTtlCacheModule` / `KvTtlCacheService`: a TTL key-value cache with namespaces
(`getOrLoadNs`, `resetNamespace`) and in-flight de-duplication, used for provider
settings, crowdfunding sums and similar lookups.

## Stores

Cached values always stay in process memory (an LRU store of at most 50 000
entries), so secrets and personal data never leave the replica. Dragonfly only
holds the namespace versions that make a `resetNamespace` visible to every
replica.

| Environment | Namespace versions |
| --- | --- |
| `REDIS_URL` unset (unit tests, dev without Docker) | in memory: a reset only affects this replica |
| `REDIS_URL` + `REDIS_KEY_PREFIX` | Dragonfly key `<REDIS_KEY_PREFIX>::nsv:<namespace>`, created with `SET NX` |
| `REDIS_URL` without `REDIS_KEY_PREFIX` | refuses to start |

Keyv still serializes values in memory: `Date`s come back as `Date`s through
`kv-ttl-cache-serializer.ts`, and every read returns a copy; `Decimal`,
`BigInt`, `Map`, `Set` and class instances do not survive — cache plain data.

A replica re-reads a namespace version at most every 2 seconds, so a reset on
one replica reaches the others within 2 s; the replica that reset sees it
immediately.

If Dragonfly is unreachable, caching keeps working in memory with the last known
versions and resets stay local; the error is logged (`Dragonfly unavailable,
namespace resets stay local to this replica`) and the next refresh tries again.
Requests do not fail and do not queue.

In production (`NODE_ENV=production`) `REDIS_URL` must be `rediss://`, and the
certificate is verified (`rejectUnauthorized`, Node's hostname check) against
the internal CA read from `NODE_EXTRA_CA_CERTS` — the same `/wepublish/ca.crt`
the database uses. A `redis://` URL or a missing CA file stops the api at
startup.

## Running unit tests

```bash
npx nx test kv-ttl-cache.module-api
```

Vitest. `kv-ttl-cache.dragonfly.spec.ts` runs against a real Dragonfly when
`REDIS_TEST_ADMIN_URL` is set (CI does; locally
`REDIS_TEST_ADMIN_URL=redis://default:dragonfly@localhost:6379` after
`npm run start:docker`) and is skipped otherwise. It creates its own ACL user with
the production rules.
