# kv-ttl-cache.module-api

Two-tier caches (process memory, optionally Dragonfly) over cache-manager 7 and
Keyv, and on top of them the namespaced cache the API uses for sessions,
settings, page data and published content. The connection, claims and locks
live in [dragonfly](../../dragonfly/api/README.md); published content and GraphQL
answers in [public-content-cache](../../public-content-cache/api/README.md).

The barrel imports no Apollo or Prisma, so the media server can use it; the
Prisma `Decimal` codec is `@wepublish/kv-ttl-cache/api/prisma`.

## Profiles

`KvCacheModule.forRoot({codec?})` (app root, after `DragonflyModule.forRoot()`)
provides the one `LocalTier`, the codec and `SharePolicy`.
`KvCacheModule.forFeature(token, profile)` registers a cache-manager `Cache`
under `token` through `CacheModule.registerAsync`, with a single
`TieredKeyvStore`. `CACHE_MANAGER` itself is never exported.

| `CacheProfile` | |
| --- | --- |
| `name` | unique; a second profile with the same name throws at boot |
| `shared` | values go to Dragonfly (when it is configured); the fields below exist only on shared profiles |
| `localCopyMs` | how long a replica keeps its copy of a shared value (default 2 s; `delNs` only clears the copy on the replica that calls it) |
| `scope` | `release` (default): the Dragonfly key contains `APP_RELEASE_ID`; `global`: the value survives a deploy |
| `keyPrefix` | prepended to every Dragonfly key; two shared profiles with the same `scope` and `keyPrefix` throw at boot |

Profiles today: `shared` and `local` (`NamespacedCacheModule`),
`graphql:responses` (public-content-cache), `media:links`,
`media:rejected-variants`, `media:missing-links`, `media:generations`,
`media:generation-checks` (media).

## `TieredKeyvStore`

Shared values are stored as `<REDIS_KEY_PREFIX>::val:<release>:<keyPrefix><key>`
(no `<release>:` for `global`). The payload is the codec's encoding of
`{value, expires}`; bump the `val:` prefix whenever that format changes, or
pods of the old and new release misread each other.

- **Read:** the local tier, then `GET` (`getMany`: one `MGET` for all misses).
  A shared hit is copied locally for `min(localCopyMs, time left)`. The store
  checks `expires` itself and hands Keyv no `expires`, so Keyv never sends a
  `DEL` for an expired value. Hits are not written back (no sliding TTL).
- **Write:** `null`/`undefined` and values without a TTL are never stored.
  Values of an unshared profile stay local; a value with a secret-looking field
  (`apiKey`, `secret`, `privateKey`, `password`, `token`, `credential*`; a
  paywall bypass `token` excepted) or whose own encoding is over 262 144
  characters stays local for its full TTL. The secret is logged once per
  namespace (the profile name for keys outside `ns:<namespace>:v…`) and field
  path. Otherwise `SET … PX ttl` plus the local copy. `set`/`setMany` answer
  `false` for what they did not keep at all.
- **Outage:** while Dragonfly is unavailable, or when the `SET` failed, the
  value is kept locally for at most 30 s; unshared profiles are capped at 30 s
  for the whole outage too.
- `clear`, `wrap` and `nonBlocking: true` are refused (`no-wrap.spec.ts`):
  reset a namespace version instead.

The local tier is one LRU of at most 50 000 entries and 32 MB for all profiles,
keyed `<profile name>:<key>`. Values are encoded in memory too
(`kv-ttl-cache-serializer.ts`): `Date`s and Prisma `Decimal`s come back as
such and every read returns a copy; `BigInt`, `Map`, `Set` and class instances
do not survive, and a value that cannot be serialized is answered but not
cached. Data that looks like the serializer's tags is escaped.

## Namespaced cache

`NamespacedCacheModule.forRoot({sharedNamespaces})` (API root) exports
`NamespacedCache`, `NamespaceResets`, `NamespaceVersions` and
`CatchUpScheduler`. The shared list is composed in
`apps/api-example/src/nestapp/shared-namespaces.ts` from each owning lib's
`*_SHARED_NAMESPACES` (a `readonly string[]` in that lib's `*-cache.ts`, next to
its namespace constants); a `settings:*` namespace or a duplicate throws at
boot.
An unlisted namespace stays in process memory, so a new integration is safe by
default. Sessions (`auth:sessions`, 5 min) are deliberately local: they decide
logins and carry readers' personal data, and website pods use the same
Dragonfly user.

`NamespacedCache`: `getOrLoadNs`, `getOrLoadManyNs` (one `MGET`, de-duplicated
keys), `getNs`, `setNs`, `delNs`. `ttlSeconds` is required and must be
positive. Keys are `ns:<namespace>:v<version>:<key>`. Empty results (`null`)
are never stored, so the loader runs again next time. Concurrent loads of one
key on a replica run the loader once; a load that a `delNs` superseded does not
store its result. Every lookup is a Sentry span (`op: cache.get`, name and
`cache.key` = the namespace, never the key; `cache.hit`, for batches
`cache.keys`/`cache.misses`), only inside sampled traces.

### Versions and resets

`NamespaceResets.reset(namespace, {silent?})` writes a new version to
`<prefix>::nsv:<namespace>` and then awaits every registered
`NamespaceResetListener` (errors are logged, never thrown); `silent` skips the
listeners. A replica re-reads a version at most every 2 s (`currentMany`: one
`MGET` for all stale ones), so a reset reaches the other replicas within 2 s and
the resetting replica at once. A missing version is created with `SET NX`.

A version that could not be written is kept and written again every 5 s until
Dragonfly takes it, then once more 3 s later (another replica may have created
an older one meanwhile). `delNs` deletes under the version this replica knows
and the one in Dragonfly, again 3 s later for shared namespaces.

While Dragonfly is unreachable, local namespaces append `~<n>` to their version
every 30 s of the outage (`OutagePeriod`), so a replica stops using values cached
before a reset elsewhere could no longer reach it: a logout on another replica
takes effect within a minute.

`ProviderRegistryService` compares the versions of `settings:paymentprovider`,
`settings:tracking-pixel`, `settings:mailprovider` and `settings:challenge`
every 5 s and rebuilds its providers when another replica changed them.

## Testing

`@wepublish/kv-ttl-cache/api/testing`: `createNamespacedCacheTesting({connection?,
sharedNamespaces?, releaseId?, codec?})` boots the real modules (in memory, or on
a `FakeDragonfly`) and returns `{cache, resets, versions, connection, close}`;
`NamespacedCacheTestingModule.forRoot(...)` for a module of your own.

```bash
pnpm nx test kv-ttl-cache.module-api
```
