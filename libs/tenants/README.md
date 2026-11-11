# Tenant libraries

Each media house that runs on We.Publish has a Next.js app in `apps/<tenant>`
and a library in `libs/tenants/<tenant>`. The library holds everything that
makes the site look like that tenant. The app holds what only a running Next
site needs.

Splitting them lets a spec render any component as any tenant without
starting Next. That is how we check a tenant's look today, and it is what a
per-tenant component preview will build on.

## What goes where

| In `libs/tenants/<tenant>` | In `apps/<tenant>` |
| --- | --- |
| The theme (`theme.tsx`) and its fonts | `pages/`, including `_app.tsx` and `_document.tsx` |
| Components that override the website builder | `next.config.js`, deployment config, instrumentation |
| Block styles and the tenant's block renderer | `feed.ts`, `sitemap.ts` and other server-only code |
| Global styles, providers the whole site needs | Analytics, tag managers, third-party scripts |
| Translation overrides (`src/locales/*.json`) | `public/`: favicons, `robots.txt`, the web manifest |
| Images the components import | Anything that must stay at a fixed URL |
| The `WebsiteTenantConfig` and the tenant's specs | |

If you aren't sure, ask whether a spec rendering the tenant needs it. If it
does, it belongs in the library.

Each library is an Nx project called `tenant-<tenant>` and is imported as
`@wepublish/tenant/<tenant>`.

## The tenant config

Every library exports one `WebsiteTenantConfig` (from
`@wepublish/website/builder`), named `<tenant>Tenant`:

| Field | What it is |
| --- | --- |
| `id`, `name` | The library's folder name and the display name |
| `createTheme(settingsTheme?)` | Returns the MUI theme. Most tenants ignore the argument. factuel, ganzgraz and munotgloeggli merge the theme from their Website Settings on top of their own; their specs pass the snapshot in `src/fixtures/website-settings.json` |
| `builder` | Everything the app used to pass to `WebsiteBuilderProvider`: component overrides, `blocks`, `blockStyles`, `elements`, `richtext`, `date.format`, `meta.siteTitle` |
| `blockStyles` | Optional. Every block style name the tenant handles, so specs can cover each one |
| `translations.lng` | The site's language, `de` or `fr` |
| `translations.overrides` | Optional. Per language, the keys that differ from the base catalogs in `libs/website/translations` |
| `dateLocale` | The date-fns locale |
| `GlobalStyles` | Optional. Rendered once, right after `CssBaseline` |
| `Wrapper` | Optional. A provider that wraps the whole page, such as hauptstadt's font size provider |

`Head`, `Script` and `thirdParty` (the Stripe key, for example) are not part
of the config, because they come from Next or from the environment.

## How the app uses it

`_app.tsx` sets the date locale and the translations from the config at module
level, then wraps the page in `TenantProviders` from `@wepublish/website`:

```tsx
setDefaultOptions({ locale: reflektTenant.dateLocale });
initWePublishTranslator(
  reflektTenant.translations.overrides?.[reflektTenant.translations.lng]
);

<AppCacheProvider emotionCache={cache}>
  <TenantProviders
    config={reflektTenant}
    extra={{ Head, Script }}
  >
    ...
  </TenantProviders>
</AppCacheProvider>
```

`TenantProviders` renders the theme, `WebsiteProvider`,
`WebsiteBuilderProvider` (the config's `builder` plus `extra`), the `Wrapper`,
`CssBaseline` and `GlobalStyles`, in that order. Pass `settingsTheme` when the
tenant builds its theme from Website Settings. Analytics, the navbar, the
footer and the page layout stay in `_app.tsx`.

In a spec, `renderWithProviders(ui, { tenant: reflektTenant })` from
`@wepublish/mocks/website` builds the same stack from the same config, so
the spec sees what the site shows. Translation overrides load asynchronously:
call `await applyTenantTranslations(reflektTenant)` in `beforeAll` and
`await resetTranslations()` in `afterAll`.

## Images and fonts

Code in the library can't rely on `public/` URLs, because specs render it
outside the app and there is no `public/` folder there. Import the file
instead:

- Images go in `src/assets` and are imported. Next returns `{ src }` for an
  image import and Vitest returns a string, so read it through
  `staticImageSrc(image)` from `src/assets/static-image.ts`.
- Fonts used by `next/font/local` live next to the theme, because the theme
  loads them by relative path. Once moved, they are no longer served at
  `/fonts/...`.
- Favicons and anything else that needs a fixed URL stay in the app's
  `public/`.

## Moving files

Move files from an app into its library with `git mv`, never with a plain
`mv`, so `git log --follow` and blame keep their history. Edit after the move,
not before. Leave a copy in `public/` when something outside the library still
links to the file by URL.

## Adding a tenant

1. Copy the setup files of an existing library (reflekt is a clean one):
   `project.json` (rename it to `tenant-<tenant>`), `package.json` (name
   `@wepublish/tenant/<tenant>`), `tsconfig*.json`, `eslint.config.mjs` and
   `vitest.config.ts`.
2. Add the `@wepublish/tenant/<tenant>` path to `tsconfig.base.json` and the
   library to the `@nx/eslint/plugin` include list in `nx.json`.
3. `git mv` the theme, components, block styles, locales and assets out of the
   app.
4. Write `src/<tenant>-tenant.tsx` with the config and export it, plus whatever
   the app's pages still import, from `src/index.ts`. Write the specs first:
   one for the config, and an `index.spec.ts` that imports the entry, which
   catches circular imports that crash with "Cannot access 'X' before
   initialization".
5. Switch `_app.tsx` to `TenantProviders`. If the theme uses a MUI module
   augmentation, add the library's `.d.ts` to the app's `tsconfig.json`.
6. Write `src/<tenant>.spec.tsx`, which renders a page as the tenant. Copy
   `reflekt.spec.tsx`: it checks the fonts and primary colour, a translation
   override, the logo, the footer and the tenant's own blocks.
7. Add `src/locales` to the i18n-ally paths in `.vscode/settings.json`.

Then run the checks:

```sh
pnpm nx test tenant-<tenant>
pnpm nx lint tenant-<tenant>
NODE_OPTIONS=--max-old-space-size=6144 pnpm tsc -p ./apps/<tenant> --noEmit
```

Don't import the `@wepublish/utils/website` barrel from tenant code. It pulls
in server-only modules. Use
`@wepublish/utils/website/link` for `NextWepublishLink`.

## Tenants

| Library | Name | Language |
| --- | --- | --- |
| `babanews` | baba news | de |
| `bajour` | Bajour | de |
| `cultur` | Cültür | de |
| `eenews` | ee-news | de |
| `factuel` | Courant (factuel) | fr |
| `fazetten` | Fazetten | de |
| `flimmer` | Flimmer | de |
| `ganzgraz` | ganzgraz | de |
| `gruppetto` | Gruppetto | de |
| `hauptstadt` | Hauptstadt | de |
| `mannschaft` | Mannschaft | de |
| `munotgloeggli` | Munotglöggli | de |
| `onlinereports` | OnlineReports | de |
| `reflekt` | Reflekt | de |
| `tsri` | Tsüri | de |
| `wepublish-site` | We.Publish Website | de |
| `wnti` | WNTI | de |
| `zwoelf` | Zwölf | de |

demo, kunstbulletin, mediamakerscamp, neuewege and website-example have no
library. They build their theme from Website Settings on top of
`minimalTheme`. Tenants whose theme comes from Website Settings (factuel,
ganzgraz, munotgloeggli) keep a snapshot of it in
`src/fixtures/website-settings.json`; their specs build the theme with
`createTheme(websiteSettings.theme)` from it.
