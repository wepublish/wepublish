# kv-ttl-cache.module-api

`KvTtlCacheModule` / `KvTtlCacheService`: a TTL key-value cache with namespaces
(`getOrLoadNs`, `resetNamespace`) and in-flight de-duplication, used for provider
settings, crowdfunding sums and similar lookups.

## Stores

| Environment | Store |
| --- | --- |
| `REDIS_URL` unset (unit tests, dev without Docker) | in-memory, per process |
| `REDIS_URL` + `REDIS_KEY_PREFIX` | Dragonfly, shared by every api replica |
| `REDIS_URL` without `REDIS_KEY_PREFIX` | refuses to start |

With Dragonfly, keys are stored as `<REDIS_KEY_PREFIX>::<key>`, which the
per-medium ACL on dragonfly01 requires. A `resetNamespace` in one replica is seen
by all of them.

If Dragonfly is unreachable, every lookup is a cache miss: the loader runs, the
error is logged (`Dragonfly cache unavailable, falling back to the loader`) and
the next call tries to connect again. Requests do not fail and do not queue.

Values are stored as JSON. `Date`s are restored as `Date`s; `Decimal`, `BigInt`,
`Map`, `Set` and class instances are not — cache plain data.

In production `REDIS_URL` is a `rediss://` URL; the TLS certificate is signed by
our internal CA, which Node trusts through `NODE_EXTRA_CA_CERTS=/wepublish/ca.crt`.

## Running unit tests

```bash
npx nx test kv-ttl-cache.module-api
```

Vitest. `kv-ttl-cache.dragonfly.spec.ts` runs against a real Dragonfly when
`REDIS_TEST_ADMIN_URL` is set (CI does; locally
`REDIS_TEST_ADMIN_URL=redis://default:dragonfly@localhost:6379` after
`npm run start:docker`) and is skipped otherwise. It creates its own ACL user with
the production rules.
