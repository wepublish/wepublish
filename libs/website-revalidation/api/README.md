# website-revalidation-api

The versions the websites' page cache reads to decide when a page is stale
([utils-website README](../../utils/website/README.md)). API only; does nothing
without Dragonfly. Which resets change them is decided in
[public-content-cache](../../public-content-cache/api/README.md).

- `WebsiteSignalsModule`: `WebsitePagesSignal`, `WebsiteLayoutSignal`,
  `WebsitePathsSignal`, for whoever writes the signals.
- `WebsiteRevalidationModule` (API root only): the watcher, the heartbeat and
  the release announcer, all started at `onApplicationBootstrap`.

## Keys the websites read

Pinned byte for byte by `website-keys.contract.spec.ts`; a change needs the
same change in `libs/utils/website`.

| Key (`<REDIS_KEY_PREFIX>::…`) | Written by | Rebuilds |
| --- | --- | --- |
| `nsv:website:pages` | `WebsitePagesSignal` | every page except article pages |
| `nsv:website:layout` | `WebsiteLayoutSignal.changed()`, at once and again 6 s later | every article page |
| `nsv:website:path:<path>` (lower case) | `WebsitePathsSignal.changed(paths)`, at once and again 6 s later; kept 4 h | that article (`/a/<slug>`, `/a/id/<id>`) |
| `website:heartbeat` | `WebsiteHeartbeat`, every 20 s (5 s after a beat Dragonfly did not take), 60 s TTL | websites that miss it treat every version as missing and refresh every 60 s |
| `release:current` | `ReleaseAnnouncer` | see below |

A version that could not be written is written again once Dragonfly answers
(`NamespaceVersions`).

## `website:pages` debounce

`recordChange()` notes the change in `nsl`/`nsf:website:pages` (last / first
pending change). `website:pages` changes once nothing happened for 4 s (so after
the second reset of a publication, ~7 s), at most once a minute across all
replicas (`nsw:website:pages` holds the window), and at the latest a minute
after the first of a steady stream of changes; `nsd:website:pages` remembers
what is done. Pending changes live in Dragonfly and `WebsitePagesWatcher`
checks them every 5 s on every replica, so a restart or crash loses none. A
change that could not be recorded bumps the version directly after 4 s.

## Release

The first replica of an `APP_RELEASE_ID` other than `release:current` (not
`dev`, only with Dragonfly configured and when `bootCheck()` passes) claims
`release:<id>:after:<previous>` for 10 min, stores its id and changes
`website:pages` and `website:layout` once, since another release may render
pages differently, a rollback included. The media server deploys on the same
release and runs none of this.

```bash
pnpm nx test website-revalidation-api
```
