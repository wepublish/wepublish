# We.Publish — editor architecture, and how to add a domain

**Scope.** This document describes how the We.Publish admin editor
(`/Users/itrulia/Documents/wepublish`, branch `master`, commit `360b36ccb`) is built, so that a whole
new **Agenda** domain can be added the way the repo already does it. It covers the shell
(`apps/editor`: bootstrap, providers, routing, navigation, layout, auth, theme, i18n, error
handling), the shared component library `libs/ui/editor`, the generated GraphQL client
`libs/editor/api`, and three representative domains end to end — **goodies** and **paywalls**
(in-app routes) and **crowdfunding** / **banner** (standalone `libs/*/editor` libraries) — all of
which were rewritten in the rsuite→MUI migration `562b8439f5` (2026-10-16) and are therefore
post-migration, idiomatic code. It then catalogues every reusable widget an event form will need,
names the ones that do **not** exist, and states the design-system rules and where theme tokens
live. Everything is grounded in a file path and, where it matters, a line number. The We.Publish
database was stopped during this research; nothing here needed it. A short **Porting notes**
section at the end draws implications — everything before it is a description of what is.

Companion documents: [`wp-01-current-event-implementation.md`](wp-01-current-event-implementation.md)
inventories the existing Event feature that is being deleted (including its five editor screens);
this document describes the *machinery* those screens sit in.

---

## 1. Where editor code lives

### 1.1 The projects

| Nx project | Path | Import alias | Build target? | React Compiler lint? |
| --- | --- | --- | --- | --- |
| `editor` | `apps/editor` | — (application) | `browser` + `server` + `typecheck` | yes |
| `ui-editor` | `libs/ui/editor` | `@wepublish/ui/editor` | yes | yes |
| `editor-api` | `libs/editor/api` | `@wepublish/editor/api` | yes | n/a (generated) |
| `ai-editor` | `libs/ai/editor` | `@wepublish/ai/editor` | yes | yes |
| `banner-editor` | `libs/banner/editor` | `@wepublish/banner/editor` | yes | yes |
| `consent-editor` | `libs/consent/editor` | `@wepublish/consent/editor` | yes | yes |
| `crowdfunding-editor` | `libs/crowdfunding/editor` | `@wepublish/crowdfunding/editor` | yes | yes |
| `membership-editor` | `libs/membership/editor` | `@wepublish/membership/editor` | yes | yes |
| `richtext-editor` | `libs/richtext/editor` | `@wepublish/richtext/editor` | yes | yes |
| `settings-editor` | `libs/settings/editor` | `@wepublish/settings/editor` | yes | yes |
| `event-import-editor` | `libs/event/import/editor` | `@wepublish/event/import/editor` | **no** | **no** |
| `permissions` | `libs/permissions` | `@wepublish/permissions` | — | — |
| `features` | `libs/features` | `@wepublish/features` | — | — |

Source for the table: each project's `project.json`, `tsconfig.base.json:20-140`, and the grep for
`reactCompilerRules('error')` across `*/eslint.config.mjs`. `event-import-editor` is the odd one
out on both counts — no `build` target and no compiler diagnostics. Do not copy it.

### 1.2 Two legal placements for a domain

Both are in active use and nothing in the repo prefers one:

1. **In the app** — `apps/editor/src/app/routes/<domain>/`. Used by: articles, pages, polls,
   comments, events, images, documents, tags, users, userRoles, subscriptions, memberPlans,
   paymentMethods, paywall, goodie, discountCode, peers, tokens, navigations, integrations,
   networkContent, website-settings, audience, auditLog, blockStyles, blockTemplate, dashboard,
   notifications, externalApps, commentRatings, peerArticles.
2. **In a library** — `libs/<domain>/editor/src/lib/`, re-exported by
   `libs/<domain>/editor/src/index.ts`, imported in `app.tsx` through the `@wepublish/<domain>/editor`
   alias. Used by: banner, consent, crowdfunding, membership, settings, ai, event-import.

The library form is what the newest *domain* work uses (`crowdfunding` 2025-04, `banner`), and it is
what lets a domain own its own lint/test/build target and its own `README.md`. The in-app form is
what the newest *small* screens use (`goodie` 2026-08, `discountCode` 2026-08/09).

### 1.3 Wiring checklist for a new `libs/agenda/editor`

Taking `libs/crowdfunding/editor` as the template, a new editor library needs exactly these files:

| File | Content |
| --- | --- |
| `project.json` | `name`, `sourceRoot`, `projectType: "library"`, `targets.build` (`@nx/js:tsc`, `outputPath: dist/libs/agenda/editor`, `main: .../src/index.ts`, `rootDir: "."`), `targets.test.options.config` pointing at the project's own `vitest.config.ts` |
| `tsconfig.json` | `jsx: react-jsx`, `jsxImportSource: @emotion/react`, `moduleResolution: bundler`, `strict`, references to `tsconfig.lib.json` / `tsconfig.spec.json`, extends `tsconfig.base.json` |
| `tsconfig.lib.json`, `tsconfig.spec.json` | copy verbatim from `libs/crowdfunding/editor` |
| `vitest.config.ts` | `createVitestConfig({name: 'agenda-editor', dir: __dirname})` from `../../../vitest.shared` |
| `eslint.config.mjs` | root `baseConfig` + `nx.configs['flat/react']` + `curly: ['error','all']` + **`reactCompilerRules('error')`** (`libs/crowdfunding/editor/eslint.config.mjs:1-36`) |
| `src/index.ts` | named re-exports of the list/create/edit views only |
| `README.md` | one-liner |

and one line in `tsconfig.base.json` `compilerOptions.paths`:

```json
"@wepublish/agenda/editor": ["libs/agenda/editor/src/index.ts"],
```

`@nx/enforce-module-boundaries` is an **error** (`eslint.config.mjs:54-69`), so cross-project
imports must go through the alias; deep relative paths will fail lint.

---

## 2. The shell

### 2.1 Bootstrap — `apps/editor/src/main.tsx`

The provider stack, outermost first (`main.tsx:89-105`):

```
ApolloProvider (getApiClientV2())
└── AuthProvider                     @wepublish/ui/editor
    └── FeaturesProvider             @wepublish/ui/editor
        └── IconContext.Provider     react-icons, className 'rs-icon'   ← rsuite leftover
            └── FacebookProvider / InstagramProvider / TwitterProvider   (embed SDKs)
                └── ThemedApp
                    └── ThemeProvider theme={createEditorTheme()} defaultMode="system" noSsr disableTransitionOnChange
                        └── CssBaseline enableColorScheme
                        └── <App/>
```

Also set up in `main.tsx`:

- Sentry (`main.tsx:28-52`) — only when `sentryDSN` is in the injected client settings; adds
  `browserTracingIntegration`, `replayIntegration` (`maskAllInputs: true`) and
  `graphqlClientIntegration`.
- `react-datepicker` locales — `de`, `enGB`, `fr` registered (`main.tsx:54-58`) and
  `setDefaultLocale` re-applied from `i18n.language` on every render of `ThemedApp`
  (`main.tsx:65`).
- `initI18N()` (`main.tsx:108`).
- global `dragover`/`drop` preventDefault, so a stray file drop does not navigate away
  (`main.tsx:83-84`).

**Client settings** come from a `<script type="application/json" id="settings">` tag that the
express server injects into `index.html` at request time
(`apps/editor/src/main.server.ts:10-36`): `apiURL`, `wepOneURL`, `medium`,
`imgMinSizeToCompress`, `sentryDSN`, `appName`, `appEnvironment`. `apps/editor/index.html` has no
such tag, so in `vite` dev the fallback defaults in
`libs/editor/api/src/lib/setup.tsx:65-73` apply (`apiURL: 'http://localhost:4000'`).

### 2.2 Apollo client — `libs/editor/api/src/lib/setup.tsx`

One singleton (`getApiClientV2()`, line 95). Link chain: `queryErrorLink` → `authLink` →
`RemoveTypenameFromVariablesLink` → `ApolloLink.split(isFile, UploadHttpLink, HttpLink)` against
`${apiURL}/v1`. The auth link reads `localStorage['sessionToken']` and also sends a
`preview: 'preview'` header and `credentials: 'include'` (lines 44-59). Cache is an
`InMemoryCache` seeded with the generated `possibleTypes`. Default fetch policies are
**`network-only`** for both `query` and `watchQuery`, and `refetchOn: false` (lines 118-126) — the
`refetchOn` setting is inert; the refocus reload actually comes from `AuthProvider`
(`.claude/docs/gotchas.md:528`).

`LocalStorageKey` (setup.tsx:38-42) currently has three members: `SessionToken`,
`ImageListLayout`, `AudienceDashboardFilter`.

### 2.3 Auth — `libs/ui/editor/src/lib/authContext.tsx`

- `AuthProvider` runs the `Me` query, and on `data.me` dispatches `Login` with
  `{email, sessionToken: localStorage.getItem('sessionToken'), sessionRoles: roles}`; on
  `!loading && !data.me` it dispatches `Logout` (lines 93-110).
- It refetches `Me` whenever the page becomes visible again (`usePageVisibility`, lines 78-91).
- It renders `null` only on the *first* load (`loading && !data`, line 114) — a refetch must not
  unmount the tree.
- `App` (`apps/editor/src/app/app.tsx:139-147`) redirects to `/login?next=<path>` when
  `session === null` and the path is not already under `/login`.
- `Logout` (`app.tsx:116-135`) runs the `revokeActiveSession` mutation, clears the token from
  `localStorage` and dispatches `Logout`, then `<Navigate to="/login" replace/>`.

### 2.4 Permission gating — `libs/ui/editor/src/lib/atoms/permissionControl.tsx`

Three exports, all used constantly:

```tsx
// 1. wrap a screen; renders a RejectionMessage <Alert severity="error"> if not allowed
const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateGoodie.id, CanUpdateGoodie.id, CanDeleteGoodie.id,
])(GoodieList)
export {CheckedPermissionComponent as GoodieList}

// 2. wrap a fragment of UI; renders nothing when not allowed
<PermissionControl qualifyingPermissions={[CanCreateEvent.id]}> … </PermissionControl>

// 3. booleans
const allowed = useHasPermission([CanPublishEvent.id])
const allowed = useAuthorisation(CanPublishEvent.id)
```

Semantics that matter:

- `useHasPermission` returns **`true` while the roles are still unknown**
  (`permissionControl.tsx:40-42`: `if (!roles) return true`). Permissions therefore never flash a
  screen *off*; they flash it *on*. This is deliberate and contrasted with features below.
- `qualifyingPermissions` is an **OR** — `some()` over the list (line 44).
- `createCheckedPermissionComponent(permissions, showRejectionMessage?)` defaults
  `showRejectionMessage` to `true` (line 77), so a whole screen shows the "no access" alert, while a
  bare `<PermissionControl>` defaults to rendering nothing.
- The export convention is always the rebinding shown above, so the route file imports the guarded
  component under the plain name.

Permissions themselves are plain objects in `libs/permissions/src/lib/permissions.ts`:

```ts
export const CanGetEvent: Permission = {
  id: 'CAN_GET_EVENT',
  description: 'Allows to get an event',
  deprecated: false,
};
```

(lines 685-707 for the five existing event permissions) and must also be listed in
`AllPermissions` (line 1193) and, for editor-facing ones, `EditorPermissions` (line 1376).

### 2.5 Feature gating — `libs/ui/editor/src/lib/featureContext.tsx`

`FeaturesProvider` runs the `Features` query (skipped without a session) and exposes a
`ReadonlySet<string>`. `useFeature(key)` returns `?? false` — **false until the answer is known**,
the opposite of `useHasPermission`, so an unreleased menu item never flashes in
(`featureContext.tsx:41-43`, and `.claude/docs/gotchas.md:596-616`). `FeatureControl` and
`createCheckedFeatureComponent` mirror the permission helpers.

The registry is `libs/features/src/lib/features.ts`:

```ts
export const FEATURES = [] as const satisfies readonly Feature[];
export type FeatureKey = (typeof FEATURES)[number]['key'];
```

It is **empty today**, so `FeatureKey` is `never` and no editor code calls `useFeature` outside the
context file itself. A feature is `{key, description, stage: 'alpha' | 'beta'}` with the key matching
`/^[a-z][a-z0-9-]{1,47}$/`, switched on per medium in We.Publish One.

### 2.6 Routing — `apps/editor/src/app/app.tsx`

One flat `<Routes>` block, 115 `<Route>` elements, no nesting beyond the per-route `<Base>` wrapper.
Shape (`app.tsx:214-1160`):

```tsx
<>
  <Global styles={…} />            {/* table row-state tints, .icon-selector, helpers */}
  <EditorGlobalStyles />
  <SnackbarHost />
  <BrowserRouter>
    <RouteErrorBoundary>
      <Routes>
        <Route path="login" element={<Login />} />
        …
        <Route path="events" element={<Base><EventListView /></Base>} />
        …
      </Routes>
    </RouteErrorBoundary>
  </BrowserRouter>
</>
```

Conventions visible in the route table:

| Convention | Example |
| --- | --- |
| Login routes render bare, without `<Base>` | `app.tsx:226-245` |
| Every ordinary screen is wrapped in `<Base>` per route | `app.tsx:247-1155` |
| Document editors render **without** `<Base>` (they are full-bleed) | `articles/create`, `articles/edit/:id`, `pages/create`, `pages/edit/:id`, `block-content/templates/*` (`app.tsx:305-311, 378-385, 428-436`) |
| Triplet per domain | `<domain>` (list), `<domain>/create`, `<domain>/edit/:id` |
| Tags are a shared screen parameterised by `TagType` | `events/tags`, `events/tags/create`, `events/tags/edit/:id` → `<TagList type={TagType.Event} />` (`app.tsx:569-593`) |
| Permission guard lives on the component, not on the route | see §2.4 |
| `logout` is a route that renders the `Logout` component | `app.tsx:1155-1159` |

The current event routes are `app.tsx:540-598`: `events`, `events/create`, `events/edit/:id`,
`events/tags`, `events/tags/create`, `events/tags/edit/:id`, `events/import`.

**There is no command palette and no route registry.** Grepping `apps/editor/src` and
`libs/ui/editor/src` for `cmdk`, `commandPalette`, `command-palette`, `routeRegistry` and
`metaKey` returns nothing except one unrelated hit in
`libs/ui/editor/src/lib/atoms/teaserOverview/TeaserOverviewPanel.tsx:457`. `wp-01` reached the same
conclusion (`wp-01-current-event-implementation.md:46-49`). Routes are discovered only by reading
`app.tsx`; nothing diffs a registry against it. **Adding an Agenda domain therefore requires no
palette registration of any kind.**

### 2.7 Error surface

| Mechanism | File | Behaviour |
| --- | --- | --- |
| `RouteErrorBoundary` | `apps/editor/src/app/routeErrorBoundary.tsx` | `Sentry.ErrorBoundary` with an MUI `Alert severity="error"` fallback, plus **Retry** (`resetError`) and **Reload** buttons. Without it a render crash unmounts the tree and leaves a blank page (`gotchas.md:676`). |
| `SnackbarHost` | `libs/ui/editor/src/lib/snackbar/snackbar.tsx` | A module-level store + `useSyncExternalStore`; `enqueueSnackbar(message, {variant, title, autoHideDuration, key})`, `closeSnackbar(key?)`. Default duration 5000 ms, `maxSnack` 3, anchored bottom-right. Rendered once, in `app.tsx:221`. |
| `useReportQueryErrors()` | `libs/ui/editor/src/lib/useReportQueryErrors.ts` | Called once in `App()` (`app.tsx:141`). Installs a global Apollo query-error handler that toasts `humanizeError(error)` at `variant: 'error'`, 8000 ms. |
| `humanizeError(error, t?)` | `libs/ui/editor/src/lib/humanizeError.ts` | Maps `CombinedGraphQLErrors` / `ServerError` / `Error` / string / `{message}` to `errors.*` translations: unique constraint (`errors.uniqueEmail` / `errors.uniqueField`), foreign key (`errors.inUse`), Prisma internals (`errors.unexpected`), `Forbidden resource` and `FORBIDDEN`/`UNAUTHENTICATED`/401/403 (`errors.forbidden`), network failures (`errors.network`). |

### 2.8 Layout and navigation — `apps/editor/src/app/base.tsx`

1460 lines, one component. Structure (`base.tsx:429-1459`):

```
<Wrapper>                                   flex, 100vh/100dvh, background.default
  <MobileTopBar>                            only < 900px: menu IconButton + MobileBrand
  {open && <Backdrop onClick={close}/>}
  <Layout>                                  row flex
    <Sidebar data-open={…}>                 248px fixed; < 900px a fixed drawer that slides in
      <Brand to="/dashboard"><Logo/></Brand>
      <Sidenav>                             MUI List, scrolls
        <SidebarNav>                        from @wepublish/ui/editor
          <PermissionControl …>
            <SidebarNavMenu title icon open openIfCurrent onToggle>
              <PermissionControl …>
                <SidebarNavItem href icon>{t('navbar.…')}</SidebarNavItem>
              …
      <Footer>                              3 ClickMenus: logout / language / colour mode
      <Version/>
    <ChildrenContainer>{children}</ChildrenContainer>   rounded card, --wep-page-padding-*
```

Key facts:

- The mobile breakpoint is a module constant: `const mobile = '@media (max-width: 899px)'`
  (`base.tsx:218`).
- `ChildrenContainer` (`base.tsx:394-419`) declares `--wep-page-padding-y` / `--wep-page-padding-x`
  (32 px desktop, 20/16 px mobile). `EditorTemplate`'s sticky header bleeds to the card edges by
  negating them.
- Only one top-level menu is open at a time: `onlyLatestOpen` in
  `apps/editor/src/app/sidebarMenu.ts` (5 lines), driven by `openMenus` state and `readerChose`
  (`base.tsx:434-441`). Before the reader has clicked anything, `openIfCurrent` opens whichever
  menu contains the current route.
- The UI language is a `useStickyState` on `localStorage['wepublish/language']`
  (`base.tsx:205-216, 443-450`), applied via `i18n.changeLanguage`. `AVAILABLE_LANG`
  (`base.tsx:199-203`) is `en/fr/de` with their `date-fns` locales.
- Colour mode is `useColorMode()` (`apps/editor/src/app/colorMode.tsx`), a thin wrapper over MUI's
  `useColorScheme` with preferences `system | light | dark`.
- `useMobileNavigation()` (`apps/editor/src/app/mobileNavigation.ts`) closes the drawer on route
  change and on Escape.

The 13 top-level menus, in order (`base.tsx`):

| Line | Menu | Icon |
| --- | --- | --- |
| 483 | `navbar.dashboard` | `MdPieChartOutline` |
| 535 | `navbar.articles` | `MdDescription` |
| 624 | `navbar.pages` | `MdDashboard` |
| 677 | `navbar.blocks.topMenu` | `MdOutlineGridView` |
| 753 | `navbar.comments` | `MdChat` |
| **815** | **`navbar.events`** | **`MdEvent`** |
| 882 | `navbar.media` | `MdPhoto` |
| 958 | `navbar.authors` | `MdGroup` |
| 1016 | `navbar.audience` | `MdGroups` |
| 1091 | `navbar.communication` | `MdMail` |
| 1168 | `navbar.subscriptionPlans` | `MdCountertops` |
| 1247 | `navbar.peering` | `MdSettingsInputAntenna` |
| 1291 | `navbar.settings` | `MdSettings` |

The events menu today (`base.tsx:808-866`), verbatim in shape:

```tsx
<PermissionControl qualifyingPermissions={[CanGetEvent.id, CanGetCommentRatingSystem.id]}>
  <SidebarNavMenu
    title={t('navbar.events')}
    icon={<MdEvent />}
    open={openMenus.includes('events')}
    openIfCurrent={!readerChose}
    onToggle={wasOpen => toggleMenu('events', wasOpen)}
  >
    <PermissionControl
      qualifyingPermissions={[CanGetEvent.id, CanUpdateEvent.id, CanDeleteEvent.id]}
    >
      <SidebarNavItem href="/events" icon={<MdEvent />}>
        {t('navbar.events')}
      </SidebarNavItem>
    </PermissionControl>

    {/* the importable-events item is commented out */}

    <PermissionControl
      qualifyingPermissions={[CanGetTags.id, CanCreateTag.id, CanUpdateTag.id, CanDeleteTag.id]}
    >
      <SidebarNavItem href="/events/tags" icon={<MdSell />}>
        {t('navbar.eventTags')}
      </SidebarNavItem>
    </PermissionControl>
  </SidebarNavMenu>
</PermissionControl>
```

Two defects worth knowing about before touching it: the outer guard lists
`CanGetCommentRatingSystem.id` (a copy-paste from the comments menu above), and the
`/events/import` item is commented out (`base.tsx:835-848`) while the route still exists
(`app.tsx:594-601`).

### 2.9 `SidebarNav` — `libs/ui/editor/src/lib/navigation/sidebar-nav.tsx`

176 lines, three exports:

- `SidebarNav` — walks its children's `href` props (`collectHrefs`), picks the **longest** match for
  the current `pathname`, and publishes it through `CurrentHrefContext`. That is what stops
  `/events` from lighting up while you are on `/events/tags`.
- `SidebarNavItem({href, icon, children})` — a `ListItemButton component={Link} to={href}` with
  `selected` and `aria-current="page"`.
- `SidebarNavMenu({title, icon, open, openIfCurrent, onToggle, children})` — a `ListItemButton` with
  a rotating `MdChevronRight`, a `Collapse unmountOnExit`, and
  `data-contains-current` for the bold-parent styling.

Matching is `pathname === href || pathname.startsWith(href + '/')` (line 41).

---

## 3. The anatomy of a domain

Putting §2 together, these are the artefacts a complete domain has. The column "Agenda" is what a
new domain must add.

| # | Artefact | Where | Example |
| --- | --- | --- | --- |
| 1 | GraphQL document file | `libs/editor/api/src/lib/schemas/<domain>.graphql` | `goodie.graphql`, `events.graphql` |
| 2 | Regenerated client | `npm run generate-api` → `libs/editor/api/src/lib/gql/graphql.ts` + `schema-types.ts` + `index.ts` | — |
| 3 | Permissions | `libs/permissions/src/lib/permissions.ts` (+ `AllPermissions`, `EditorPermissions`) | `CanGetEvent` … |
| 4 | Form schema + fields | `<domain>Form.tsx` / `<domain>-form.tsx` | `goodieForm.tsx`, `crowdfunding-form.tsx` |
| 5 | Create view | `<domain>CreateView.tsx` / `create-<domain>-form.tsx` | `goodieCreateView.tsx` |
| 6 | Edit view | `<domain>EditView.tsx` / `edit-<domain>-form.tsx` | `goodieEditView.tsx` |
| 7 | List view | `<domain>List.tsx` / `<domain>-list.tsx` | `goodieList.tsx`, `eventListView.tsx` |
| 8 | Delete confirmation | inline `<Dialog>` in the list, or a `delete…Modal/Dialog` component | `deleteEventModal.tsx`, `delete-consent-dialog.tsx` |
| 9 | Routes | `apps/editor/src/app/app.tsx` | `app.tsx:540-598` |
| 10 | Nav entries | `apps/editor/src/app/base.tsx` | `base.tsx:808-866` |
| 11 | Translations in **all three** catalogues | `apps/editor/src/app/locales/{en,de,fr}.json` | `translation.event.*` |
| 12 | Specs | `*.spec.tsx` next to the component | `tagCreateView.spec.tsx` |
| 13 | (library form only) Nx project files + `tsconfig.base.json` path | see §1.3 | `libs/crowdfunding/editor` |

---

## 4. GraphQL: documents in, typed documents out

### 4.1 The pipeline

`codegen.yml` (root, 260 lines) has six outputs; three concern the editor:

| Output | Preset / plugins | Notes |
| --- | --- | --- |
| `libs/editor/api/src/lib/gql/` | `preset: client`, `fragmentMasking: false` | documents: `./libs/editor/api/src/lib/schemas/*.graphql`; config `inlineFragmentTypes: combine`, `enumType: native`, `skipTypename: false`, `nonOptionalTypename: true` |
| `libs/editor/api/src/lib/schema-types.ts` | `typescript` | the whole schema's object types, since client-preset only emits what operations select |
| `libs/editor/api/src/lib/possible-types.ts` | `fragment-matcher` | fed to `InMemoryCache` |

Scalars are mapped identically everywhere (`codegen.yml:36-43`): `Date`/`DateTime`/`Color`/`Slug` →
`string`, `RichText` → `RichtextJSONDocument` (from `@wepublish/richtext`), `Upload` → `File`,
`VoteValue` → `number`.

An `afterAllFileWrite` hook runs `node tools/generateApiIndex.js` (`codegen.yml:5-7`), which rewrites
`libs/editor/api/src/index.ts`: `export * from './lib/gql/graphql'` plus a by-name re-export of every
`schema-types.ts` type the operations file does **not** already export (otherwise `export *` from both
is ambiguous — TS2308). The file carries the banner
`// THIS FILE IS AUTOGENERATED by tools/generateApiIndex.js — EDIT WITH CAUTION`.

The command is `npm run generate-api`:

```
graphql-codegen -r dotenv/config --config codegen.yml && nx run-many -t build -p editor-api,website-api
```

(`package.json:31`). The schema it reads is `apps/api-example/schema-v2.graphql`, itself generated —
see `.claude/docs/gotchas.md:121` and `.claude/docs/graphql-prisma.md`.

### 4.2 What a document file looks like

`libs/editor/api/src/lib/schemas/goodie.graphql` — the complete, current shape of a CRUD domain:

```graphql
fragment FullGoodie on Goodie {
  id
  createdAt
  modifiedAt
  name
  description
  stock
  availableStock
  active
  imageID
  image { ...FullImage }
  memberPlans { id name }
}

query GoodieList($filter: GoodieFilter, $cursor: String, $take: Int, $skip: Int,
                 $order: SortOrder, $sort: GoodieSort) {
  goodies(filter: $filter, cursorId: $cursor, take: $take, skip: $skip,
          order: $order, sort: $sort) {
    nodes { ...FullGoodie }
    pageInfo { startCursor endCursor hasNextPage hasPreviousPage }
    totalCount
  }
}

query Goodie($id: String!) { goodie(id: $id) { ...FullGoodie } }

mutation CreateGoodie(…) { createGoodie(…) { ...FullGoodie } }
mutation UpdateGoodie(…) { updateGoodie(…) { ...FullGoodie } }
mutation DeleteGoodie($id: String!) { deleteGoodie(id: $id) { ...FullGoodie } }
```

Fragments defined in one file are visible in all of them — `FullImage` and `ImageURLs` come from
`image.graphql`, `FullTag` from `tag.graphql`. `ImageURLs` pre-aliases seven `transformURL` sizes
(`largeURL` 500w, `mediumURL` 300w, `thumbURL` 280×200, `squareURL` 100×100, `previewURL` 400×200,
`column1URL` 800×300, `column6URL` 260×300) — `ChooseEditImage` renders `image.largeURL`.

### 4.3 What codegen emits, and how it is consumed

For every operation `Foo` the client preset emits in `libs/editor/api/src/lib/gql/graphql.ts`:

- `export type FooQuery = {…}` / `FooMutation`
- `export type FooQueryVariables = Exact<{…}>`
- `export const FooDocument = {…} as unknown as DocumentNode<FooQuery, FooQueryVariables>`

and for every fragment `FullGoodie` a `FullGoodieFragment` type. **There are no generated hooks.**
Apollo Client 4 infers the types from the `TypedDocumentNode`, so the call sites are:

```tsx
import {useMutation, useQuery} from '@apollo/client/react';
import {GoodieListDocument, DeleteGoodieDocument, FullGoodieFragment, GoodieSort}
  from '@wepublish/editor/api';

const {data, loading, refetch} = useQuery(GoodieListDocument, {variables: {…}});
const [deleteGoodie] = useMutation(DeleteGoodieDocument, {onCompleted: () => refetch()});
```

An async one-shot read uses the client directly (this is how edit forms fetch — see §5):

```tsx
const client = useApolloClient();
const {data} = await client.query({query: GoodieDocument, variables: {id}});
```

`@apollo/client` v4 split its React entry point: hooks come from **`@apollo/client/react`**, while
`gql`, `ApolloLink`, `CombinedGraphQLErrors`, `ServerError` come from `@apollo/client`.

### 4.4 Adding an Agenda document

1. Write `libs/editor/api/src/lib/schemas/agenda.graphql` (or `events.graphql` if the existing one is
   being replaced). Operation names must be globally unique across all document files.
2. Run `npm run generate-api`.
3. Import `AgendaListDocument` etc. from `@wepublish/editor/api` — the barrel is regenerated by the
   hook, so nothing else needs touching.
4. Never hand-edit `gql/graphql.ts`, `schema-types.ts`, `possible-types.ts` or
   `libs/editor/api/src/index.ts` (CLAUDE.md non-negotiable #5).

---

## 5. The canonical form pattern

This is the pattern `.claude/docs/code-style.md:110-129` prescribes ("An edit panel's form *is* the
record") and that every post-migration domain follows. The worked example below is **goodies**
(`apps/editor/src/app/routes/goodie/`), the newest complete CRUD domain in the app.

### 5.1 Shape

```
<domain>Form.tsx       exports  <domain>Schema (zod)  +  <Domain>FormValues (z.infer)  +  <Domain>Form
<domain>CreateView.tsx useForm({resolver, defaultValues: <literal>})      → FormProvider → <form> → SingleViewTitle + <Domain>Form create
<domain>EditView.tsx   useForm({resolver, defaultValues: async () => …})  → FormProvider → <form> → SingleViewTitle + <Domain>Form
```

The form component never receives props beyond `create?: boolean`; it reads the form through
`useFormContext()`.

### 5.2 Create view — `apps/editor/src/app/routes/goodie/goodieCreateView.tsx` (complete)

```tsx
import {useMutation} from '@apollo/client/react';
import {zodResolver} from '@hookform/resolvers/zod';
import {CreateGoodieDocument} from '@wepublish/editor/api';
import {CanCreateGoodie} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import {useState} from 'react';
import {FormProvider, useForm} from 'react-hook-form';
import {useTranslation} from 'react-i18next';
import {useNavigate} from 'react-router-dom';

import {GoodieForm, GoodieFormValues, goodieSchema} from './goodieForm';

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

const GoodieCreateView = () => {
  const {t} = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const closePath = './..';

  const form = useForm<GoodieFormValues>({
    resolver: zodResolver(goodieSchema),
    defaultValues: {name: '', active: true, memberPlanIDs: []},
  });

  const [createGoodie, {loading}] = useMutation(CreateGoodieDocument, {
    onError: onErrorToast,
    onCompleted: data => {
      if (data.createGoodie) {
        if (shouldClose) {
          navigate(`./..`);
        } else {
          navigate(`./../edit/${data.createGoodie.id}`);
        }
      }
    },
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(({image, memberPlans, id, ...goodie}) =>
          createGoodie({variables: goodie})
        )}
      >
        <SingleViewTitle
          loading={loading}
          title={t('goodie.form.createTitle')}
          loadingTitle={t('loading')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <GoodieForm create />
      </form>
    </FormProvider>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateGoodie.id,
])(GoodieCreateView);
export {CheckedPermissionComponent as GoodieCreateView};
```

### 5.3 Edit view — `apps/editor/src/app/routes/goodie/goodieEditView.tsx` (complete)

```tsx
const mapApiDataToInput = (goodie: FullGoodieFragment): GoodieFormValues => ({
  id: goodie.id,
  name: goodie.name,
  stock: goodie.stock,
  active: goodie.active,
  description: goodie.description,
  image: goodie.image,
  imageID: goodie.image?.id,
  memberPlans: goodie.memberPlans,
  memberPlanIDs: goodie.memberPlans.map(memberPlan => memberPlan.id),
});

const GoodieEditView = () => {
  const {t} = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const {id} = useParams();
  const closePath = './../..';
  const client = useApolloClient();

  const form = useForm<GoodieFormValues>({
    resolver: zodResolver(goodieSchema),
    defaultValues: async () => {
      const {data} = await client.query({
        query: GoodieDocument,
        variables: {id: id as string},
      });

      return mapApiDataToInput(data!.goodie);
    },
  });

  const name = useWatch({control: form.control, name: 'name'});

  const [updateGoodie, {loading: updateLoading}] = useMutation(UpdateGoodieDocument, {
    onError: onErrorToast,
    onCompleted: data => {
      if (data.updateGoodie) {
        if (shouldClose) {
          navigate(closePath);
        } else {
          form.reset(mapApiDataToInput(data.updateGoodie));
        }
      }
    },
  });

  if (form.formState.isLoading) {
    return null;
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(({image, memberPlans, ...goodie}) =>
          updateGoodie({variables: {...goodie, id: id as string}})
        )}
      >
        <SingleViewTitle
          loading={updateLoading}
          title={t('goodie.form.editTitle', {goodie: name})}
          loadingTitle={t('loading')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <GoodieForm />
      </form>
    </FormProvider>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanUpdateGoodie.id,
])(GoodieEditView);
export {CheckedPermissionComponent as GoodieEditView};
```

Seven load-bearing details in those two files:

1. **`defaultValues` is an async callback** that does the fetch. There is no `useQuery` and no
   parallel `useState` mirror of the record.
2. **`if (form.formState.isLoading) return null`** — before that every field is `undefined`, and the
   list-valued ones throw (`code-style.md:118-120`, `gotchas.md:737-748`).
3. **`mapApiDataToInput` is a named top-level function**, reused by both `defaultValues` and the
   `onCompleted` `form.reset(...)`, so saving leaves the form in sync without a refetch.
4. **The submit handler destructures the *display-only* fields out** (`image`, `memberPlans`, and on
   create also `id`) and spreads the rest straight into `variables`. The schema deliberately carries
   both `imageID` (sent) and `image` (rendered).
5. **`shouldClose`** is a plain `useState` toggled by `SingleViewTitle`'s "save and close" button
   before the form submits; the mutation's `onCompleted` then navigates or resets.
6. **`closePath` is relative** — `'./..'` from `/goodies/create`, `'./../..'` from
   `/goodies/edit/:id`. (The older event views use an absolute `'/events'`.)
7. **Title text comes from `useWatch`**, never `watch()` — see §5.6.

### 5.4 Form component — `apps/editor/src/app/routes/goodie/goodieForm.tsx` (abridged to the parts that matter)

```tsx
export const goodieSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  stock: z.coerce.number().int().min(0).nullish(),
  active: z.boolean(),
  description: z.custom<RichTextBlockValue['richText']>().nullish(),
  memberPlanIDs: z.array(z.string()),
  memberPlans: z.array(z.custom<Pick<FullMemberPlanFragment, 'id' | 'name'>>()).optional(),
  imageID: z.string().nullish(),
  image: z.custom<FullImageFragment>().nullish(),
});

export type GoodieFormValues = z.infer<typeof goodieSchema>;

export const GoodieForm = ({create}: {create?: boolean}) => {
  const {t} = useTranslation();
  const {control, setValue} = useFormContext<GoodieFormValues>();
  const memberPlans = useWatch({control, name: 'memberPlans'});
  const image = useWatch({control, name: 'image'});
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  return (
    <>
      <GoodieFormWrapper>           {/* grid: 1fr, 1fr 1fr from theme.breakpoints.up('lg') */}
        <GoodieFormSection>
          <Card>
            <CardContent>
              <Stack direction="column" spacing={3}>

                <FormControlLabel
                  control={
                    <Controller
                      control={control}
                      name="active"
                      render={({field}) => (
                        <Switch
                          checked={Boolean(field.value)}
                          onChange={(_event, active) => field.onChange(active)}
                        />
                      )}
                    />
                  }
                  label={<>{t('goodie.form.active')}{' '}
                    <InfoTooltip text={t('goodie.form.activeInfo')} /></>}
                />

                <Controller
                  control={control}
                  name="name"
                  render={({field, fieldState: {error}}) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      label={t('goodie.form.name')}
                      error={Boolean(error)}
                      helperText={error?.message}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="stock"
                  render={({field, fieldState: {error}}) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      label={<>{t('goodie.form.stock')}{' '}
                        <InfoTooltip text={t('goodie.form.stockInfo')} /></>}
                      type="number"
                      slotProps={{htmlInput: {min: 0}}}
                      placeholder={t('goodie.overview.unlimited')}
                      onChange={event =>
                        field.onChange(event.target.value === '' ? null : +event.target.value)
                      }
                      error={Boolean(error)}
                      helperText={error?.message}
                      fullWidth
                    />
                  )}
                />

                <div>
                  <FormLabel>{t('goodie.form.description')}</FormLabel>
                  <Controller
                    control={control}
                    name="description"
                    render={({field}) => (
                      <RichTextBlock value={field.value} onChange={field.onChange} />
                    )}
                  />
                </div>
              </Stack>
            </CardContent>
          </Card>
        </GoodieFormSection>

        <GoodieFormSection>
          <Card variant="outlined" css={{overflow: 'initial'}}>
            <CardContent>
              <Stack direction="column" spacing={3}>
                <div>
                  <FormLabel>{t('goodie.form.memberPlans')}{' '}
                    <InfoTooltip text={t('goodie.form.memberPlansInfo')} /></FormLabel>
                  <Controller
                    control={control}
                    name="memberPlanIDs"
                    render={({field}) => (
                      <SelectMemberPlans
                        name="memberPlanIDs"
                        defaultMemberPlans={memberPlans ?? []}
                        selectedMemberPlans={field.value ?? []}
                        setSelectedMemberPlans={field.onChange}
                      />
                    )}
                  />
                </div>

                <div>
                  <FormLabel>{t('goodie.form.image')}</FormLabel>
                  <Controller
                    control={control}
                    name="image"
                    render={({field}) => (
                      <ChooseEditImage
                        onSelect={(chosen: FullImageFragment) => {
                          setChooseModalOpen(false);
                          setValue('imageID', chosen.id);
                          setValue('image', chosen);
                        }}
                        image={field.value}
                        disabled={false}
                        openChooseModalOpen={() => setChooseModalOpen(true)}
                        openEditModalOpen={() => setEditModalOpen(true)}
                        removeImage={() => {
                          field.onChange(null);
                          setValue('imageID', null);
                        }}
                      />
                    )}
                  />
                </div>
              </Stack>
            </CardContent>
          </Card>
        </GoodieFormSection>
      </GoodieFormWrapper>

      <Drawer anchor="right" open={isChooseModalOpen}
        slotProps={{paper: {sx: {width: DRAWER_WIDTHS.sm, maxWidth: '100vw'}}}}
        onClose={() => setChooseModalOpen(false)}>
        <ImageSelectPanel … />
      </Drawer>

      {image && (
        <Drawer anchor="right" open={isEditModalOpen} … >
          <ImageEditPanel id={image.id} … />
        </Drawer>
      )}
    </>
  );
};
```

Recurring micro-conventions, all visible above:

| Rule | Where it shows |
| --- | --- |
| Every field is a `Controller`, never a registered input | all |
| `value={field.value ?? ''}` on text fields — React controlled-input warning otherwise | `name`, `stock` |
| `error={Boolean(error)} helperText={error?.message}` — **errors next to the field, never in a toast** | `name`, `stock` |
| `<InfoTooltip text={t('…')} />` after a label for anything non-obvious | `active`, `stock`, `memberPlans` |
| Switch/Checkbox carry the label through `FormControlLabel` | `active` |
| `<FormLabel>` + the control for a widget that has no built-in label (rich text, image, pickers) | `description`, `image`, `memberPlans` |
| Groups space themselves with `<Stack spacing={3}>` (theme gives `MuiFormControl` `margin: 'none'`) | both cards |
| Cards only for genuinely multi-column layouts; a single column uses `FormFields` | `goodieForm` is 2-col; `eventForm` uses `FormFields` inside each card |
| `RichTextBlock` is never wrapped in a card or bordered box — it draws its own outlined surface | `description` |
| Drawers are plain MUI `<Drawer anchor="right">` with `slotProps.paper.sx.width = DRAWER_WIDTHS.sm` | image panels |

`DRAWER_WIDTHS` (`libs/ui/editor/src/lib/drawer/drawer.tsx:57-63`) = `{xs: 400, sm: 600, md: 800,
lg: 968, full: '100vw'}`.

### 5.5 Validation messages and `t`

Two flavours coexist:

- **Untranslated** schema at module level — `z.string().min(1)` — and the generic zod message
  surfaces (`goodieForm.tsx:33`, `paywallForm.tsx:46`).
- **Translated** schema as a factory taking `t`:
  `export const createBannerSchema = (t: TFunction) => z.object({title: z.string().min(1, t('errorMessages.required')), …})`
  (`libs/banner/editor/src/lib/banner-form.tsx:43-61`,
  `libs/crowdfunding/editor/src/lib/crowdfunding-form.tsx:38-48`). The view then calls
  `zodResolver(createBannerSchema(t))`.
- A third form exists for messages needed at module scope:
  `lazyMessage('key')` from `apps/editor/src/app/utility.ts:24-27`, which resolves `i18n.t` at
  validation time rather than at schema-construction time.

`code-style.md:122-124` states the rule: "a schema that carries messages is a factory taking `t`".

### 5.6 React Compiler pitfalls — the ones the repo has already paid for

`apps/editor` compiles with `babel-plugin-react-compiler` (`apps/editor/vite.config.ts:19-27`,
`{target: '19'}`), and the nine projects listed in §1.1 turn the compiler's ESLint diagnostics on as
**errors** via `reactCompilerRules('error')` (`eslint.config.mjs:13-29`).

| Trap | Symptom | Fix | Source |
| --- | --- | --- | --- |
| `watch('x')` is read **once** | A dependent field never updates; reads as a layout bug, nothing throws | `useWatch({control, name})`. For `bypasses.${index}.token`-style reads, subscribe to the parent array once and index into the result | `gotchas.md:682-713`, `code-style.md:119-121` |
| `!` non-null assertion inside a handler | The compiler dereferences it *during render*; `/articles/peer` went blank with `Cannot read properties of undefined` even with `open={false}` | Guard inside the handler: `if (!x) return` | `gotchas.md:642-680` |
| A hoisted inner function inside a hook callback becomes a `const` | `Cannot access 'clampPoint' before initialization` — killed every image drawer | Declare helpers above their first call inside effects | `gotchas.md:715-735` |
| `useSeededState` seeding forever | "Too many re-renders" from inside `CurrencyInput` when a derived value is `NaN` | It compares with `Object.is`; and the view must render nothing until `formState.isLoading` clears | `gotchas.md:737-748` |
| `react-hooks/incompatible-library` | Component silently *skipped* by the compiler | Advisory (`warn`), but removing `watch` lets it compile and may surface fresh `set-state-in-effect` errors | `eslint.config.mjs:24-28`, `gotchas.md:709-713` |

Grepping `"[^e]watch("` under `apps/editor` and the editor libs comes back empty today — every read
is a `useWatch`.

### 5.7 `SingleViewTitle` — `libs/ui/editor/src/lib/singleView/singleViewTitle.tsx`

```tsx
interface SingleViewTitleProps {
  title?: string;
  children?: ReactNode;        // extra actions, placed left of Save
  disabled?: boolean;
  loading: boolean;
  loadingTitle?: string;
  saveBtnTitle: string;
  saveAndCloseBtnTitle: string;
  closePath: string;
  setCloseFn(close: boolean): void;
}
```

It renders a two-column grid: a back chevron (`IconButtonTooltip` + `Link to={closePath}`) plus
`<PageTitle>` on the left, and on the right `{children}`, a `variant="outlined"` **Save**
(`type="submit"`, `data-testid="saveButton"`) and a `variant="contained"` **Save and close**
(`type="submit"`, `data-testid="saveAndCloseButton"`, `onClick={() => setCloseFn(true)}`). While
`loading` it swaps the title for a `CircularProgress` + `loadingTitle`.

Both buttons are `type="submit"` only. `code-style.md:114-116` is explicit: adding an `onClick` that
also calls the save bypasses validation entirely.

Siblings `SingleView` and `SingleViewContent` (same folder) are thin MUI `Grid` wrappers and are
barely used by the new code.

---

## 6. The list screen

### 6.1 Building blocks

| Export | File | Role |
| --- | --- | --- |
| `ListViewContainer` | `listView/list-view.tsx:7` | flex row, space-between, `margin-bottom: theme.spacing(3)` |
| `ListViewHeader` | `list-view.tsx:16` | left side, holds `<PageTitle>` |
| `ListViewActions` | `list-view.tsx:22` | right side, holds the "create" `Button` |
| `TableWrapper` | `list-view.tsx:30` | flex column, `min-height: 0` — the table's scroll container |
| `ListFilters` | `list-view.tsx:28` | alias of `ListViewFilters` |
| `StatusBadge` | `list-view.tsx:47` | pill coloured from `StateColor[pending|published|draft|none]` |
| `IconButton` | `list-view.tsx:57` | 36×36 `MuiIconButton` with 4 px left margin between siblings |
| `DataTable` | `listView/data-table.tsx:202` | the table |
| `Pagination` | `listView/pagination.tsx:21` | total + page-size select + MUI `Pagination` |
| `ColumnConfigurator` | `listView/column-configurator.tsx` | the gear menu for hiding/reordering columns |
| `useListViewState` | `listView/use-list-view-state.ts:25` | filter/sort/limit persisted in `localStorage` |
| `useColumnConfig` | `listView/use-column-config.ts:55` | hidden/order persisted in `localStorage` |
| `countActiveFilters`, `clearFilters` | `listView/filter-state.ts` | drive the filter badge and the reset button |
| `mapTableSortTypeToGraphQLSortOrder` | `lib/utility.ts` | `'asc'|'desc'|null` → `SortOrder` |
| `usePaginatedQueryContainer` | `listView/paginated-query-container.tsx:62` | older alternative to `useListViewState`; still exported |
| `useSelectableList`, `SelectedItemsActions` | `listView/use-selectable-list.tsx`, `selected-items-actions.tsx` | bulk selection |

### 6.2 `DataTable`

`libs/ui/editor/src/lib/listView/data-table.tsx`, 654 lines. Built on **@tanstack/react-table v8**
(`useReactTable`, `getCoreRowModel`, `columnResizeMode: 'onChange'`, `manualSorting`,
`manualPagination`) and **@tanstack/react-virtual** for the optional virtualised body, rendered with
MUI `Table`/`TableHead`/`TableBody`/`TableSortLabel`.

```ts
export type DataTableColumn<Row> = {
  id: string;                 // also the localStorage key for hide/reorder
  sortKey?: string;           // what onSort reports; defaults to id
  label: ReactNode;           // header content (may contain an InfoTooltip)
  render: (row: Row) => ReactNode;
  width?: number;
  minWidth?: number;          // default 48
  align?: 'left' | 'center' | 'right';
  fixed?: boolean;            // pinned to the right, excluded from resize/hide/reorder
  resizable?: boolean;        // default: !fixed
  alwaysVisible?: boolean;    // cannot be hidden
  columnLabel?: string;       // plain-text name for the configurator when label is JSX
};

export type DataTableProps<Row> = {
  data: Row[];
  columns: ReadonlyArray<DataTableColumn<Row>>;
  storageKey?: string;        // enables the column configurator and persistence
  hiddenColumns?: string[];   // manual alternative to storageKey
  filters?: ReactNode;        // rendered inside a collapsible panel above the table
  filterCount?: number;       // badge on the Filter button
  onResetFilters?: () => void;
  sortable?: string[];        // sortKeys that get a TableSortLabel
  sortColumn?: string | null;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnId: string, order: SortOrder) => void;
  onRowClick?: (row: Row) => void;
  loading?: boolean;          // renders a centred CircularProgress row
  emptyMessage?: ReactNode;   // defaults to t('listView.table.empty')
  getRowId?: (row: Row, index: number) => string;
  rowClassName?: (row: Row) => string | undefined;   // e.g. 'highlighted-row', 'approved'
  virtualize?: boolean;
  maxHeight?: number | string;
};
```

Behaviour notes:

- The toolbar (Filter button + reset + `ColumnConfigurator`) only renders when `storageKey` or
  `filters` is given; otherwise the bare table is returned (`data-table.tsx:594-596`).
- `fixed` columns are pinned right with `position: sticky` and a shadow that appears when there is
  more to scroll (`pinProps`, `syncPinShadow`).
- `rowClassName` values are styled globally in `app.tsx:143-214`:
  `highlighted-row`, `approved`, `pending-user`, `pending-approval`, `rejected`. The tints are
  `background-image: linear-gradient(tint, tint)` on purpose — as a `background-color` they beat the
  pinned column's own background on specificity (`gotchas.md:796-810`).
- The body is memoised and the deps **must** include `columnDefs` (`data-table.tsx:472-485`,
  `gotchas.md:750-763`).

### 6.3 A complete list screen — `apps/editor/src/app/routes/goodie/goodieList.tsx`

```tsx
function GoodieList() {
  const {t} = useTranslation();
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [sortField, setSortField] = useState<GoodieSort>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [goodieToDelete, setGoodieToDelete] = useState<FullGoodieFragment>();

  const {data, loading, refetch} = useQuery(GoodieListDocument, {
    variables: {
      take: limit,
      skip: (page - 1) * limit,
      sort: sortField,
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    },
  });
  const [deleteGoodie] = useMutation(DeleteGoodieDocument, {onCompleted() {refetch();}});

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('goodie.overview.title')}</PageTitle>
        </ListViewHeader>

        <ListViewActions>
          <Button component={RouterLink} to="create" variant="contained" startIcon={<MdAdd />}>
            {t('goodie.overview.createGoodie')}
          </Button>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="goodies"
          data={data?.goodies.nodes ?? []}
          loading={loading}
          sortColumn={sortField}
          sortOrder={sortOrder}
          onSort={(sortColumn, sortType) => {
            setSortOrder(sortType);
            setSortField(sortColumn as GoodieSort);
          }}
          sortable={['name', 'createdat']}
          columns={[
            {id: 'active', label: t('goodie.overview.active'), width: 75,
             render: rowData => (rowData.active ? `✅` : `❌`)},
            {id: 'name', alwaysVisible: true, label: t('goodie.overview.name'), width: 200,
             render: rowData => <Link to={`edit/${rowData.id}`}>{rowData.name}</Link>},
            {id: 'memberplans', label: t('goodie.overview.memberPlans'), width: 250,
             render: rowData => rowData.memberPlans.map(m => m.name).join(', ')},
            {id: 'stock', label: t('goodie.overview.stock'), width: 120,
             render: rowData => rowData.stock ?? t('goodie.overview.unlimited')},
            {id: 'availablestock',
             label: <>{t('goodie.overview.availableStock')}{' '}
                      <InfoTooltip text={t('goodie.overview.availableStockInfo')} /></>,
             width: 120,
             render: rowData => rowData.availableStock ?? t('goodie.overview.unlimited')},
            {id: 'createdat', label: t('goodie.overview.createdAt'), width: 200,
             render: rowData => `${new Date(rowData.createdAt).toDateString()}`},
            {id: 'action', label: t('action'), width: 100, align: 'center', fixed: true,
             render: goodie => (
               <IconButtonTooltip caption={t('delete')}>
                 <IconButton color="error" size="small" aria-label={t('delete')}
                   onClick={() => setGoodieToDelete(goodie as FullGoodieFragment)}>
                   <MdDelete />
                 </IconButton>
               </IconButtonTooltip>
             )},
          ]}
        />
      </TableWrapper>

      <Pagination
        state={{page, limit, setPage, setLimit}}
        totalCount={data?.goodies?.totalCount ?? 0}
      />

      <Dialog fullWidth open={!!goodieToDelete} maxWidth="xs"
        onClose={() => setGoodieToDelete(undefined)}>
        <DialogTitle>{t('goodie.overview.areYouSure')}</DialogTitle>
        <DialogContent>
          {goodieToDelete && t('goodie.overview.areYouSureBody', {goodie: goodieToDelete.name})}
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setGoodieToDelete(undefined)}>{t('cancel')}</Button>
          <Button variant="contained" color="error"
            onClick={() => {
              deleteGoodie({variables: {id: goodieToDelete?.id ?? ''}});
              setGoodieToDelete(undefined);
            }}>
            {t('goodie.overview.areYouSureConfirmation')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateGoodie.id, CanUpdateGoodie.id, CanDeleteGoodie.id,
])(GoodieList);
export {CheckedPermissionComponent as GoodieList};
```

Note the action column's shape — `id: 'action'`, `label: t('action')`, `align: 'center'`,
`fixed: true` — which `code-style.md:98` prescribes and all of articles, events, goodies, consents,
tags follow.

### 6.4 Persisted list state

`useListViewState(listKey, {defaultFilter, defaultSortField, defaultSortOrder, defaultLimit})`
(`listView/use-list-view-state.ts`) stores `{filter, sortField, sortOrder, limit}` under
`wepublish:editor:listState:<listKey>` and returns
`{filter, setFilter, sortField, sortOrder, setSort, limit, setLimit, reset}`. Defaults:
`sortField: 'modifiedAt'`, `sortOrder: 'desc'`, `limit: 10`. **The page number is deliberately not
persisted** — every list keeps `const [page, setPage] = useState(1)` locally.

`useColumnConfig(storageKey, columns)` stores `{hidden, order}` under
`wepublish:editor:columns:<storageKey>`.

Both go through `useLocalStorage` (`libs/ui/src/lib/hooks/use-local-storage.ts`), which broadcasts a
synthetic `storage` event to every mounted hook. Its `item === storedRaw.current` early return is
load-bearing; without it, hiding a column re-renders every other consumer and re-runs their
`refetch` effects (`gotchas.md:826-850`, pinned by `pageList.spec.tsx`).

### 6.5 Filters

Two options, both pass through `DataTable`'s `filters?: ReactNode`:

**(a) The shared `ListViewFilters`** (`listView/list-view-filters.tsx`, 536 lines). It takes
`fields: readonly Field[]` and renders exactly the controls named. The `Field` union
(lines 83-104) is a **closed list**:

```
title | preTitle | lead | description | slug | draft | published | pending | authors | peerId
| publicationDate | dates | providers | userRole | text | name | location | includeHidden
| answerIds | fingerprint | tags
```

and its `Filter` type is an intersection of `ArticleFilter & PeerArticleFilter & PageFilter &
UserFilter & EventFilter & ImportableEventFilter & PollVoteFilter` (lines 108-115). A new domain's
filter fields therefore require editing this shared file — both the union and the intersection.
Notable renderers: `dates` → `DateRangeFilter` writing `filter.from` / `filter.to` ISO strings with
the day clamped to 00:00:00.000 / 23:59:59.999 (lines 468-487); `publicationDate` →
`DateRangeFilter` writing `{date, comparison}` pairs with `DateFilterComparison`; the
draft/pending/published trio → one `MultiSelectFilter` with per-state chip colours (lines 410-432);
`tags` → `SelectTags`.

The current event list uses `['dates', 'name', 'location']` (`eventListView.tsx:48`).

**(b) A bespoke node.** `tagList.tsx:101-118` and `documentList.tsx:222-239` just pass a
`<TextField>` with an `MdSearch` adornment and compute `filterCount` themselves. Nothing requires
`ListViewFilters`.

### 6.6 Pagination

```tsx
<Pagination
  state={{page, limit, setPage, setLimit}}
  totalCount={data?.x?.totalCount ?? 0}
/>
```

Renders `t('listView.pagination.total', {count})`, a native page-size `Select`
(`DEFAULT_TABLE_PAGE_SIZES = [10, 20, 50, 100]`) and a MUI `Pagination` with
`siblingCount` derived from `DEFAULT_MAX_TABLE_PAGES = 5`. A `compact` variant drops the total and
the size select — used inside the `SelectTags` / `SelectMemberPlans` dropdown footers.

Where it is placed varies: `goodieList` puts it after `</TableWrapper>`, `eventListView` puts it
inside. Both work.

---

## 7. Deletion and dialogs

Three equivalent idioms are in use:

| Idiom | Example |
| --- | --- |
| Inline `<Dialog>` in the list, state = the row being deleted | `goodieList.tsx:190-228`, `articleList.tsx` (one dialog, a `ConfirmAction` enum for delete/unpublish/duplicate) |
| A dedicated modal component taking `{entity, onClose, onDelete}` and owning the mutation | `apps/editor/src/app/routes/events/deleteEventModal.tsx` (91 lines), `libs/banner/editor/src/lib/banner-delete-modal.tsx`, `libs/consent/editor/src/lib/delete-consent-dialog.tsx` |
| The generic `ConfirmActionModal` | `libs/ui/editor/src/lib/atoms/notification/confirmActionModal.tsx` — `{title, message, loading, onConfirm, onClose}`, `role="alertdialog"` |

Button order is fixed by `code-style.md:130-133` and now holds across all 57 dialogs: the
**dismissive** action is `variant="text"` and comes first; the **confirming** action is last so it
lands bottom-right, `variant="contained"`, plus `color="error"` when destructive.

`deleteEventModal.tsx` is the cleanest small example:

```tsx
const [deleteEventMutation] = useMutation(DeleteEventDocument);

async function deleteEvent() {
  if (!event) { return; }
  await deleteEventMutation({
    variables: {id: event.id},
    onError: onErrorToast,
    onCompleted: onCompletedToast(t),   // enqueueSnackbar(t('toast.deletedSuccess'), {variant:'success', autoHideDuration: 3000})
  });
  onClose();
  onDelete();                            // the list's refetch
}
```

---

## 8. Toasts and errors

| Case | Pattern |
| --- | --- |
| Mutation failed | `onError: error => enqueueSnackbar(humanizeError(error), {variant: 'error', autoHideDuration: 8000})` — defined as a module-level `onErrorToast` in every view |
| Delete succeeded | `enqueueSnackbar(t('toast.deletedSuccess'), {variant: 'success', autoHideDuration: 3000})` |
| Query failed anywhere | handled globally by `useReportQueryErrors()` |
| Field validation failed | **not a toast** — `helperText={error?.message}` on the field |
| Render crash | `RouteErrorBoundary` |

`code-style.md:134-140` adds: never show `error.message` raw; do not move the humanising into an
Apollo link, because the consent views and the user list branch on raw texts like
`'Unique constraint'`.

---

## 9. i18n

- Catalogues: `apps/editor/src/app/locales/{en,de,fr}.json`, a single `translation` object, nested.
- Init: `apps/editor/src/app/i18n.ts` — `LanguageDetector` + `initReactI18next`, `fallbackLng: 'en'`,
  `interpolation.escapeValue: false` (React already escapes; re-enabling double-escapes to `&#x2F;`),
  `alwaysFormat: true` with a custom `format` that runs `date-fns` `format` on `Date` values and
  `humanizeError` on `Error` values. That is why list cells can write
  `t('event.list.startsAt', {startsAt: dateObject})` against
  `"startsAt": "Starts at {{startsAt, ccc PP p}}"`.
- `apps/editor/src/app/locales/locales.spec.ts` is the enforcement: it scans
  `apps/editor/src` and every `libs/*/editor/src` for `t('…')` literals and `` t(`prefix.${ `` 
  template prefixes, and fails when (a) a used key is missing from any of the three catalogues,
  (b) a catalogue has duplicate keys, (c) `de`/`fr` lack an English key, or (d) `de`/`fr` have a key
  English lacks. **Every new key must be added to all three files.**
- Language rules (`code-style.md:164-169`): German is Swiss Standard German (no `ß`), lowercase
  `du`, `E-Mail` never `Mail`, guillemets `«…»` with no inner spaces. French is `vous`, typographic
  apostrophe `’`, `« … »` with spaces.
- Existing event keys live under `translation.event.{create,delete,edit,form,list}` — see §13 for the
  full current list.

---

## 10. Widget catalogue for an event form

BKa's event form needs an image picker, date and time pickers, a rich-text editor, searchable
selects, repeatable price rows, repeatable image rows with drag-reorder and a "main image" star, and
repeatable date rows. Here is what exists.

### 10.1 Summary

| Need | Component | Import | Exists? |
| --- | --- | --- | --- |
| Image picker (choose / edit / remove / drag-drop upload) | `ChooseEditImage` + `ImageSelectPanel` + `ImageEditPanel` in a `Drawer` | `@wepublish/ui/editor` | ✅ |
| Date picker | `DatePicker` | `@wepublish/ui/editor` | ✅ |
| Date **range** picker | `DateRangePicker`, or `DateRangeFilter` for the filter-bar variant | `@wepublish/ui/editor` | ✅ |
| Date **+ time** picker with Today/Tomorrow/Now shortcuts | `DateTimePicker` | `@wepublish/ui/editor` | ✅ |
| Standalone **time** input (hh:mm selects, 5-min steps) | `CalendarTimeInput` | `@wepublish/ui/editor` | ✅ (only ever used *inside* the calendar popover) |
| Rich text | `RichTextBlock` (wraps `RichtextEditor`, TipTap v3) | `@wepublish/ui/editor` | ✅ |
| Select with search — tags | `SelectTags` | `@wepublish/ui/editor` | ✅ |
| Select with search — member plans / pages / authors / users / polls / crowdfunding / paywall | `SelectMemberPlans`, `SelectMemberPlan`, `SelectPage`, `AuthorCheckPicker`, `AuthorSelectPicker`, `UserCheckPicker`, `SelectPaywall` | `@wepublish/ui/editor` | ✅ |
| Generic multi-select with chips + checkboxes | `MultiSelectFilter` | `@wepublish/ui/editor` | ✅ (filter-oriented, but generic) |
| Generic searchable select for an arbitrary entity | — | — | ❌ **no generic component**; every domain writes its own `Autocomplete` (see `crowdfunding-form.tsx:183-210`, `banner-form.tsx` pages picker) |
| Repeatable rows, drag-reorder, delete, add | `ListInput` + `useListInputState` | `@wepublish/ui/editor` | ✅ — but **not** react-hook-form aware |
| Repeatable rows inside react-hook-form | `useFieldArray` from `react-hook-form` | — | ✅ — but **no drag-reorder**; 5 call sites, none sortable |
| Repeatable **sortable** rows inside react-hook-form | — | — | ❌ **does not exist**; `ListInput` (dnd-kit) and `useFieldArray` have never been combined |
| "Main / primary" star on a row | — | — | ❌ **does not exist** anywhere in the editor |
| Money input | `CurrencyInput` | `@wepublish/ui/editor` | ✅ (cents ↔ `12.34` display, currency adornment, commits on blur) |
| Colour picker | `ColorPicker` | `@wepublish/ui/editor` | ✅ |
| Switch / checkbox with label | MUI `FormControlLabel` + `Switch`/`Checkbox` | `@mui/material` | ✅ |
| Select (enum) | MUI `TextField select` + `MenuItem` | `@mui/material` | ✅ (see `eventForm.tsx:217-244` for the status enum) |
| Free-text multiline | MUI `TextField multiline rows={n}` | `@mui/material` | ✅ |
| Info tooltip | `InfoTooltip` | `@wepublish/ui/editor` | ✅ |
| File drop | `FileDropInput` | `@wepublish/ui/editor` | ✅ |
| Image focal point | `FocalPointInput` + `Draggable`/`DraggableContainer` | `@wepublish/ui/editor` | ✅ |

### 10.2 Image picker

`ChooseEditImage` (`libs/ui/editor/src/lib/atoms/chooseEditImage.tsx`, 310 lines):

```ts
export interface ChooseEditImageProps {
  image?: FullImageFragment | null;
  disabled: boolean;
  openChooseModalOpen?: () => void;
  openEditModalOpen?: () => void;
  removeImage?: () => void;
  onSelect?: (image: FullImageFragment) => void;   // enables drag-and-drop upload
  maxHeight?: number;                              // default 240
}
```

Empty state is a dashed `ButtonBase` with `MdAddPhotoAlternate`; with an image it shows a blurred
backdrop + `object-fit: contain` image and a floating action bar (choose / edit / remove) on a
translucent black pill. Dropping a file opens `ImageEditPanel` in its own drawer with the file's
EXIF read by `readImageMetaData`.

The caller owns the two drawers (`ImageSelectPanel` to browse the library, `ImageEditPanel` to edit
metadata/focal point) — see §5.4.

### 10.3 Date and time

`libs/ui/editor/src/lib/atoms/datePicker/` wraps **react-datepicker v9** (not `@mui/x-date-pickers`,
even though that package is a dependency):

- `date-picker.tsx` — `DatePicker({value, onChange, withTime, minDate, maxDate, disableFuture,
  clearable, children, …FieldProps})` and `DateRangePicker({from, to, onChange, …})`. Both render an
  MUI `TextField` as `customInput` with an `MdEvent` adornment (or an `MdClear` when `clearable` and
  set), portal into `#wep-datepicker-portal`, and publish a `useCloseCalendar()` context so
  `children` (footers with shortcut buttons) can close the popover. Formats are module constants:
  `DATE_FORMAT = 'dd.MM.yyyy'`, `DATE_TIME_FORMAT = 'dd.MM.yyyy HH:mm'`.
- `time-input.tsx` — `CalendarTimeInput`, two small `TextField select`s (hours 00-23, minutes in
  5-minute steps), wired in as `customTimeInput`.
- `material-calendar.tsx` — a `<Global>` stylesheet that re-skins react-datepicker to the MUI theme.

`DateTimePicker` (`atoms/dateTimePicker.tsx`) is the form-facing wrapper:

```ts
export interface DateTimePickerProps {
  dateTime: Date | undefined;
  label: string;
  changeDate(publishDate: Date | undefined): void;
  dateRanges?: DateTimePreset[];    // default: Today, Tomorrow
  timeRanges?: DateTimePreset[];    // default: Now
  helpInfo?: string;
  disabled?: boolean;
  helperText?: string;              // also flips the field into the error state
}
```

Used in `eventForm.tsx:131-167` for `startsAt`/`endsAt` and in `publishArticlePanel.tsx:59-63` for
the publish date. The `Controller` bridge is:

```tsx
<Controller
  control={control}
  name="startsAt"
  render={({field, fieldState: {error}}) => (
    <Box>
      <DateTimePicker
        label={t('event.form.startsAt')}
        dateTime={field.value ? new Date(field.value) : undefined}
        changeDate={(date: Date) => field.onChange(date?.toISOString())}
        helperText={error?.message}
      />
    </Box>
  )}
/>
```

i.e. the form value is an **ISO string**, converted at the boundary.

### 10.4 Rich text

`RichTextBlock` (`libs/ui/editor/src/lib/blocks/richTextBlock/rich-text-block.tsx`) is 27 lines: a
`memo` around `RichtextEditor` from `@wepublish/richtext/editor` that forwards
`value`/`autofocus`/`disabled` and maps `onChange({json}) → onChange(json)`. The value type is
`RichtextJSONDocument` (TipTap v3 JSON) from `@wepublish/richtext`, and `RichText` scalars are
already typed as that by codegen.

In a zod schema the field is declared as `z.custom<RichTextBlockValue['richText']>().nullish()`
(goodie, paywall, tag) or `z.custom<RichtextJSONDocument>().nullish()` (event).

The editor draws its own outlined `Paper` surface — never wrap it in a `Card` or a bordered box
(`code-style.md:128-129`).

### 10.5 Searchable selects

`SelectTags` (`libs/ui/editor/src/lib/atoms/tag/selectTags.tsx`, 229 lines) is the reference
implementation and the one an Agenda form would reuse directly:

```ts
interface SelectTagsProps {
  className?: string;
  disabled?: boolean;
  name?: string;
  tagType: TagType;
  defaultTags: Pick<FullTagFragment, 'id' | 'tag'>[];   // labels for ids already selected
  selectedTags?: string[] | null;
  setSelectedTags(tags: string[]): void;
  placeholder?: string;
}
```

It is a MUI `Autocomplete multiple` whose options are tag ids, `filterOptions={options => options}`
(server-side filtering), `onInputChange` refetching `TagList` with `filter: {tag: word, type}`, and a
custom `slots.paper` that appends a `compact` `Pagination` footer. Pre-selected ids whose label is
not on the current page are resolved one-by-one through `TagDocument` with `cache-first`.

`SelectMemberPlans` is the same shape for member plans. Both take a `defaultX` prop carrying the
already-selected entities so the chips show names, not ids — which is why forms keep **both**
`tagIds: string[]` and `tags: {id, tag}[]` in their schema and strip the latter before submitting.

### 10.6 Repeatable rows: the two incompatible mechanisms

**`ListInput`** (`libs/ui/editor/src/lib/atoms/listInput.tsx`, 264 lines) — drag-reorder via
**@dnd-kit** (`DndContext` + `SortableContext` + `verticalListSortingStrategy` + `arrayMove`), a
`MdDragIndicator` handle, a red `MdDelete` per row, and an "add" text button:

```ts
export interface ListValue<T = any> { id: string; value: T }
export interface FieldProps<V = any> { value: V; onChange: Dispatch<SetStateAction<V>> }

export interface ListFieldProps<T = any> extends FieldProps<ListValue<T>[]> {
  label?: string;
  defaultValue: T | (() => T);
  disabled?: boolean;
  children: (props: FieldProps<T>) => JSX.Element;
}

export function useListInputState<T>(
  initialValues: T[],
  onCommit: (values: T[]) => void
): [ListValue<T>[], Dispatch<SetStateAction<ListValue<T>[]>>];
```

Usage (`libs/ui/editor/src/lib/panel/galleryListEditPanel.tsx:64-70`):

```tsx
<ListInput
  value={images}                      // ListValue<GalleryImageEdge>[]
  onChange={images => setImages(images)}
  defaultValue={{image: null, caption: ''}}
>
  {props => <GalleryListItem {...props} />}
</ListInput>
```

Call sites: `galleryListEditPanel.tsx`, `listicleBlock.tsx`, `articleMetadataPanel.tsx` (properties
and authors), `teaserEditPanel.tsx`, `userEditView.tsx:870-921`. **All of them hold the rows in
`useState`, not in a form.** `ListInput` takes `value`/`onChange` of `ListValue<T>[]`, which is not
what `useFieldArray` produces, and nothing in the repo bridges the two.

**`useFieldArray`** — five call sites, all plain (no drag):

| File | Field | UI |
| --- | --- | --- |
| `apps/editor/src/app/routes/paywall/paywallForm.tsx:120-124` | `bypasses` | `append` from a text field + a per-row delete; QR-code dialog per row |
| `apps/editor/src/app/routes/website-settings/website-fonts.tsx:95` | `fonts` | add/remove |
| `apps/editor/src/app/routes/integrations/mailchimpSyncIntegrationForm.tsx:838,847` | two arrays | add/remove |
| `libs/crowdfunding/editor/src/lib/crowdfunding-form.tsx:67-72` | `goals` (`as never`) | rendered by `CrowdfundingGoalList`, with `append` / `remove` / `update` passed down |
| `libs/banner/editor/src/lib/banner-form.tsx:85-89` | `actions` (`as never`) | rendered by `BannerActionList`, with `onAdd` / `onRemove` / `onUpdate` |

The `BannerActionList` pattern (`libs/banner/editor/src/lib/banner-action-list.tsx`, 137 lines) is the
closest thing to "repeatable price rows": a header row of MUI `Grid` labels, one `Grid container` per
row with uncontrolled `TextField`s wired through an `onUpdate(index, {...row, [field]: value})`
callback, a delete `Button` per row and an add `Button` at the bottom. Note it has no `key` on the
row `Grid` (a real bug) and bypasses `Controller` entirely.

**Conclusion for the port:** a sortable, form-bound repeatable row component **has to be written**.
The raw materials are all present — `@dnd-kit/core` ^6.3.1, `@dnd-kit/sortable` ^10.0.0,
`@dnd-kit/utilities` ^3.2.2 are already dependencies, `ListInput` shows the dnd-kit wiring, and
`useFieldArray` exposes a `move(from, to)` that would replace `arrayMove`.

### 10.7 The "main image" star

Nothing like it exists. `MdStar` appears exactly twice in the whole editor, both in `base.tsx` for
the comment-rating nav item. The image gallery (`imageGalleryBlock.tsx` + `galleryListEditPanel.tsx`)
has ordering but no notion of a primary image. The nearest analogue in the data model is the tag
`main` boolean, rendered as a plain `Checkbox` with an `InfoTooltip`
(`apps/editor/src/app/routes/tags/tagForm.tsx:111-131`).

---

## 11. The document-editor shell (blocks, revisions, publishing)

Relevant because the new events must use block content and the draft/pending/published revision
system. The reference implementation is
`apps/editor/src/app/routes/articles/articleEditor.tsx` (1108 lines); `pageEditor.tsx` is its twin.

| Piece | Export | File |
| --- | --- | --- |
| Full-bleed page frame with a sticky header slot | `EditorTemplate({navigationChildren, children, maxWidth})` | `libs/ui/editor/src/lib/atoms/editorTemplate.tsx` |
| The header bar | `EditorHeader({state, stateLabel, meta, back, statusAction, title, secondaryActions, primaryActions})` | `libs/ui/editor/src/lib/atoms/editorHeader.tsx:171-229` |
| Header buttons that collapse to icons by container width | `EditorHeaderButton({label, icon, collapse: 'md'|'sm'|false, variant})` | same file, lines 230-258 |
| The block list | `BlockList({itemId, value, onChange, disabled, blockMap})` | `libs/ui/editor/src/lib/atoms/blockList.tsx:312` |
| The block registry | `BlockMap: BlockMapForValue<BlockValue>` | `libs/ui/editor/src/lib/blocks/blockMap.tsx:60` |
| Block groups for the "add block" menu | `BLOCK_GROUPS = ['text','media','teasers','interaction','layout']` | `libs/ui/editor/src/lib/atoms/blockGroups.ts` |
| Publish dialog | `PublishArticlePanel({publishedAtDate, firstPublishedAtDate, metadata, onClose, onConfirm})` | `libs/ui/editor/src/lib/panel/publishArticlePanel.tsx` |
| Revision list drawer | `VersionHistory`, `VersionHistoryRevision` | `libs/ui/editor/src/lib/panel/versionHistoryPanel.tsx` |
| Revision preview | `RevisionContentPreview` | `libs/ui/editor/src/lib/panel/revisionContentPreview.tsx` |
| Website preview iframe | `PreviewFrame`, `PreviewControls`, `PreviewDevice` | `apps/editor/src/app/previewFrame.tsx` |
| Autosave | `useAutosave`, `useAutosaveEnabled`, `AutosaveToggle`, `LastSavedAt` | `apps/editor/src/app/` |
| Leave guard | `useUnsavedChangesDialog(hasChanges)` | `libs/ui/editor/src/lib/hooks/unsavedChangesDialog.tsx` |
| Pre-publish validation | `EditorValidationProvider`, `useEditorValidation`, `AggregatedValidation` | `libs/ui/editor/src/lib/hooks/useEditorValidation.tsx` |

A block case is declared like this (`blockMap.tsx:61-69`):

```ts
export interface BlockCaseProps<V = any> {
  label: string;                 // i18n key
  icon: ReactElement;
  group: BlockGroup;
  defaultValue: ValueConstructor<V>;
  field: BlockConstructorFn<V>;  // (props: BlockProps<V>) => JSX.Element
  bare?: boolean;                // render without the Card chrome (rich text does)
}
```

and a block's own props are `BlockProps<V> = {itemId?, value, onChange, autofocus?, disabled?,
onReplace?}`.

The header's state chip takes a `StateColor` (`libs/ui/editor/src/lib/utility.ts:171-176`):
`pending | published | draft | none`, each resolving to a `--wep-state-*` CSS variable, with matching
`--wep-state-*-text` for the foreground (`editorHeader.tsx:8-13`).

---

## 12. Design system and theme

### 12.1 MUI only; rsuite is gone

`rsuite` appears nowhere in `package.json` and nowhere in `apps/editor` or `libs/ui`. The only
remaining textual trace is a test name in
`libs/ui/editor/src/lib/drawer/drawer.spec.tsx:88` ("keeps the measurements the named rsuite sizes
had") and the vestigial `IconContext.Provider value={{className: 'rs-icon'}}` in `main.tsx:93`. The
migration is commit `562b8439f5` plus the codemods under `tools/rsuite-to-mui/` and the root
`RSUITE-TO-MUI-MIGRATION.md`.

Current stack: **MUI 9** (`@mui/material ^9.4.0`) + **Emotion 11** + **react-icons 5** (`Md*` only) +
**TanStack Table 8 / Virtual 3** + **react-hook-form 7** + **zod 3** + **@hookform/resolvers 3** +
**react-router-dom 6.30.3** + **Apollo Client 4** + **TipTap 3** + **react-datepicker 9** +
**@dnd-kit** + **@uiw/react-color**.

### 12.2 Styling rules (`.claude/docs/code-style.md`)

| Rule | Detail |
| --- | --- |
| `styled` comes from `@emotion/styled`, **never** `@mui/material` | enforced by `no-restricted-imports`, `eslint.config.mjs:70-87` |
| Theme tokens over literals | `gap: ${({theme}) => theme.spacing(4)};` |
| Export your styled components | tenants and sibling libs target them as selectors |
| Prefer a `css` fragment in an interpolation over a second styled component | |
| No code comments at all, except where the linter or `tsc` needs one | CLAUDE.md + `code-style.md:7-8` |
| **No hard-coded colours in editor UI** | the editor has light and dark; see below |
| Read `theme.vars.palette.*`, never `theme.palette.*` | `theme.palette` is the light scheme frozen at `createTheme` time (`gotchas.md:875-905`) |
| No `theme.palette.mode` to branch on | write the light rule, override under `[data-mui-color-scheme='dark'] &`, or use `theme.applyStyles('dark', {…})` |
| In `sx`, use palette *paths* (`color: 'text.secondary'`); resolve stored paths with `paletteColor(theme, path)` | `libs/ui/editor/src/lib/paletteColor.ts` |
| `theme.shape.borderRadius` is a number typed `number | string` | raw CSS needs `${…}px`; fractional radii need `calc()` |
| A backtick inside a CSS comment ends the Emotion template literal | `gotchas.md:619-640` |
| Icon-only actions are `<IconButton size="small">`, delete adds `color="error"`, always with `IconButtonTooltip` + `aria-label` | |
| Radii: `theme.shape.borderRadius` (8 px) for cards/panels, `calc(… * 0.75)` for controls; in `sx` that is `borderRadius: 1` and `0.75` | |
| `CardContent` inside `CardContent` is a smell | `gotchas.md:786-794` |
| Editor grids use `lg` (1200 px), not `xl` (1536 px) | `gotchas.md:812-824` |
| Form groups space themselves with `spacing={3}`; a child `sx={{marginBottom: 3}}` doubles the gap | `gotchas.md:765-784` |

### 12.3 Where the tokens live

**MUI theme** — `apps/editor/src/app/theme.ts` (276 lines), `createEditorTheme()`:

- `cssVariables: {colorSchemeSelector: 'data-mui-color-scheme'}` and **both** `colorSchemes.light`
  and `colorSchemes.dark` built from one `editorPalette(mode)` function. Switching mode sets the
  root attribute; React never gets a new theme.
- Brand palette: primary `#3498ff`, secondary `#d06ab8` (light `#f8def2`), success `#52ad4a`
  (light `#e1f8de`), warning `#e8a030` (light `#f8efde`), plus a custom `accent`
  (`main #F5FF64`, `light #A4EFEF`).
- Surfaces: light `background.default #f3f4f7` / `paper #ffffff`; dark `#0a0d12` / `#14181f`,
  text `#e9ebf0` / `#a4a9b3` / `#6a6f76`, divider `#3c3f43`.
- `shape.borderRadius: 8`.
- `EDITOR_FONT_FAMILY` = Inter (loaded from Google Fonts in `apps/editor/index.html`), `h1`–`h6`
  sized down with `fontWeight: 650`, buttons `textTransform: 'none'`, weight 600.
- Component defaults that every form inherits: `MuiTextField`, `MuiAutocomplete`, `MuiSelect`,
  `MuiFormControl` all `size: 'small'`; `MuiFormControl` `margin: 'none'`; `MuiCard`
  `variant: 'outlined'`; `MuiAccordion` `variant: 'outlined'`; `MuiListItem` `dense`;
  `MuiButton` `disableElevation`; `MuiButtonBase` `disableTouchRipple`; `MuiPaper`
  `backgroundImage: none`; `MuiDrawer` paper is a flex column; `MuiAlert` gets a hand-written
  light/dark tone table via `theme.applyStyles('dark', …)`.

**Editor-only CSS variables** — `apps/editor/src/app/editorGlobalStyles.tsx` (87 lines), emitted on
`:root` and `:root[data-mui-color-scheme='dark']`:

```
--wep-shell-border          --wep-nav-text            --wep-state-pending
--wep-surface-shadow        --wep-nav-hover-text      --wep-state-published
--wep-elevated-shadow       --wep-nav-hover-bg        --wep-state-draft
                            --wep-nav-active-bg       --wep-state-*-text
                            --wep-nav-active-text     --wep-state-none  (= background.paper)
--wep-row-highlight         --wep-row-approved        --wep-row-pending
--wep-accent-approved       --wep-accent-pending
```

plus `--wep-page-padding-y` / `--wep-page-padding-x`, declared on `ChildrenContainer` in
`base.tsx:395-396`.

A third token layer is the table row-state CSS in `app.tsx:143-214` (the `.highlighted-row`,
`.approved`, `.pending-user`, `.pending-approval`, `.rejected` rules), which consumes the
`--wep-row-*` / `--wep-accent-*` variables.

**Website theming is separate** — `libs/ui/src/lib/theme.tsx` and the tenant apps; the editor's
"Website settings → theme" screen (`apps/editor/src/app/routes/website-settings/theme/`) edits *that*
theme as data, and is not the editor's own chrome.

---

## 13. Testing conventions

- Runner: Vitest everywhere (`apps/editor/vitest.config.ts`,
  `libs/ui/editor/vitest.config.ts`, each `createVitestConfig({name, dir})` from
  `vitest.shared.ts`). Verify a change with `npx nx test editor` / `npx nx test ui-editor` /
  `npx nx test <domain>-editor`.
- Specs sit next to the component as `<name>.spec.tsx`.
- The house style for a view spec is `apps/editor/src/app/routes/tags/tagCreateView.spec.tsx`:
  `vi.mock('@apollo/client/react')` returning a stub `useMutation`/`useQuery`,
  `vi.mock('react-i18next')` whose `t` echoes the key, a partial
  `vi.mock('@wepublish/ui/editor', async importOriginal => …)` to stub `RichTextBlock`, and
  `render(<ThemeProvider theme={createTheme({cssVariables: true})}><MemoryRouter>…`.
  Assertions go through `screen.getByTestId('saveButton')` / `getByLabelText(<i18n key>)`.
- `libs/ui/editor/src/lib/testUtils.ts` exports `wait`, `actWait` and `sessionWithPermissions`
  (an admin session carrying `AllPermissions`) — a panel that calls `useAuthorisation` renders every
  control disabled without an `AuthContext` (`code-style.md:116-118`).
- `apps/editor/__mocks__/react-i18next.ts` is the workspace-wide i18next mock.
- TDD is a CLAUDE.md non-negotiable: write the failing test first.
- Verification command for a change: `npx nx affected -t lint test --uncommitted`, plus
  `npx nx run editor:typecheck` when `apps/` is touched.

---

## 14. Discrepancies between the docs and the code

Recorded because a porter will read `code-style.md` and expect these:

| Claim | Reality |
| --- | --- |
| `code-style.md:85` — "The shared `DataTable` … scales `width` columns to the available width (`listView/fit-column-widths.ts`) and releases `fixed` columns under 600 px" | **No such file exists** in `libs/ui/editor/src/lib/listView/`, and `data-table.tsx` contains no media query, `useMediaQuery` or 600-px logic. The table sets `tableLayout: fixed`, `minWidth: totalWidth` and scrolls horizontally. The advice that follows ("don't hand-tune column widths", "use the shared table") still holds; the mechanism described does not exist. **UNVERIFIED** whether it was removed or never landed. |
| `code-style.md:98` — action columns use `fixed="right"` | `DataTableColumn.fixed` is a `boolean`; every call site writes `fixed: true`. Pinning is always to the right. |
| `code-style.md:94` — `data-on-media` on buttons over an image | No occurrence of `data-on-media` in `libs/ui/editor` or `apps/editor`. `ChooseEditImage` solves the same problem with a translucent black `Actions` pill. **UNVERIFIED.** |
| Agent memory — "Editor command palette (Cmd/Ctrl+K) with a route registry a spec diffs against `app.tsx`" | Does not exist on `master` at `360b36ccb`; see §2.6. |
| `libs/features` registry | Empty (`FEATURES = []`), so `FeatureKey` is `never` and no feature flag can be declared without first adding an entry. |
| Two near-identical `utility.ts` files | `apps/editor/src/app/utility.ts` (209 lines, has `lazyMessage`) and `libs/ui/editor/src/lib/utility.ts` (283 lines, exported through `@wepublish/ui/editor`, has the periodicity helpers). `StateColor`, `generateID`, `isFunctionalUpdate`, `mapTableSortTypeToGraphQLSortOrder`, `DEFAULT_TABLE_PAGE_SIZES` are duplicated in both. |
| `base.tsx:808-812` | The events menu's outer `PermissionControl` lists `CanGetCommentRatingSystem.id` alongside `CanGetEvent.id` — a copy-paste from the comments menu. |
| `base.tsx:835-848` | The `/events/import` nav item is commented out while `app.tsx:594-601` still routes it. |

---

## 15. Porting notes

*Implications, not observations.*

1. **Placement.** An Agenda domain is large enough (list + form + repeatable sub-forms + validation
   queue + blocks) to justify `libs/agenda/editor` rather than `apps/editor/src/app/routes/agenda/`.
   That buys it its own `nx test agenda-editor`, its own lint config with the React Compiler
   diagnostics on, and a `build` target that type-checks it in CI. Copy `libs/crowdfunding/editor`'s
   seven config files verbatim (§1.3) — in particular do **not** copy `libs/event/import/editor`,
   which lacks both the build target and the compiler rules.

2. **The form is settled; write it the goodie way.** zod schema + `z.infer` type exported from the
   form file; `FormProvider` + `useForm` in the create/edit views; `defaultValues` as an async
   `client.query` on edit; `if (form.formState.isLoading) return null`; `mapApiDataToInput` shared by
   the initial fetch and the post-save `reset`; submit destructures display-only fields out;
   `SingleViewTitle` provides both Save buttons as `type="submit"`. Errors as `helperText`, never
   toasts. Messages that need translating go in a `createAgendaSchema(t)` factory.

3. **`useWatch`, never `watch`.** The compiler is on for `apps/editor` and will be on for the new lib;
   `watch('x')` reads once and never again, silently. The same pass also turns `!` assertions inside
   handlers into render-time dereferences.

4. **Two widgets have to be built.**
   - *A sortable, form-bound repeatable row.* Nothing combines `useFieldArray` with drag-reorder
     today. The pieces exist (`ListInput` shows the dnd-kit wiring; `useFieldArray` has `move`), so
     this is a composition job, best done once in `libs/ui/editor` so prices, dates and images all
     use it.
   - *A "main"/primary marker on a row.* No star toggle exists anywhere. The nearest precedent is the
     tag `main` checkbox. For images, note that `ChooseEditImage` is a *single*-image widget with no
     selection state of its own, so the star belongs to the repeatable row, not to the picker.

5. **Dates.** The editor's date stack is react-datepicker, not `@mui/x-date-pickers`, and form values
   are ISO strings converted at the `Controller` boundary. A repeatable "date rows" control would
   wrap `DateTimePicker` (or `DatePicker` + `CalendarTimeInput` if the time is separate) inside the
   new sortable row component. `CalendarTimeInput` is currently only ever rendered inside the
   calendar popover; using it standalone is new but supported by its props.

6. **Filters.** If the Agenda list needs filter fields beyond the closed `Field` union in
   `list-view-filters.tsx`, there are two honest options: extend that shared file (union + the
   `Filter` intersection), or pass a bespoke node to `DataTable`'s `filters` prop the way `tagList`
   and `documentList` do. The second keeps a domain's filters out of a file six other domains share.

7. **Revisions and blocks.** An event that carries block content and a draft/pending/published
   lifecycle is a *document editor*, not a `SingleViewTitle` form. That means `EditorTemplate` +
   `EditorHeader` (state chip, `LastSavedAt`, `AutosaveToggle`, secondary/primary action groups) +
   `BlockList`/`BlockMap` + a publish dialog modelled on `PublishArticlePanel` + `VersionHistory`,
   and a route registered **without** `<Base>` — exactly how `articles/edit/:id` and `pages/edit/:id`
   are registered (`app.tsx:305-311`, `378-385`). The metadata half (name, venue, prices, dates,
   images) would then live in a right-hand `Drawer` the way `ArticleMetadataPanel` does, or the
   screen splits into a metadata form plus a block editor.

8. **Ready-for-review (D5) has a natural home.** `EditorHeader`'s `primaryActions` slot already wraps
   its buttons in `PermissionControl`, and `EditorHeaderButton` already supports a `Badge`. A
   "Ready for review" button shown when `!useHasPermission([CanPublishEvent.id])` and replaced by
   "Review requested on …" once `reviewRequestedAt` is set fits that slot without new chrome.
   Remember `useHasPermission` answers **true** while roles load — for a button whose *absence* is the
   point, prefer deriving from the positive permission so the transient state shows the publish
   control, not both.

9. **Permissions (D4).** The eight new permissions must be added to
   `libs/permissions/src/lib/permissions.ts` *and* to `AllPermissions` and `EditorPermissions`, then
   referenced by `.id` in `createCheckedPermissionComponent` on every Agenda screen and in the nav
   guard in `base.tsx`. Replacing the current events menu is also the moment to drop the stray
   `CanGetCommentRatingSystem.id` from its outer guard.

10. **i18n is enforced.** Every `t('agenda.…')` literal must exist in all three catalogues or
    `locales.spec.ts` fails. Plan the key tree up front; the existing `event.*` tree
    (`create.title`, `delete.{title,body,delete}`, `edit.title`, `form.*` 14 keys, `list.*` 12 keys)
    is the shape to extend or replace. Swiss German, `vous` French, guillemets.

11. **No command palette to register with, no route registry to update.** Adding routes is editing
    `app.tsx`; adding nav is editing `base.tsx`. Both are long hand-maintained files and both are the
    only places a new screen becomes reachable.
