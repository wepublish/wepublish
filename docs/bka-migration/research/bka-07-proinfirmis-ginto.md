# BKA migration research 07 — ProInfirmis (ZUERST) accessibility integration and its Ginto successor

**Scope.** This document describes, end to end, the Pro Infirmis accessibility integration in
`/Users/itrulia/Documents/insitu-admin` (Symfony 6.4 / API Platform / Doctrine) and the half-finished
migration to its successor, the Ginto GraphQL API. It covers every file under `src/ProInfirmis/`, the
`app:place:proinfirmis-update` console command, the `ProInfirmisHttpClient` test, the `ACTIVATE_PROINFIRMIS`
and `ACTIVATE_GINTO` feature flags, the `ginto_rating_legacy_ids` service parameter, the three
`place.pro_infirmis_*` columns, the admin form surface, the `accessibility_proinfirmis[]` public API filter,
the real data in the restored BKA production database, the ZUERST→Ginto data contract, and the ZUERST
shutdown timeline. Everything is grounded in a file path, a SQL result, an HTTP response, or the official
Ginto documentation; anything I could not establish is explicitly marked **UNVERIFIED**. A short, clearly
separated *Porting notes* section is at the end.

> **Headline finding:** the Ginto implementation is **not in `main`**. It exists only as an unmerged stash
> commit on the local branch `f/lab-insitu-386` (`e46121b`, 2026-10-16, Karl Merkli, 9 files, +607 lines).
> `main`'s working tree carries only the *documentation* half of that work (modified `README.md` and `.env`).
> `config/services.yaml` on `main` has **no** `ginto_rating_legacy_ids` parameter, and even on the branch
> that parameter is an **empty map `{}`** — the pictogram-id ↔ Ginto-rating-key mapping **has never been
> filled in**, because it requires a live Ginto API key that nobody has yet.

---

## 1. Status at a glance

| Thing | Where it lives | State |
| --- | --- | --- |
| ZUERST HTTP client | `src/ProInfirmis/ProInfirmisHttpClient.php` | in `main`, working |
| 24 h cache wrapper | `src/ProInfirmis/ProInfirmisAPICacheManager.php` | in `main`, cache pool is *not* functional in the local BKA deployment (see §9) |
| Detail-URL sync command | `src/Command/PlaceProinfirmisUpdateCommand.php` | in `main` |
| Smoke test | `tests/HttpClient/ProInfirmisHttpClientTest.php` | in `main`, asserts only `assertIsArray()` |
| Admin form field | `src/Form/PlaceType.php`, `templates/includes/form/place_form.html.twig:51-53` | in `main`, gated by `ACTIVATE_PROINFIRMIS` |
| DB columns | `place.pro_infirmis_id_source`, `.pro_infirmis_detail_url`, `.pro_infirmis_pictograms` | in `main` (3 migrations) |
| Public API output | `src/Entity/Place.php` (v1, group `reader`), `src/ApiResource/PlaceApi.php` + `src/Mapper/PlaceEntityToApiMapper.php` (v2) | in `main` |
| `accessibility_proinfirmis[]` filter | `src/ApiPlatform/OccurrenceExtension.php:402-418`, `src/Repository/EventRepository.php:246-254`, `src/Repository/EventOccurrenceRepository.php:250-258` | in `main`, **MySQL-only SQL → broken on the Postgres production DB** (§8.3) |
| Ginto GraphQL client, normaliser, id map, data provider, `app:ginto:ratings` command, unit test, `docs/ginto-migration/api-key-request.md` | branch `f/lab-insitu-386` only | **unmerged**, untested against the live API |
| `ACTIVATE_GINTO` / `GINTO_*` env vars | `.env:58-65` (uncommitted working-tree change on `main`) | declared, all blank, `ACTIVATE_GINTO=false` |
| `ginto_rating_legacy_ids` | `config/services.yaml` on branch `f/lab-insitu-386` only | **empty `{}`** — mapping never produced |

Git context (the repo history was squashed):

```
$ git log --format="%h %ad %an %s" --date=short -- src/ProInfirmis/ src/Command/PlaceProinfirmisUpdateCommand.php
36d20d2 2026-01-21 Elias Summermatter Initial commit

$ git log --format="%h %ad %an %s" --date=iso -1 f/lab-insitu-386
e46121b 2026-10-16 19:18:57 +0200 Karl Merkli stash

$ git diff --stat main...f/lab-insitu-386
 config/services.yaml                            |  11 ++
 docs/ginto-migration/api-key-request.md         |  47 +++++++
 src/Command/GintoRatingsCommand.php             |  56 ++++++++
 src/ProInfirmis/GintoDataProvider.php           |  29 +++++
 src/ProInfirmis/GintoHttpClient.php             | 166 ++++++++++++++++++++++++
 src/ProInfirmis/GintoLegacyNormalizer.php       | 152 ++++++++++++++++++++++
 src/ProInfirmis/GintoRatingLegacyIdMap.php      |  41 ++++++
 src/ProInfirmis/ProInfirmisAPICacheManager.php  |  19 ++-
 tests/ProInfirmis/GintoLegacyNormalizerTest.php |  90 +++++++++++++
 9 files changed, 607 insertions(+), 4 deletions(-)
```

`docs/ginto-migration/` does **not** exist in the `main` working tree (`ls docs/` → `.gitignore`,
`affiliations.sql`, `audiences.sql`, `categories.sql`, `regions.sql`). It exists only on the branch.

---

## 2. What the integration does, end to end

```
                         ┌──────────────────────────────────────────────┐
  once per 24 h (cache)  │ GET https://zuerst.proinfirmis.ch            │
  ─────────────────────► │     /api/v1/tasks/exportpois?key=…&format=json│
                         └───────────────────┬──────────────────────────┘
                                             │  { "Pictograms": [...], "Pois": [...] }
                                             ▼
                      ProInfirmisHttpClient ──► ProInfirmisAPICacheManager
                                  (pool `pro_infirmis_cache`, TTL 86 400 s, key `pro_infirmis_get_data`)
                                             │
                     ┌───────────────────────┴────────────────────────┐
                     ▼                                                ▼
   PlaceType::buildForm()                              PlaceProinfirmisUpdateCommand
   • builds a <select> of  Name => IdSource            (`app:place:proinfirmis-update`)
     from data['Pois']                                 • for every Place with a non-empty
   • shown only if ACTIVATE_PROINFIRMIS                  pro_infirmis_id_source, re-writes
                     │                                   pro_infirmis_detail_url from
                     ▼                                   the matching Poi's LinkToDetailView
   PlaceType POST_SUBMIT listener
   • finds the Poi whose IdSource == place.proInfirmisIdSource
   • collects the Pictograms whose Id ∈ Poi.PictogramIds
   • writes place.pro_infirmis_pictograms  (full pictogram objects, JSON)
   • writes place.pro_infirmis_detail_url  (Poi.LinkToDetailView)
                     │
                     ▼
            place table (Postgres, 3 columns)
                     │
        ┌────────────┴──────────────────────────────┐
        ▼                                           ▼
  Public API output                           Event search filter
  • v1  /api/v1/places/…  group `reader`       `accessibility_proinfirmis[]=8&…`
        snake_case keys                        OR-matched against
  • v2  /api/v2/places/{slug} (read-item)      place.proInfirmisPictograms[].Id
        /api/v2/events/{…}    (read-item)      via MySQL JSON_CONTAINS(JSON_EXTRACT(…))
```

Three things are worth stating up front, because they are easy to get wrong when porting:

1. **The integration is read-only and denormalising.** Nothing is ever pushed to Pro Infirmis. The whole
   pictogram object (including the German/French/Italian/English names and the two image URLs) is copied
   into the `place` row as JSON. There is no local pictogram catalogue table.
2. **Pictograms are only ever written by the admin form.** The console command refreshes *only* the detail
   URL. If a ZUERST POI changes its pictograms, the stored copy in `place.pro_infirmis_pictograms` goes
   stale until somebody re-saves the place in the admin.
3. **Nothing in the admin UI ever renders a pictogram.** `grep -rn -i "pictogram" templates/ assets/ themes/`
   returns nothing. The pictograms exist purely to be served to API consumers (the public front-ends) and
   to drive the `accessibility_proinfirmis[]` filter.

---

## 3. File-by-file inventory

### 3.1 `src/ProInfirmis/ProInfirmisHttpClient.php` (37 lines, complete)

```php
readonly class ProInfirmisHttpClient
{
    public function __construct(private HttpClientInterface $httpClient, private LoggerInterface $logger, private string $proinfirmisKey)
    {
    }

    public function getData(): array
    {
        try {
            $response = $this->httpClient->request(
                'GET',
                'https://zuerst.proinfirmis.ch/api/v1/tasks/exportpois?key='.$this->proinfirmisKey.'&format=json'
            );

            $statusCode = $response->getStatusCode();

            if (Response::HTTP_OK === $statusCode) {
                return $response->toArray();
            } else {
                $this->logger->error('Error getting data from ProInfirmis API. Status code : '.$response->getStatusCode());
            }
        } catch (TransportExceptionInterface $e) {
            $this->logger->warning('Error getting data from ProInfirmis API. Status code : '.$e->getMessage().$e->getTraceAsString());
        }

        return [];
    }
}
```

* Single endpoint, `GET`, key in the **query string** (not a header), `format=json`.
* `$proinfirmisKey` is bound in `config/services.yaml:24` → `$proinfirmisKey: '%env(PROINFIRMIS_KEY)%'`.
* Any non-200 is logged at `error` and yields `[]`. A transport failure is logged at `warning` and yields `[]`.
* **No timeout, no retry, no pagination** — the entire POI export is one response.

### 3.2 `src/ProInfirmis/ProInfirmisAPICacheManager.php` (26 lines, complete, `main` version)

```php
class ProInfirmisAPICacheManager
{
    private int $expirationSecond = 86400;

    public function __construct(private readonly ProInfirmisHttpClient $httpClient, private readonly CacheInterface $proInfirmisCache)
    {
    }

    public function getData(): array
    {
        return $this->proInfirmisCache->get('pro_infirmis_get_data', function (ItemInterface $item) {
            $item->expiresAfter($this->expirationSecond);

            return $this->httpClient->getData();
        });
    }
}
```

* Cache key `pro_infirmis_get_data`, TTL `86400` s (24 h), hard-coded.
* `$proInfirmisCache` is autowired from the named pool declared in `config/packages/cache.yaml:20-22`:

```yaml
        pools:
            pro_infirmis_cache:
                adapter: cache.adapter.memcached
```

* **There is no memcached service** in `docker-compose.yaml` and no `default_memcached_provider` anywhere in
  `config/`. The PHP `memcached` extension *is* installed (`Dockerfile:59-64`). The practical consequence is
  measured in §9: the cache never hits, so every place form render performs a live HTTP request.

### 3.3 `src/Command/PlaceProinfirmisUpdateCommand.php` (79 lines, complete)

```php
#[AsCommand(
    name: 'app:place:proinfirmis-update',
    description: 'Update ProInfirmis information from API',
)]
class PlaceProinfirmisUpdateCommand extends Command
{
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $data = $this->proInfirmisAPICacheManager->getData();

        if (!array_key_exists('Pictograms', $data) || !array_key_exists('Pois', $data)) {
            $io->error('Cannot read ProInfirmis data...');
            return Command::FAILURE;
        }

        $infirmisPlaces = $data['Pois'];
        $places = $this->placeRepository->findAll();

        foreach ($places as $place) {
            // In case ProInfirmis place is set we have to sync detail URL
            if ($place->getProInfirmisIdSource()) {
                $proInfirmisPlace = $this->findProInfimisPlaceById($place->getProInfirmisIdSource(), $infirmisPlaces);

                if ($proInfirmisPlace) {
                    $place->setProInfirmisDetailUrl($proInfirmisPlace['LinkToDetailView']);
                    $this->placeRepository->add($place, true);   // persist + flush, per place
                }
            }
            $progressBar->advance();
        }

        return Command::SUCCESS;
    }

    private function findProInfimisPlaceById(string $idSource, array $infirmisPlaces): ?array
    {
        foreach ($infirmisPlaces as $place) {
            if ($idSource === $place['IdSource']) {   // strict string comparison
                return $place;
            }
        }
        return null;
    }
}
```

Behavioural notes:

* Guards on the presence of **both** `Pictograms` and `Pois` keys even though it only uses `Pois`.
* `findAll()` loads **every** place into memory (1 276 rows on BKA, 642 on In Situ) and flushes **per place**
  (`PlaceRepository::add($place, true)` at `src/Repository/PlaceRepository.php:29-36`).
* Matching is a **strict `===` string comparison** against `Pois[].IdSource`, O(places × pois).
* It **never touches `pro_infirmis_pictograms`** and never clears a stale `pro_infirmis_detail_url` when the
  POI disappears from the export.
* There is **no scheduler**. `grep -rn "app:place\|cron" docker/ Dockerfile .github/` returns nothing, and
  `config/packages/` contains no `scheduler.yaml`. `docker/entrypoint.sh` runs migrations + cache warmup only.
  → **How often the command actually runs in production is UNVERIFIED** (it is presumably an external
  Kubernetes CronJob or a manual run; nothing in this repository schedules it).

### 3.4 `tests/HttpClient/ProInfirmisHttpClientTest.php` (21 lines, complete)

```php
class ProInfirmisHttpClientTest extends KernelTestCase
{
    public function testClient(): void
    {
        self::bootKernel();
        $container = static::getContainer();
        $httpClient = $container->get(ProInfirmisHttpClient::class);
        $data = $httpClient->getData();
        $this->assertIsArray($data);
    }
}
```

This is a **live network test with no mock and no meaningful assertion** — `getData()` returns `[]` on every
error path, so the test passes whether or not ZUERST is reachable, and whether or not the key is valid. It
contributes nothing to the contract.

---

## 4. The ZUERST API contract (v1 `exportpois`)

### 4.1 Request

| Property | Value |
| --- | --- |
| Method | `GET` |
| URL | `https://zuerst.proinfirmis.ch/api/v1/tasks/exportpois` |
| Query | `key={PROINFIRMIS_KEY}` · `format=json` |
| Auth | API key in the query string; no header |
| Pagination | none — one full export per call |
| Content type | `application/json` |

Live probe run on 2026-10-17 (empty key):

```
$ curl -s -i --max-time 20 "https://zuerst.proinfirmis.ch/api/v1/tasks/exportpois?key=&format=json" | head
HTTP/2 404
server: Microsoft-IIS/10.0
x-aspnet-version: 4.0.30319
x-powered-by: ASP.NET
content-security-policy: frame-ancestors *.proinfirmis.ch https://www.bureau-relief.ch
x-frame-options: ALLOW-FROM https://zuerst-map.proinfirmis.ch
date: Sat, 17 Oct 2026 16:27:40 GMT
content-length: 0
```

The ZUERST host is still alive (ASP.NET / IIS 10). An invalid/empty key returns **`404` with an empty body**,
which the client turns into a logged `error` plus `[]`.

### 4.2 Response envelope

The code only ever reads two top-level keys:

```jsonc
{
  "Pictograms": [ /* the catalogue, see §5 */ ],
  "Pois":       [ /* the points of interest */ ]
}
```

(`src/Command/PlaceProinfirmisUpdateCommand.php:31`, `src/Form/PlaceType.php:65` and `:305`.)

### 4.3 `Pois[]` — fields this application consumes

| Field | Type | Used by | Purpose |
| --- | --- | --- | --- |
| `IdSource` | string | `PlaceType.php:67-68`, `PlaceProinfirmisUpdateCommand.php:72` | the join key against `place.pro_infirmis_id_source` |
| `Name` | string | `PlaceType.php:68` | the label in the admin `<select>` |
| `PictogramIds` | int[] | `PlaceType.php:315-321` | which catalogue entries to copy into the place |
| `LinkToDetailView` | string (URL) | `PlaceType.php:327`, `PlaceProinfirmisUpdateCommand.php:53` | stored in `place.pro_infirmis_detail_url` |

### 4.4 `Pois[]` — the full v1 field list

Not read by this application, but documented authoritatively by Ginto's migration table
(<https://about.ginto.guide/course/api-migrate-from-zuerst-to-ginto>, "API - Code anpassen"), reproduced here
verbatim because the port needs to know what the legacy shape was:

| ZUERST v1 field | Ginto equivalent |
| --- | --- |
| `Pois[].Id` | `data.entriesByFilter.nodes[].zuerst.originIds` |
| `Pois[].IdSource` *(v1 only)* | `data.entriesByFilter.nodes[].sources[].originIds` — "choose the right source and check whether the ZUERST `IdSource` is contained in Ginto's `originIds`" |
| `Pois[].Sources[].SourceName` *(v2 only)* | `data.entriesByFilter.nodes[].sources[].sourceKey` |
| `Pois[].Sources[].SourcePoiId` *(v2 only)* | `data.entriesByFilter.nodes[].sources[].originIds` — "in Ginto one entry can represent several source POIs" |
| `Pois[].Name` | `nodes[].name` |
| `Pois[].EntryDate` | `nodes[].updatedAt` |
| `Pois[].Coordinates.Lat` | `nodes[].position.lat` |
| `Pois[].Coordinates.Lng` | `nodes[].position.lng` |
| `Pois[].Address.Street` | `nodes[].position.street` |
| `Pois[].Address.Number` | `nodes[].position.housenumber` |
| `Pois[].Address.ZipCode` | `nodes[].position.postcode` |
| `Pois[].Address.City` | `nodes[].position.city` |
| `Pois[].Category` | `nodes[].categories` (see category table, §12.4) |
| `Pois[].MainEnquiryCategory` | `nodes[].categories` |
| `Pois[].PictogramIds` | `nodes[].accessibilityInfo.defaultRatings` |
| `Pois[].MainComment` / `MainCommentFr` / `MainCommentIt` / `MainCommentEn` | **not available in Ginto** |
| `Pois[].LinkToDetailView` | `nodes[].publication.linkUrl` |
| `Pois[].AdditionalInformation` | **not available in Ginto** |
| `Pois[].SubPois` | **not available in Ginto** |

### 4.5 `Pictograms[]` — the object shape

Documented in three independent places that agree exactly, and confirmed by the live data:

* `src/Entity/Place.php:131-143` (`#[OA\Property]` on the column)
* `src/ApiResource/PlaceApi.php:151-179` (`#[ApiProperty(example: …, openapiContext: …)]`)
* `public/openapi.yaml:1309-1328`

```jsonc
{
  "Id":                 8,                                     // int (openapi.yaml wrongly says "string")
  "Name":               "Eingeschränkt rollstuhlgängig",       // German
  "NameFr":             "Partiellement accessible en fauteuil roulant",
  "NameIt":             "Parzialmente accessibile in sedia a rotelle",
  "NameEn":             "Partially wheelchair-accessible",
  "LinkToPictogram":    "https://zuerst.proinfirmis.ch/Pictograms/08_eingeschraenkt_zugaenglich.jpg",
  "LinkToPictogramSvg": "https://zuerst.proinfirmis.ch/Pictograms/svg/08_eingeschraenkt_zugaenglich.svg",
  "PictogramFileName":  "08_eingeschraenkt_zugaenglich.jpg"
}
```

Note the inconsistency: `src/ApiResource/PlaceApi.php:168` declares `'Id' => ['type' => 'number']` while
`public/openapi.yaml:1313-1314` declares `Id: {type: string}`. The actual stored values are JSON integers
(verified in §7.2), and `src/ApiPlatform/OccurrenceExtension.php:405` casts the filter input to `int`.

---

## 5. The full pictogram catalogue

There is **no catalogue table in the database and no hard-coded catalogue in the code** — the catalogue only
ever lives inside the ZUERST response and inside the copies denormalised into `place.pro_infirmis_pictograms`.
The table below is assembled from three evidence sources:

* **(A)** every distinct pictogram object found in the In Situ production dump
  (`/Users/itrulia/Documents/insitu-admin/insitu.dump`, table `place`, 19 rows with non-empty pictograms) —
  these are complete, verbatim ZUERST objects;
* **(B)** `alt`/`title` text scraped from live ZUERST POI detail pages (`GET https://zuerst.proinfirmis.ch/pois/detail/{id}` for the 17 POI ids referenced by In Situ places, 2026-10-17);
* **(C)** direct `HEAD`-style probes of `https://zuerst.proinfirmis.ch/Pictograms/{file}` for filenames that
  (A) and (B) did not surface.

| Id | `PictogramFileName` | German `Name` | French `NameFr` | Italian `NameIt` | English `NameEn` | Evidence |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | `01_voll_zugaenglich.jpg` | Rollstuhlgängig | Accessible en fauteuil roulant | Accessibile in sedia a rotelle | Wheelchair-accessible | A, B |
| 2 | `02_rollstuhl_wc.jpg` | WC rollstuhlgängig | Toilettes accessibles en fauteuil roulant | WC accessibile in sedia a rotelle | Toilets wheelchair-accessible | A, B |
| 3 | `03_behindertenparkplatz.jpg` | Parkplatz rollstuhlgängig | Place de parc accessible en fauteuil roulant | Parcheggio accessibile in sedia a rotelle | Parking place wheelchair-accessible | A, B |
| 4 | `04_hoerbehinderung.jpg` | *(UNVERIFIED — likely "Anlagen / Einrichtungen für Menschen mit Hörbehinderung")* | — | — | — | C only |
| 5 | `05_induktionsschleife.jpg` | Induktionsschleife vorhanden | Boucle magnétique | Sistema a induzione magnetica | Magnetic loop | A, B |
| 6 | `06_gebaerdensprache.jpg` | Angebot in Gebärdensprache | Offre en langue des signes | Offerta nella lingua dei segni | Offer in sign language | A, B |
| 7 | `07_gehbehinderung.jpg` | *(UNVERIFIED — likely "… für Menschen mit Gehbehinderung")* | — | — | — | C only |
| 8 | `08_eingeschraenkt_zugaenglich.jpg` | Eingeschränkt rollstuhlgängig | Partiellement accessible en fauteuil roulant | Parzialmente accessibile in sedia a rotelle | Partially wheelchair-accessible | A, B |
| 9 | `09_rollstuhl_wc_eingeschraenkt.jpg` | WC eingeschränkt rollstuhlgängig | Toilettes partiellement accessibles en fauteuil roulant | WC parzialmente accessibile in sedia a rotelle | Toilets partially wheelchair-accessible | A, B |
| 10 | `10_behindertenparkplatz_eingeschraenkt.jpg` | Parkplatz eingeschränkt rollstuhlgängig | Place de parc partiellement accessible en fauteuil roulant | Parcheggio parzialmente accessibile in sedia a rotelle | `Parking place partially wheelchair-accessible ` *(trailing space in the real data)* | A, B |
| 11 | `11_sehbehinderung.jpg` | Anlagen / Einrichtungen für Menschen mit Sehbehinderung | *(UNVERIFIED)* | *(UNVERIFIED)* | *(UNVERIFIED)* | B |
| 12 | `12_geistige_behinderung.jpg` | Angebot für Menschen mit kognitiver Beeinträchtigung | *(UNVERIFIED)* | *(UNVERIFIED)* | *(UNVERIFIED)* | B |
| 13 | **unknown** | — | — | — | — | not found |
| 14 | **unknown** | — | — | — | — | not found |
| 15 | `15_nicht_zugaenglich.jpg` | Nicht rollstuhlgängig | Non accessible en fauteuil roulant | Non accessibile in sedia a rotelle | Not wheelchair-accessible | A, B |
| 16 | `16_rollstuhl_wc_nicht_zugaenglich.jpg` | WC nicht rollstuhlgängig | Toilettes non accessibles en fauteuil roulant | WC non accessibile in sedia a rotelle | `Toilets not wheelchair-accessible ` *(trailing space)* | A, B |
| 17 | `17_keine_behindertenparkplaetze.jpg` | Parkplatz nicht rollstuhlgängig | Pas de places de stationnement accessibles | Parcheggio non accessibile in sedia a rotelle | `Parking place not wheelchair-accessible ` *(trailing space)* | A, B |

**UNVERIFIED items:** ids 4 and 7 exist as image files on the ZUERST CDN but no POI I inspected carries them,
so their exact `Name`/`NameFr`/`NameIt`/`NameEn` strings and their numeric ids (I am inferring id = filename
prefix, which holds for all 11 verified rows) are **not proven**. Ids 13 and 14 could not be found at all —
they may be retired or may never have existed. A single authenticated `exportpois` call with the real
`PROINFIRMIS_KEY` would settle the whole table in one shot; the `Pictograms` array is the catalogue.

The structural logic of the catalogue is a 3×3 grid plus extras:

| | accessible | partially accessible | not accessible |
| --- | ---: | ---: | ---: |
| venue | **1** | **8** | **15** |
| toilets | **2** | **9** | **16** |
| parking | **3** | **10** | **17** |

plus **5** induction loop, **6** sign language, **11** visual impairment, **12** cognitive impairment, and the
unconfirmed **4** (hearing) / **7** (mobility).

### 5.1 Real-world frequency (In Situ production dump, 19 places with pictograms)

```
Id   places
 1     4
 2     3
 3     6
 5     5
 6     2
 8     9
 9    10
10    10
15     6
16     5
17     3
```

Observed combinations (a place carries 2–4 pictograms):

```
(8,9,10) ×2   (3,5,8,9) ×2   (10,15,16) ×2   (1,2,5,10) ×2
(6,8,9,10)    (2,3,8)        (15,16,17)      (9,10,15)
(8,10)        (9,15,17)      (5,8,10,16)     (1,3,9)
(3,6,8,9)     (1,9,17)       (3,15,16)
```

Ids **4, 7, 11, 12, 13, 14 appear in zero In Situ places**; 11 and 12 only turned up on ZUERST's own POI pages.

---

## 6. How a Place is matched to a ProInfirmis entry

The join is **manual, one-off and human-curated**. There is no geocoding, name-similarity or address matching
anywhere in the codebase.

1. The admin opens *Orte / Lieux → edit* and picks an entry from a `<select>` whose **options are the entire
   ZUERST POI list**: option label = `Pois[].Name`, option value = `Pois[].IdSource`
   (`src/Form/PlaceType.php:61-71`):

   ```php
   $proInfirmisChoices = [$this->translator->trans('place.proInfirmisIdSource._placeholder') => ''];
   $data = $this->proInfirmisAPICacheManager->getData();

   if (array_key_exists('Pois', $data)) {
       foreach ($data['Pois'] as $place) {
           if (array_key_exists('IdSource', $place)) {
               $proInfirmisChoices[$place['Name']] = $place['IdSource'];
           }
       }
   }
   ```

   Note that the array is keyed by `Name`, so **two POIs with the same name silently collapse into one option**.

2. The chosen value is persisted verbatim into `place.pro_infirmis_id_source` (`varchar(24)`).

3. Every later lookup is an exact string match on that value — `array_search(..., array_column($allPlaces, 'IdSource'))`
   in the form (`PlaceType.php:309`) and `$idSource === $place['IdSource']` in the command
   (`PlaceProinfirmisUpdateCommand.php:72`).

### 6.1 What `IdSource` actually contains

This is important and non-obvious. In the In Situ production dump, the stored `pro_infirmis_id_source` values
are **small integers that frequently equal the In Situ `place.id` itself**:

| place.id | place.name | `pro_infirmis_id_source` | `pro_infirmis_detail_url` |
| ---: | --- | ---: | --- |
| 1 | Centre Culturel Ebullition | 1 | `…/pois/detail/21165` |
| 23 | Salle CO2 | 23 | `…/pois/detail/21262` |
| 31 | Théâtre des Osses | *(empty)* | `…/pois/detail/22801` |
| 34 | Kunsthalle Friart Fribourg | *(empty)* | `…/pois/detail/22842` |
| 46 | La Spirale | 28 | `…/pois/detail/22792` |
| 55 | Atelier Tramway | *(empty)* | `…/pois/detail/22821` |
| 56 | Bad Bonn | 24 | `…/pois/detail/22796` |
| 61 | SwissBierMuseum Cardinal Fribourg | 61 | `…/pois/detail/25360` |
| 63 | smem | *(empty)* | `…/pois/detail/22913` |
| 65 | Fri-Son | *(empty)* | `…/pois/detail/21262` |
| 69 | Le Nouveau Monde | *(empty)* | `…/pois/detail/22795` |
| 75 | Salle de la Prillaz | 75 | `…/pois/detail/22869` |
| 89 | MEMO - biblio&ludo+ | 35 | `…/pois/detail/22827` |
| 109 | Le Point Commun | 139 | `…/pois/detail/22809` |
| 139 | Théâtre Equilibre | 139 | `…/pois/detail/22809` |
| 170 | L'azimut // Salle de spectacle | *(empty)* | `…/pois/detail/22794` |
| 274 | Nuithonie | 274 | `…/pois/detail/22873` |
| 284 | Musée gruérien et Bibliothèque de Bulle | 284 | `…/pois/detail/17607` |
| 308 | Tibet Museum | 308 | `…/pois/detail/17918` |

Conclusions, all directly observable in that table:

* **`IdSource` is the *source system's* id, i.e. In Situ's own place id**, which Pro Infirmis stores against
  the POI. It is **not** the ZUERST POI id — that one appears in the detail URL path
  (`/pois/detail/21165`), a completely different number space.
* The relation is **many-to-one**: In Situ places 109 and 139 both point at ZUERST POI 22809
  (both carry `IdSource = 139`); places 23 and 65 both resolve to POI 21262.
* The relation is **not consistently maintained**: 19 places have a `pro_infirmis_detail_url` but only
  **12** still have a non-empty `pro_infirmis_id_source`. Those 7 rows were linked once (pictograms + URL got
  written), then the id source was cleared, and nothing ever cleaned up the derived columns.
* `place.pro_infirmis_id_source` is `varchar(24)` and is matched with `===` against whatever ZUERST sends,
  so **type coercion matters**: if ZUERST ever returns `IdSource` as a JSON number, `"139" === 139` is false
  and every match breaks. (`PlaceType.php:309` uses `array_search` without the strict flag, so *that* path is
  loose; `PlaceProinfirmisUpdateCommand.php:72` uses `===`, so *that* path is strict. The two disagree.)

---

## 7. What is stored in the database

### 7.1 Schema

```
$ docker exec insitu-admin-postgres-1 psql -U postgres -d insitu-admin -c "\d+ place"

 pro_infirmis_id_source        | character varying(24)    |  | | NULL::character varying | extended |
 pro_infirmis_pictograms       | text                     |  | |                         | extended | (DC2Type:json)
 pro_infirmis_detail_url       | character varying(255)   |  | | NULL::character varying | extended |
```

All three columns are nullable, on `place` only. No index covers any of them. No other table in the database
has a `%infirmis%`, `%ginto%` or `%pictogram%` column:

```sql
SELECT table_name, column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE column_name ILIKE '%infirmis%' OR column_name ILIKE '%ginto%' OR column_name ILIKE '%pictogram%';
-- place | pro_infirmis_id_source  | character varying | 24
-- place | pro_infirmis_pictograms | text              |
-- place | pro_infirmis_detail_url | character varying | 255
```

In particular, `place_proposed` (the ACTIVATE_PROPOSAL_PLACE entity, which **is** enabled on BKA) has **no**
ProInfirmis columns at all.

**Important for the port:** `pro_infirmis_pictograms` is a Postgres **`text`** column with a Doctrine
`(DC2Type:json)` comment, *not* a native `json`/`jsonb` column. This is a direct artefact of the MySQL→Postgres
move (the original MySQL DDL used `LONGTEXT`, later `JSON`). It is why the JSON filter is broken (§8.3).

### 7.2 Migrations

| Migration | Date | What it does |
| --- | --- | --- |
| `migrations/Version20221124093828.php` | 2022-11-24 | Creates `place` with `pro_infirmis_id_source VARCHAR(24) DEFAULT NULL` and `pro_infirmis_pictograms LONGTEXT DEFAULT NULL COMMENT '(DC2Type:json)'`, `ENGINE = InnoDB`, `utf8mb4_unicode_ci` |
| `migrations/Version20230302074303.php` | 2023-03-02 | `ALTER TABLE place ADD pro_infirmis_detail_url VARCHAR(255) DEFAULT NULL` |
| `migrations/Version20231012152121.php` | 2023-10-12 | `ALTER TABLE place CHANGE pro_infirmis_pictograms pro_infirmis_pictograms JSON DEFAULT NULL COMMENT '(DC2Type:json)'` (MySQL-only syntax) |

All three are MySQL/MariaDB DDL. They are recorded as applied in the Postgres database but are **not runnable
from scratch on Postgres** (`AUTO_INCREMENT`, `ENGINE = InnoDB`, `CHANGE col col`, `TINYINT(1)`).

### 7.3 Live BKA production data — **BKA has essentially none**

```sql
SELECT count(*) AS total_places,
       count(pro_infirmis_id_source)  AS with_id_source,
       count(pro_infirmis_detail_url) AS with_detail_url,
       count(pro_infirmis_pictograms) AS pictograms_not_null,
       count(*) FILTER (WHERE pro_infirmis_pictograms IS NOT NULL
                          AND pro_infirmis_pictograms NOT IN ('[]','null','')) AS pictograms_non_empty
FROM place;
```

```
 total_places | with_id_source | with_detail_url | pictograms_not_null | pictograms_non_empty
--------------+----------------+-----------------+---------------------+----------------------
         1276 |              7 |               1 |                1276 |                    1
```

Breaking the 7 down — six of them are the **empty string**, not a real id:

```sql
SELECT pro_infirmis_id_source, length(pro_infirmis_id_source) AS len, count(*)
FROM place WHERE pro_infirmis_id_source IS NOT NULL GROUP BY 1,2;
```

```
 pro_infirmis_id_source | len | count
------------------------+-----+-------
                        |   0 |     6
 265                    |   3 |     1
```

Frequency of the stored JSON values across all 1 276 BKA places:

```sql
SELECT CASE WHEN pro_infirmis_pictograms IS NULL THEN '(NULL)'
            WHEN pro_infirmis_pictograms = '[]' THEN '[] (empty array)'
            ELSE left(pro_infirmis_pictograms, 40)||'…' END AS value, count(*)
FROM place GROUP BY 1 ORDER BY 2 DESC;
```

```
                   value                   | count
-------------------------------------------+-------
 [] (empty array)                          |  1275
 [{"Id":8,"Name":"Eingeschränkt roll… |     1
```

**Honest answer to "dump the real `pro_infirmis_pictograms` values and their frequency from the live BKA DB":
BKA has exactly one non-empty row, and it is a disabled test record.** Here it is in full:

```sql
SELECT id, name, city, enabled, organization_id, created_at, updated_at,
       pro_infirmis_id_source, pro_infirmis_detail_url
FROM place WHERE id = 1;
```

```
 id |       name        | city  | enabled | organization_id |      created_at        |      updated_at        | id_source |              detail_url
----+-------------------+-------+---------+-----------------+------------------------+------------------------+-----------+--------------------------------------------------
  1 | Format-z test Ort | Bulle |    f    |        1        | 2023-10-26 17:40:20+00 | 2023-12-05 14:40:02+00 |    265    | https://zuerst.proinfirmis.ch/pois/detail/16672
```

```json
[
  {
    "Id": 8,
    "Name": "Eingeschränkt rollstuhlgängig",
    "NameFr": "Partiellement accessible en fauteuil roulant",
    "NameIt": "Parzialmente accessibile in sedia a rotelle",
    "NameEn": "Partially wheelchair-accessible",
    "LinkToPictogram": "https://zuerst.proinfirmis.ch/Pictograms/08_eingeschraenkt_zugaenglich.jpg",
    "LinkToPictogramSvg": "https://zuerst.proinfirmis.ch/Pictograms/svg/08_eingeschraenkt_zugaenglich.svg",
    "PictogramFileName": "08_eingeschraenkt_zugaenglich.jpg"
  },
  {
    "Id": 9,
    "Name": "WC eingeschränkt rollstuhlgängig",
    "NameFr": "Toilettes partiellement accessibles en fauteuil roulant",
    "NameIt": "WC parzialmente accessibile in sedia a rotelle",
    "NameEn": "Toilets partially wheelchair-accessible",
    "LinkToPictogram": "https://zuerst.proinfirmis.ch/Pictograms/09_rollstuhl_wc_eingeschraenkt.jpg",
    "LinkToPictogramSvg": "https://zuerst.proinfirmis.ch/Pictograms/svg/09_rollstuhl_wc_eingeschraenkt.svg",
    "PictogramFileName": "09_rollstuhl_wc_eingeschraenkt.jpg"
  },
  {
    "Id": 10,
    "Name": "Parkplatz eingeschränkt rollstuhlgängig",
    "NameFr": "Place de parc partiellement accessible en fauteuil roulant",
    "NameIt": "Parcheggio parzialmente accessibile in sedia a rotelle",
    "NameEn": "Parking place partially wheelchair-accessible ",
    "LinkToPictogram": "https://zuerst.proinfirmis.ch/Pictograms/10_behindertenparkplatz_eingeschraenkt.jpg",
    "LinkToPictogramSvg": "https://zuerst.proinfirmis.ch/Pictograms/svg/10_behindertenparkplatz_eingeschraenkt.svg",
    "PictogramFileName": "10_behindertenparkplatz_eingeschraenkt.jpg"
  }
]
```

*(The raw column stores this with `\uXXXX` escapes and `\/`-escaped slashes, i.e. PHP's default
`json_encode` output; it is pretty-printed and unescaped above for readability.)*

Note the oddity: the stored `pro_infirmis_detail_url` points at POI **16672** while `pro_infirmis_id_source`
is **265** — consistent with §6.1 (`IdSource` ≠ ZUERST POI id).

The same single row is present in `bka.dump`:

```
$ pg_restore -t place -a -f - bka.dump | awk -F'\t' 'NF>20 && ($20!="\\N" && $20!="[]") {print $1"\t"$5"\t"$19"\t"$23}'
1	Format-z test Ort	265	https://zuerst.proinfirmis.ch/pois/detail/16672
```

By contrast, the **In Situ** production dump has 19 places with real pictograms and 12 with a real id source
out of 642 places (§5.1, §6.1). So in practice **ProInfirmis is an In Situ feature that BKA inherited but
never used**.

This is consistent with `docker-compose.yaml:46` setting `ACTIVATE_PROINFIRMIS: false` for the BKA deployment.
**Whether the real BKA production deployment also has it off is UNVERIFIED** — the repository contains no
production env manifest (no helm chart, no `.gitlab-ci.yml`; `.github/workflows/` only builds and pushes a
Docker image). The circumstantial evidence (1 test place out of 1 276) says the feature is effectively dead on
BKA. The `.env` default is `ACTIVATE_PROINFIRMIS=true` (`.env:77`), as is `.env.local:15` and the deleted
`.env.gitlab-ci:15`, so a deployment that forgets to set it will have it **on**.

---

## 8. How it surfaces

### 8.1 Admin form

`src/Form/PlaceType.php:257-268` — the field is conditional:

```php
if ($this->proinfirmisActivated) {
    $builder->add('proInfirmisIdSource', ChoiceType::class, [
        'label' => 'place.proInfirmisIdSource._label',
        'help'  => 'place.proInfirmisIdSource._help',
        'choices' => $proInfirmisChoices,
        'required' => false,
        // 'disabled' => !$this->authorizationChecker->isGranted('ROLE_ADMIN'),
        'attr' => ['class' => 'select'],
    ]);
}
```

`templates/includes/form/place_form.html.twig:51-53`:

```twig
    {% if proinfirmisActivated %}
        {{ form_row(form.proInfirmisIdSource) }}
    {% endif %}
```

The Twig global comes from `config/packages/twig.yaml:14` → `proinfirmisActivated: '%env(bool:ACTIVATE_PROINFIRMIS)%'`.
The constructor argument comes from `config/services.yaml:30` → `$proinfirmisActivated: '%env(bool:ACTIVATE_PROINFIRMIS)%'`.

Labels (`translations/messages.de.yml:241-244`, `translations/messages.fr.yml:241-244`, also dumped to
`assets/translations/{de,fr}.json:377-379` for the JS layer):

| Key | DE | FR |
| --- | --- | --- |
| `place.proInfirmisIdSource._label` | Zugänglichkeit – Pro Infirmis (optional) | Accessibilité - Pro Infirmis (facultatif) |
| `place.proInfirmisIdSource._help` | Wählen Sie den bei Pro Infirmis registrierten Ort aus der Liste aus | Sélectionner le lieu enregistré auprès de Pro Infirmis dans la liste |
| `place.proInfirmisIdSource._placeholder` | Wählen Sie den entsprechenden Raum aus | Choisir la salle correspondante |

Immediately below it sits the *self-declaration* block — three independent booleans
(`wheelchairAccessible`, `wheelchairAccessibleToilets`, `wheelchairAccessibleParking`) plus the OK:GO logo —
which is **always** rendered, regardless of the flag. There is no BKA theme override of the place form
(`themes/bka/templates/` contains no place templates, and `grep -rn -i infirmis themes/` is empty).

**Verified on the live BKA admin** (`http://localhost:8080`, logged in as `admin@wepublish.ch`):

```
$ curl -s -b cookies -L "http://localhost:8080/places/edit/1" -o place_edit.html -w "status=%{http_code}\n"
status=200
$ grep -c -i proInfirmis place_edit.html
0
```

The rendered page contains `Zugänglichkeit - Selbsterklärung (optional)` (the self-declaration block) and no
ProInfirmis select at all — exactly as expected with `ACTIVATE_PROINFIRMIS: false`.

### 8.2 The write-back listener

`src/Form/PlaceType.php:296-331`, in the `FormEvents::POST_SUBMIT` listener:

```php
if ($entity->getProInfirmisIdSource()) {
    $data = $this->proInfirmisAPICacheManager->getData();

    if (array_key_exists('Pictograms', $data) && array_key_exists('Pois', $data)) {
        $allPictograms = $data['Pictograms'];
        $allPlaces     = $data['Pois'];

        $key = array_search($entity->getProInfirmisIdSource(), array_column($allPlaces, 'IdSource'));

        if (!$key || !array_key_exists($key, $allPlaces)) {
            $this->logger->warning(sprintf('%s not found in ProInfirmis data. Cannot set ProInfimis data for place %s', $key, $entity->getName()));
        } else {
            $pictogramsIds = $allPlaces[$key]['PictogramIds'];

            $placePictograms = [];
            foreach ($allPictograms as $pictogram) {
                if (in_array($pictogram['Id'], $pictogramsIds)) {
                    $placePictograms[] = $pictogram;
                }
            }

            $entity->setProInfirmisPictograms($placePictograms);
            $entity->setProInfirmisDetailUrl($allPlaces[$key]['LinkToDetailView']);
        }
    }
}
```

Three defects worth recording, because a faithful port would reproduce them by accident:

* **`!$key` is an off-by-zero bug.** `array_search` returns the *index*, so a POI at index `0` yields `0`,
  `!0 === true`, and the branch is wrongly treated as "not found". **The first POI in the ZUERST export can
  never be linked.** (The same expression also conflates "not found" (`false`) with "found at 0".)
* **Stale data is never cleared.** If the admin clears the select, `getProInfirmisIdSource()` is falsy, the
  whole block is skipped, and the previously written `pro_infirmis_pictograms` / `pro_infirmis_detail_url`
  stay behind. This is visibly what happened to the 7 In Situ places in §6.1 that have a detail URL but no
  id source.
* **The listener is registered unconditionally**, outside the `if ($this->proinfirmisActivated)` guard. With
  the flag off, saving a place that *already* has a non-empty `pro_infirmis_id_source` still triggers a live
  ZUERST fetch and rewrites the pictograms.
* `in_array($pictogram['Id'], $pictogramsIds)` is **loose** — `in_array("8", [8])` is true, and so is
  `in_array(0, ["foo"])` on PHP < 8. On PHP 8.x the string/int case is still loose but safe for numerics.

### 8.3 Public API output

**v1 (`/api/v1/places/…`, FOSRestBundle, serializer group `reader`).** `src/Entity/Place.php:121-144`:

```php
    #[ORM\Column(type: Types::STRING, length: 24, nullable: true)]
    #[Groups(['reader', 'archive'])]
    private ?string $proInfirmisIdSource = null;

    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    #[Groups(['reader', 'archive'])]
    private ?string $proInfirmisDetailUrl = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['reader', 'archive'])]
    #[OA\Property(type: 'array', items: new OA\Items(properties: [ /* Id, Name, NameFr, NameIt, NameEn,
        LinkToPictogram, LinkToPictogramSvg, PictogramFileName */ ], type: 'object'))]
    private ?array $proInfirmisPictograms = [];
```

The `reader` group is applied in `src/Controller/ApiPlaceController.php:84` (`serializerGroups: ['reader']`).
`config/packages/framework.yaml:30` sets
`name_converter: 'serializer.name_converter.camel_case_to_snake_case'`, so the JSON keys are
`pro_infirmis_id_source`, `pro_infirmis_detail_url`, `pro_infirmis_pictograms`. The **objects inside the
pictogram array keep their PascalCase keys** (`Id`, `Name`, `NameFr`, …) because they are a raw JSON array,
not serialized objects.

The `archive` serializer group is declared on these properties but is never referenced by any controller
(`grep -rn "'archive'" src/ --include="*.php" | grep -v Entity/` returns only `src/Traits/TranslatableEntity.php:13`)
— it is dead.

**v2 (API Platform).** `src/ApiResource/PlaceApi.php:142-181` declares the three properties with
`#[Groups(['api:place:read-item', 'api:organization:read-item', 'api:event:read-item'])]` — i.e. **item reads
only, never collection reads**. `src/Mapper/PlaceEntityToApiMapper.php:81-94` fills them only inside the
`if ($readItem)` branch:

```php
        if ($readItem) {
            …
            $dto->wheelchairAccessible        = $entity->isWheelchairAccessible();
            $dto->wheelchairAccessibleToilets = $entity->isWheelchairAccessibleToilets();
            $dto->wheelchairAccessibleParking = $entity->isWheelchairAccessibleParking();
            $dto->proInfirmisIdSource   = $entity->getProInfirmisIdSource();
            $dto->proInfirmisDetailUrl  = $entity->getProInfirmisDetailUrl();
            $dto->proInfirmisPictograms = $entity->getProInfirmisPictograms();
        }
```

`tests/Functional/ApiPlaceTest.php:213-214` confirms the v2 wire names are snake_case too:

```php
    ->assertJsonMatches('"pro_infirmis_id_source"',  $place->getProInfirmisIdSource())
    ->assertJsonMatches('"pro_infirmis_detail_url"', $place->getProInfirmisDetailUrl())
```

API-doc changelog entries (`config/packages/nelmio_api_doc.yaml:41,67`, mirrored in `public/openapi.yaml:4`):

* **0.9.3** – 2022-09-08 — "Add Pro Infirmis pictograms in place object"
* **1.0.1** – 2023-03-02 — "Add ProInfirmis detail URL for place entity"

### 8.4 The `accessibility_proinfirmis[]` filter

Declared on the v2 Event resource, `src/ApiResource/EventApi.php:293-301`:

```php
'accessibility_proinfirmis[]' => new QueryParameter(
    schema: [
        'type'    => 'array',
        'items'   => ['type' => 'int'],     // note: not a valid OpenAPI type
        'example' => [1],
    ],
    description: 'Pro Infirmis\'s accessibility, pictograms IDs.',
    required: false
),
```

It sits next to `accessibility_auto_declaration[]`, which is the self-declaration equivalent and takes the
string enum `['wheelchairAccessible','wheelchairAccessibleToilets','wheelchairAccessibleParking']`
(`src/Entity/Place.php:151-158`, `Place::getAccessibilityAutoList()`).

It is implemented **three times**, with identical DQL:

**(a) API Platform v2 extension** — `src/ApiPlatform/OccurrenceExtension.php:402-418`:

```php
// accessibility ProInfirmis
$accessibilityProInfirmisIds = $request->query->all('accessibility_proinfirmis');
if (!empty($accessibilityProInfirmisIds)) {
    $ids = EventExtension::toArrayOfIntegers($accessibilityProInfirmisIds);
    if (false === $ids) {
        throw new InvalidArgumentException('Pro Infirmis accessibility IDs must be an array of int.');
    }

    $typesExpr = $queryBuilder->expr()->orX();
    foreach ($ids as $accessibility) {
        $typesExpr->add("JSON_CONTAINS(JSON_EXTRACT(place.proInfirmisPictograms, '$[*].Id'), :accessibility" . $accessibility . ", '$') = 1");
        $queryBuilder->setParameter('accessibility' . $accessibility, $accessibility);
    }
    $queryBuilder->andWhere($typesExpr);
}
```

**(b) legacy optimised search** — `src/Repository/EventOccurrenceRepository.php:250-258` (same DQL, alias `place`, parameter cast `(int)`).

**(c) legacy non-optimised search** — `src/Repository/EventRepository.php:246-254` (same DQL, alias `p`, parameter cast `(int)`).

Paths (b) and (c) are reached from the **v1** API: `src/Controller/ApiEventController.php:134` /`:179`
(`$params = $request->query->all()`), through `EventSearchEngine::optimizedSearchEvents()` /
`::searchEvents()`. BKA runs `USE_OPTIMIZED_EVENT_LOAD=true`, so path (b) is live for v1 and path (a) for v2.
The v1 OpenAPI (`public/openapi.yaml`) does **not** document the parameter at all — `grep -n -i accessibility public/openapi.yaml` is empty.

Input parsing — `src/ApiPlatform/EventExtension.php:31-50`:

```php
public static function toArrayOfIntegers(array $array): array|bool
{
    $intArray = [];
    $valuesToProcess = $array;
    if (1 === count($array)) {
        $valuesToProcess = explode(',', $array[0]);   // allows ?accessibility_proinfirmis[]=1,2,3
    }
    foreach ($valuesToProcess as $string) {
        $int = intval($string);
        if (0 === $int) { return false; }             // rejects "0" and anything non-numeric
        $intArray[] = $int;
    }
    return $intArray;
}
```

So `accessibility_proinfirmis[]=1,2` and `accessibility_proinfirmis[0]=1&accessibility_proinfirmis[1]=2`
both work; `accessibility_proinfirmis[]=unknown value` → `400`. Multiple ids are **OR**-combined (a place
matching *any* of the ids passes); the ProInfirmis block is then **AND**-ed with the rest of the query.

Behaviour is pinned by `tests/Functional/ApiEventTest.php:3785-3912`
(`testGetAgendaEventsAccessibilityProInfirmis`), which seeds a place with pictograms `[1, 2, 5, 10]`, then
asserts `GET /api/v2/events/agenda`:

| query | expected |
| --- | --- |
| `accessibility_proinfirmis[]=1` | `200`, `totalItems = 1` |
| `accessibility_proinfirmis[0]=1&accessibility_proinfirmis[1]=2` | `200`, `totalItems = 1` |
| `accessibility_proinfirmis[]=8` | `200`, `totalItems = 0` |
| `accessibility_proinfirmis[]=unknown value` | `400` |

#### The filter is broken on PostgreSQL

`JSON_CONTAINS` and `JSON_EXTRACT` are registered from the **MySQL** namespace in
`config/packages/doctrine.yaml:29-31`:

```yaml
        dql:
            string_functions:
                JSON_CONTAINS: Scienta\DoctrineJsonFunctions\Query\AST\Functions\Mysql\JsonContains
                JSON_EXTRACT: Scienta\DoctrineJsonFunctions\Query\AST\Functions\Mysql\JsonExtract
```

Those classes emit the literal SQL function names
(`vendor/scienta/doctrine-json-functions/src/Query/AST/Functions/Mysql/JsonContains.php:12` →
`public const FUNCTION_NAME = 'JSON_CONTAINS';`). Running the generated SQL shape against the live BKA
Postgres database:

```sql
SELECT count(*) FROM place p
WHERE JSON_CONTAINS(JSON_EXTRACT(p.pro_infirmis_pictograms, '$[*].Id'), '8', '$') = 1;
```

```
ERROR:  function json_extract(text, unknown) does not exist
LINE 1: SELECT count(*) FROM place p WHERE JSON_CONTAINS(JSON_EXTRAC...
HINT:  No function matches the given name and argument types.
```

**Conclusion: `accessibility_proinfirmis[]` cannot work on the current production database.** Any request
carrying the parameter will raise a database error. The PHPUnit suite does not catch this because
`.env.local` points the test DB at MySQL (`DATABASE_URL=mysql://root:secret@mariadb/your_db_name`, and
`docker-compose.yaml` still runs a `mariadb:11.4` service alongside Postgres). The column being `text` rather
than `jsonb` would make even a Postgres-native rewrite need a cast.

This is almost certainly unnoticed because BKA has one place with pictograms and `ACTIVATE_PROINFIRMIS=false`.

---

## 9. Caching behaviour — measured, not assumed

With `ACTIVATE_PROINFIRMIS=false`, `PlaceType::buildForm()` **still** calls
`$this->proInfirmisAPICacheManager->getData()` unconditionally at line 62, before the flag is consulted at
line 257. Three GETs against the running BKA admin produced three outbound ZUERST calls:

```
# after one GET /places/edit/1
$ docker exec insitu-admin-app-1 sh -c 'grep "ProInfirmis" var/log/prod.log'
[2026-10-17T18:28:53.569708+02:00] app.ERROR: Error getting data from ProInfirmis API. Status code : 404 [] []

# after two more form renders (/places/edit/1 and /places/create)
$ docker exec insitu-admin-app-1 sh -c 'grep -c "ProInfirmis" var/log/prod.log'
3
```

So, verified:

* the ZUERST API is hit **once per place-form render**, even with the feature flag off and an empty key;
* the 24 h cache is **not working** in this deployment, because the `pro_infirmis_cache` pool is configured
  for memcached and no memcached server exists;
* every one of those calls is a synchronous, un-timeouted outbound HTTPS request on the request path. With a
  valid key the response is the *entire* Swiss POI export, parsed into PHP arrays, on every form render.

---

## 10. Feature flags

| Env var | Default (`.env`) | Local BKA (`docker-compose.yaml`) | Consumed at |
| --- | --- | --- | --- |
| `PROINFIRMIS_KEY` | `` (empty, `.env:57`) | not set | `config/services.yaml:24` → `ProInfirmisHttpClient::$proinfirmisKey` |
| `ACTIVATE_PROINFIRMIS` | `true` (`.env:77`) | **`false`** (`docker-compose.yaml:46`) | `config/services.yaml:30` → `PlaceType::$proinfirmisActivated`; `config/packages/twig.yaml:14` → Twig global `proinfirmisActivated` |
| `ACTIVATE_GINTO` | `false` (`.env:59`, uncommitted) | not set | branch only: `config/services.yaml` → `ProInfirmisAPICacheManager::$gintoActivated` |
| `GINTO_API_URL` | `https://api.ginto.guide/graphql` (`.env:60`) | not set | branch only |
| `GINTO_API_KEY` | `` (`.env:61`) | not set | branch only |
| `GINTO_FILTER_ID` | `` (`.env:62`) | not set | branch only |
| `GINTO_SOURCE_KEY` | `zuerst` (`.env:64`) | not set | branch only |

Other env files: `.env.local:10,15` (`PROINFIRMIS_KEY=`, `ACTIVATE_PROINFIRMIS=true`) and the deleted
`.env.gitlab-ci:10,15` (same values). **No production manifest exists in this repository**, so the real
production value of `ACTIVATE_PROINFIRMIS` for BKA is **UNVERIFIED**; the data in §7.3 argues strongly that
it is effectively unused there.

README, "Features that can be activated", item 2 (`README.md:91-92`):

> **2. Deactivate proinfirmis** — Setting the env variable `ACTIVATE_PROINFIRMIS` to `false` will deactivate
> the proinfirmis integration. (default `true`)

---

## 11. The Ginto migration (branch `f/lab-insitu-386`)

All code in this section lives **only** on `f/lab-insitu-386`. It has never been merged, never been run
against the live Ginto API, and `ginto_rating_legacy_ids` is empty, which means the normaliser currently maps
**zero** ratings and would produce `PictogramIds: []` for every entry.

### 11.1 `config/services.yaml` additions

```yaml
parameters:
  …
  # Ginto accessibility rating key => legacy ZUERST pictogram id.
  # Those numeric ids are stored in place.pro_infirmis_pictograms and used by the
  # accessibility_proinfirmis[] API filter, so they must stay stable.
  # Run `bin/console app:ginto:ratings` to list the keys exposed by the Ginto API.
  ginto_rating_legacy_ids: {}

services:
  _defaults:
    bind:
      …
      $gintoActivated:        '%env(bool:ACTIVATE_GINTO)%'
      $gintoApiUrl:           '%env(string:GINTO_API_URL)%'
      $gintoApiKey:           '%env(string:GINTO_API_KEY)%'
      $gintoFilterId:         '%env(string:GINTO_FILTER_ID)%'
      $gintoSourceKey:        '%env(string:GINTO_SOURCE_KEY)%'
      $gintoRatingLegacyIds:  '%ginto_rating_legacy_ids%'
```

### 11.2 `ProInfirmisAPICacheManager` — the switch

```php
    public function __construct(
        private readonly ProInfirmisHttpClient $httpClient,
        private readonly GintoDataProvider $gintoDataProvider,
        private readonly CacheInterface $proInfirmisCache,
        private readonly bool $gintoActivated = false,
    ) {
    }

    public function getData(): array
    {
        return $this->proInfirmisCache->get($this->getCacheKey(), function (ItemInterface $item) {
            $item->expiresAfter($this->expirationSecond);

            // The ZUERST API is shut down end of 2026, Ginto is its replacement.
            return $this->gintoActivated ? $this->gintoDataProvider->getData() : $this->httpClient->getData();
        });
    }

    private function getCacheKey(): string
    {
        // Separate keys so switching the source does not serve data from the other API.
        return $this->gintoActivated ? 'ginto_get_data' : 'pro_infirmis_get_data';
    }
```

**Design intent: the switch is invisible above this line.** `PlaceType`, `PlaceProinfirmisUpdateCommand`, the
stored JSON, the API filter and the admin form all stay byte-identical, because the Ginto payload is
normalised back into the ZUERST `{Pictograms, Pois}` shape.

### 11.3 `src/ProInfirmis/GintoHttpClient.php` (166 lines) — the contract as implemented

```php
readonly class GintoHttpClient
{
    /** The Ginto API returns at most 50 nodes per page. */
    private const PAGE_SIZE = 50;

    private const ENTRIES_QUERY = <<<'GRAPHQL'
        query Entries($filterId: ID!, $first: Int!, $after: String) {
            entriesByFilter(filterId: $filterId, first: $first, after: $after) {
                totalCount
                pageInfo { endCursor hasNextPage }
                nodes {
                    entryId
                    name
                    updatedAt
                    position { street housenumber postcode city lat lng }
                    accessibilityInfo { defaultRatings { key } }
                    publication { linkUrl }
                    sources { originIds sourceKey }
                }
            }
        }
        GRAPHQL;

    private const RATINGS_QUERY = <<<'GRAPHQL'
        query AvailableDefaultRatings {
            availableDefaultRatings {
                key
                iconUrl
                nameDE: name(locale: DE)
                nameFR: name(locale: FR)
                nameIT: name(locale: IT)
                nameEN: name(locale: EN)
            }
        }
        GRAPHQL;
```

Pagination loop (`getEntries()`):

```php
        $nodes = [];
        $after = null;

        do {
            $payload = $this->query(self::ENTRIES_QUERY, [
                'filterId' => $this->gintoFilterId,
                'first'    => self::PAGE_SIZE,
                'after'    => $after,
            ]);

            $entries = $payload['entriesByFilter'] ?? null;
            if (!is_array($entries)) { break; }

            foreach ($entries['nodes'] ?? [] as $node) { $nodes[] = $node; }

            $hasNextPage = (bool) ($entries['pageInfo']['hasNextPage'] ?? false);
            $after       = $entries['pageInfo']['endCursor'] ?? null;
        } while ($hasNextPage && null !== $after);

        return $nodes;
```

Transport (`query()`):

```php
        if ('' === $this->gintoApiKey || '' === $this->gintoApiUrl) {
            $this->logger->error('Ginto API is not configured, set GINTO_API_URL and GINTO_API_KEY.');
            return [];
        }

        $response = $this->httpClient->request('POST', $this->gintoApiUrl, [
            'auth_bearer' => $this->gintoApiKey,
            'json'        => ['query' => $query, 'variables' => $variables],
        ]);

        if (Response::HTTP_OK !== $response->getStatusCode()) { … return []; }

        $payload = $response->toArray(false);
        if (!empty($payload['errors'])) {
            $this->logger->error('Ginto API returned errors : '.json_encode($payload['errors']));
            return [];
        }

        return $payload['data'] ?? [];
```

Every failure mode degrades to `[]`, which the cache manager will then cache for 24 h — a transient Ginto
outage would therefore wipe the admin's POI select list for a day.

### 11.4 `src/ProInfirmis/GintoLegacyNormalizer.php` (152 lines) — the normalisation

Output shape: `['Pictograms' => [...], 'Pois' => [...]]`.

**POIs** (`normalizePois()`):

```php
foreach ($entries as $entry) {
    $pictogramIds = [];
    foreach ($entry['accessibilityInfo']['defaultRatings'] ?? [] as $rating) {
        $legacyId = $this->ratingLegacyIdMap->getLegacyId($rating['key'] ?? '');
        if (null !== $legacyId) { $pictogramIds[] = $legacyId; }
    }

    // A Ginto entry can carry several origin ids: one legacy ZUERST POI per id.
    foreach ($this->extractIdSources($entry) as $idSource) {
        $pois[] = [
            'Id'               => $entry['entryId'] ?? null,
            'IdSource'         => $idSource,
            'Name'             => $entry['name'] ?? '',
            'EntryDate'        => $entry['updatedAt'] ?? null,
            'PictogramIds'     => $pictogramIds,
            'LinkToDetailView' => $entry['publication']['linkUrl'] ?? null,
            'Coordinates'      => ['Lat' => $entry['position']['lat'] ?? null,
                                   'Lng' => $entry['position']['lng'] ?? null],
            'Address'          => ['Street'  => $entry['position']['street'] ?? null,
                                   'Number'  => $entry['position']['housenumber'] ?? null,
                                   'ZipCode' => $entry['position']['postcode'] ?? null,
                                   'City'    => $entry['position']['city'] ?? null],
        ];
    }
}
```

**Id-source extraction** (`extractIdSources()`) — the matching bridge:

```php
foreach ($entry['sources'] ?? [] as $source) {
    if ($this->gintoSourceKey !== ($source['sourceKey'] ?? null)) { continue; }
    foreach ($source['originIds'] ?? [] as $originId) { $idSources[] = (string) $originId; }
}

if ([] === $idSources && isset($entry['entryId'])) {
    $idSources[] = (string) $entry['entryId'];   // entries that never existed in ZUERST
}
```

So one Ginto entry with N `originIds` under `sourceKey === GINTO_SOURCE_KEY` fans out into **N legacy POIs**,
each with a different `IdSource` but the same `Name`, `PictogramIds` and `LinkToDetailView`. Entries with no
matching source fall back to the Ginto `entryId` as the id source — a *new* identifier space that existing
`place.pro_infirmis_id_source` values can never match, but which lets an admin link brand-new Ginto entries.
`place.pro_infirmis_id_source` is `varchar(24)`; Ginto `entryId`s are UUID-shaped in the public examples
(e.g. `0ace704e-db54-41c1-aa45-8f5d1e45cc27` is 36 chars for a filter id) — **a UUID entryId would not fit the
column**. That truncation risk is **UNVERIFIED** (no sample `entryId` is available without a key) but is a
concrete hazard.

**Pictograms** (`normalizePictograms()`):

```php
foreach ($ratings as $rating) {
    $key      = $rating['key'] ?? '';
    $legacyId = $this->ratingLegacyIdMap->getLegacyId($key);

    if (null === $legacyId) {
        $this->logger->warning(sprintf('Ginto rating "%s" has no legacy pictogram id, it will be ignored.', $key));
        continue;
    }

    $iconUrl = $rating['iconUrl'] ?? null;

    $pictograms[] = [
        'Id'                 => $legacyId,
        'Key'                => $key,                 // NEW — not part of the legacy shape
        'Name'               => $rating['nameDE'] ?? '',
        'NameFr'             => $rating['nameFR'] ?? '',
        'NameIt'             => $rating['nameIT'] ?? '',
        'NameEn'             => $rating['nameEN'] ?? '',
        'LinkToPictogram'    => $iconUrl,             // same URL for both
        'LinkToPictogramSvg' => $iconUrl,
        'PictogramFileName'  => $iconUrl ? basename(parse_url($iconUrl, PHP_URL_PATH) ?: '') : '',
    ];
}
```

Deviations from the legacy shape, all of which end up in `place.pro_infirmis_pictograms` and hence in the
public API:

* an **extra `Key` field** (the Ginto string key) that the OpenAPI schema does not declare;
* `LinkToPictogram` and `LinkToPictogramSvg` become **the same URL** (Ginto exposes one `iconUrl`; legacy had a
  `.jpg` and a `.svg`);
* `PictogramFileName` becomes the basename of the Ginto icon URL, which is unlikely to keep the
  `08_eingeschraenkt_zugaenglich.jpg` convention any front-end might be keying on.

### 11.5 `src/ProInfirmis/GintoRatingLegacyIdMap.php` (41 lines)

```php
readonly class GintoRatingLegacyIdMap
{
    /** @param array<string, int|string> $gintoRatingLegacyIds Ginto rating key => legacy ZUERST pictogram id */
    public function __construct(private array $gintoRatingLegacyIds = []) {}

    public function getLegacyId(string $gintoRatingKey): ?int
    {
        if (!isset($this->gintoRatingLegacyIds[$gintoRatingKey])) { return null; }
        return (int) $this->gintoRatingLegacyIds[$gintoRatingKey];
    }

    public function all(): array { return $this->gintoRatingLegacyIds; }
}
```

### 11.6 `src/Command/GintoRatingsCommand.php` (56 lines)

`app:ginto:ratings` — a discovery tool, not a sync. It calls `availableDefaultRatings` and prints a table
`[Ginto key | Legacy pictogram id | Name (DE) | Name (FR) | Icon]`, writing `— missing —` for every key not
yet in `ginto_rating_legacy_ids`, then notes *"Complete GintoRatingLegacyIdMap::MAP with every key listed
above."* (a stale message — the map now lives in `config/services.yaml`, not in a class constant).

### 11.7 `tests/ProInfirmis/GintoLegacyNormalizerTest.php` (90 lines)

A pure unit test (`PHPUnit\Framework\TestCase`, `NullLogger`, no kernel). Fixture entry:

```php
[
    'entryId'   => 'abc',
    'name'      => 'Musée de la main',
    'updatedAt' => '2026-01-01T00:00:00Z',
    'position'  => ['street' => 'Rue du Bugnon', 'housenumber' => '21', 'postcode' => '1011',
                    'city' => 'Lausanne', 'lat' => 46.52, 'lng' => 6.64],
    'accessibilityInfo' => ['defaultRatings' => [['key' => 'fully_accessible'], ['key' => 'wheelchair_wc']]],
    'publication' => ['linkUrl' => 'https://ginto.guide/entry/abc'],
    'sources'     => [['sourceKey' => 'zuerst', 'originIds' => ['12345']]],
]
```

with the **hypothetical** rating map `['fully_accessible' => 1, 'wheelchair_wc' => 2]`. Cases:

| Test | Asserts |
| --- | --- |
| `testEntryIsMappedToLegacyPoi` | `IdSource='12345'`, `Name='Musée de la main'`, `LinkToDetailView='https://ginto.guide/entry/abc'`, `PictogramIds=[1,2]`, `Coordinates.Lat=46.52` |
| `testUnmappedRatingIsIgnored` | with only `fully_accessible` mapped → `PictogramIds=[1]` |
| `testEntryWithSeveralZuerstIdsYieldsOnePoiPerId` | `originIds=['12345','67890']` → two POIs, `IdSource` `['12345','67890']` |
| `testEntryWithoutZuerstSourceFallsBackToEntryId` | `sourceKey='other'` → `IdSource='abc'` (the `entryId`) |
| `testRatingsAreMappedToLegacyPictograms` | `['fully_accessible', 'unknown_rating']` → 1 pictogram, `Id=1`, `NameFr='Entièrement accessible'`, `PictogramFileName='01_voll_zugaenglich.svg'` |

**The rating keys `fully_accessible` and `wheelchair_wc` are invented test fixtures, not real Ginto keys.**

### 11.8 `docs/ginto-migration/api-key-request.md` (47 lines)

A ready-to-send German email to `support@ginto.guide` asking for (1) a production API key plus a test key for
`https://api.dev.ginto.guide/graphql`, (2) a filter id for `entriesByFilter` reproducing the current ZUERST
export, (3) confirmation of the `sourceKey` holding the legacy ZUERST ids, and (4) the list of
`availableDefaultRatings` keys **plus a mapping of those keys to the legacy numeric ZUERST `PictogramIds`**.
Technical contact: Karl Merkli, karl@wepublish.ch. Stated cadence: "einmal täglich, vollständiger Abzug des
gefilterten Datenbestands" (once daily, full pull of the filtered dataset). The file still says
"Organisation: In Situ (insitu.ch)" — it was written for In Situ, not BKA.

---

## 12. The Ginto GraphQL contract (official documentation)

Sources, both fetched 2026-10-17 and both stamped "Letzte Aktualisierung: 25/7/2026":

* <https://about.ginto.guide/course/api> — "Die Ginto-API"
* <https://about.ginto.guide/course/api-migrate-from-zuerst-to-ginto> — "Migration von ZUERST zu Ginto"

### 12.1 Transport and auth

| Property | Value |
| --- | --- |
| Endpoint | `https://api.ginto.guide/graphql` (test: `https://api.dev.ginto.guide/graphql`, per `README.md:106`) |
| Method | `POST` |
| Body | `{"query": "...", "variables": {}}` |
| `Content-Type` | `application/json` |
| `Accept` | `application/graphql-response+json, application/json` |
| `Authorization` | `Bearer {apiKey}` — required on **every** request; obtained from `support@ginto.guide` |
| `Accept-Language` | optional, `de` \| `en` \| `fr` \| `it` — sets the default language of returned text |
| Success | JSON with a `data` object |
| Failure | JSON may contain an `errors` array; `data` is then `null` or partial |

Live probe without a token (2026-10-17):

```
$ curl -s -i -X POST "https://api.ginto.guide/graphql" \
    -H "Content-Type: application/json" \
    -H "Accept: application/graphql-response+json, application/json" \
    -d '{"query":"{ __typename }","variables":{}}' | head -3
HTTP/2 401
server: Heroku
x-runtime: 0.001657
```

### 12.2 Available queries

| Query | Description (translated from the docs) |
| --- | --- |
| `allEntries` | all entries in Ginto |
| `entriesByFilter` | all entries inside a predefined publication filter (filter must be requested from Ginto support) |
| `entriesBySearch` | entries near a coordinate and/or matching a search text |
| `entry` | one entry by id |
| `deletedEntries` | ids of entries that have been deleted |
| `availableCategories` | all categories |
| `availableDefaultRatings` | all default ratings — each has a pictogram and a short accessibility summary; "the default ratings of an entry should be used to publish accessibility on external websites" |
| `availableFilterTags` | predefined keywords assignable to entries |
| `availablePublicationFilters` | publication filters the user has permission for |
| `availableRatingProfiles` | predefined rating profiles (e.g. "Rollstuhl"), as opposed to default ratings which define possible outcomes (e.g. "Teilweise rollstuhlgerecht") |
| `availableSources` | all external sources linked to Ginto entries |

Two of these are directly useful to the port but **unused by the branch**: `availableSources` would settle
which `sourceKey` carries the In Situ/BKA ids, and `deletedEntries` would let the sync unlink places whose
POI disappeared (today nothing ever clears a stale link).

### 12.3 Pagination

Cursor-based Relay-style connections:

* `first` — number of items, **maximum 50**;
* `after` — cursor of the last item of the previous page (omit for the first page);
* response carries `nodes` (or `edges { node }`), `pageInfo.endCursor`, `pageInfo.hasNextPage`, and
  `totalCount` where supported.

The branch's `PAGE_SIZE = 50` and its `do { … } while ($hasNextPage && null !== $after)` loop match this
exactly. Caveat: the documented `entriesByFilter` example passes **only** `filterId` — `first`/`after` on
`entriesByFilter` specifically are **UNVERIFIED**, although "die meisten Listenabfragen werden paginiert"
("most list queries are paginated") plus the `pageInfo` in that very example make it near-certain.

### 12.4 The documented `entriesByFilter` query (verbatim from the docs)

```graphql
{
  entriesByFilter(filterId: "0ace704e-db54-41c1-aa45-8f5d1e45cc27") {
    totalCount
    pageInfo { endCursor hasNextPage hasPreviousPage startCursor }
    nodes {
      entryId
      name
      createdAt
      updatedAt
      categories { groupKey groupName key name }
      position { street housenumber postcode city countryCode lat lng }
      accessibilityInfo {
        defaultRatings {
          descriptionDE: description(locale: DE)
          descriptionEN: description(locale: EN)
          descriptionFR: description(locale: FR)
          descriptionIT: description(locale: IT)
          iconUrl
          key
        }
      }
      publication {
        linkTextDE: linkText(locale: DE)
        linkTextEN: linkText(locale: EN)
        linkTextFR: linkText(locale: FR)
        linkTextIT: linkText(locale: IT)
        linkUrl
      }
      licenseInfo { attribution isOpenData license }
      sources { originIds sourceKey sourceName }
      areas {
        areaTemplateKey id name
        accessibilityInfo { defaultRatings { descriptionDE: description(locale: DE) … iconUrl key } }
        publication { linkTextDE: linkText(locale: DE) … linkUrl }
        subAreas {
          areaTemplateKey id name
          accessibilityInfo { defaultRatings { … } }
          publication { … }
        }
      }
    }
  }
}
```

Key observations against the branch implementation:

* The **rating text field is `description(locale:)`, not `name(locale:)`.** The branch's `RATINGS_QUERY`
  asks `availableDefaultRatings { key iconUrl nameDE: name(locale: DE) … }`. Whether
  `availableDefaultRatings` exposes `name` at all is **UNVERIFIED**; if it only exposes `description`, the
  query will fail validation and `getAvailableDefaultRatings()` will return `[]`, which in turn makes
  `GintoLegacyNormalizer::normalize()` emit `Pictograms: []` → `PlaceType` writes **no pictograms at all**.
* `sources` also carries `sourceName` (human-readable), which the branch does not request.
* `areas` / `subAreas` carry their own `defaultRatings` and `linkUrl`. The branch ignores them — only the
  entry-level `accessibilityInfo.defaultRatings` is mapped, which matches ZUERST's flat `PictogramIds`.
* `licenseInfo { attribution isOpenData license }` exists. The ZUERST integration had no attribution
  handling; Ginto data may carry licence obligations. **UNVERIFIED** whether attribution display is required.
* `position.countryCode` is new.

### 12.5 ZUERST → Ginto category mapping (published, complete)

The application never uses ZUERST categories (`Pois[].Category` is not read anywhere), but the table is
published and is reproduced here so the port does not have to re-fetch it:

| ZUERST category | Ginto key | | ZUERST category | Ginto key |
| --- | --- | --- | --- | --- |
| Apotheke oder Drogerie | `drugstore` | | Öffentliche WC-Anlage | `public_toilets` |
| Arzt- oder Zahnarztpraxis | `doctors_practice` | | Öffentlicher Aufzug oder Hebebühne | `nil` |
| Aussichtspunkt | `lookout` | | Park oder Friedhof | `park` |
| Autoverleih | `services_other` | | Parkhaus | `multi_storey_car_park` |
| Bahnhof | `train_station` | | Parkplatz | `parking_lot` |
| Bank | `bank` | | Post | `post` |
| Bergbahnen | `mountain_railway_station` | | Rastplatz (mit Spielplatz) | `playground` |
| Bibliothek | `library` | | Rastplatz (sonst) | `park` |
| Botanischer Garten | `park` | | Recycling-Sammelstelle | `services_other` |
| Campingplatz | `camping` | | Religiöse Einrichtung | `religious_institution` |
| Club | `club` | | Restaurant, Café oder Bar | `restaurant` |
| Einkaufszentrum | `mall` | | Schiff | `ship` |
| Eisstadion | `sports_facility` | | Schule | `education_other` |
| Eurokey-Anlage | `nil` | | Schwimmbad, Strandbad oder See | `swimming_pool` |
| Ferienhaus oder Ferienwohnung | `holiday_home` | | Sehenswürdigkeit | `sight` |
| Flughafen | `nil` | | Seilbahn | `mountain_railway_station` |
| Geldautomat | `atm` | | Seminarzentrum | `congress_center` |
| Geschäfte | `shopping_other` | | Seniorenzentrum | `nursing_home` |
| Grund-, Mittel-, Berufs-, Fach- oder Hochschule | `education_other` | | Sportzentrum oder Turnhalle | `sports_facility` |
| Gruppenunterkünfte | `group_house` | | Stadion | `sports_facility` |
| Hotel, Pension, Bed & Breakfast | `hotel` | | Taxi | `services_other` |
| Hütte | `group_house` | | Tourist Office | `tourist_information` |
| Kinderbetreuung | `childcare` | | Tram-, Bus- oder Postautostation | `bus_stop` |
| Kino | `cinema` | | Unterkunft (sonst) | `hotel` |
| Kongresshalle | `congress_center` | | Veranstaltungsraum (sonst) | `congress_center` |
| Konzerthalle, Oper oder Theatersaal | `theatre` | | Verein | `services_other` |
| Landesteg | `ship_landing` | | Verwaltungsgebäude | `administration` |
| Museum oder Galerie | `museum` | | Wellnesscenter | `sports_facility` |
| | | | Zoo oder Tierpark | `park` |

### 12.6 **There is no published pictogram-id ↔ rating-key mapping**

This is the single biggest gap. The Ginto migration guide maps `Pois[].PictogramIds` to
`accessibilityInfo.defaultRatings` but publishes **no** table from the numeric ZUERST ids to the Ginto string
keys. That is precisely why:

* `config/services.yaml` (branch) has `ginto_rating_legacy_ids: {}` — **empty**;
* `app:ginto:ratings` exists purely to *discover* the keys from a live API so the map can be hand-written;
* `docs/ginto-migration/api-key-request.md:29-32` asks Ginto support for exactly that mapping.

**The full pictogram/rating id ↔ key mapping table does not exist anywhere, in any form, in either repository
or in Ginto's public documentation.** The real ZUERST numeric ids and names are in §5 of this document; the
Ginto keys can only be obtained with an API key. The only key strings that appear anywhere in the codebase
(`fully_accessible`, `wheelchair_wc`, `unknown_rating`) are invented unit-test fixtures.

---

## 13. The ZUERST shutdown timeline (authoritative)

From <https://about.ginto.guide/course/api-migrate-from-zuerst-to-ginto> ("Profi-Tipp", page last updated
25 July 2026), translated:

| Date | What happens |
| --- | --- |
| **now** | Accessibility data still captured by Pro Infirmis in ZUERST remains available via the ZUERST API, and is simultaneously fully integrated into Ginto and retrievable via the Ginto API. The bulk of Pro Infirmis's professional surveying already happens in Ginto. |
| **31 December 2026** | The ZUERST API is put into **standby mode**. POI requests are **redirected to the corresponding Ginto URL**. No further accessibility data is captured with ZUERST. |
| **31 December 2027** | **Complete shutdown of ZUERST, including the API.** |

`README.md:94-95` (working-tree version) states "The ZUERST API (`zuerst.proinfirmis.ch`) is shut down
**end of 2026**" — that matches the standby milestone but not the full-shutdown milestone.

Context from the same page: ZUERST's accessibility database is fully integrated into Ginto; Ginto is run by
the association **Sitios**, founded in 2022 by Förderverein Barrierefreie Schweiz, Pro Infirmis and Verein
AccessibilityGuide; Ginto additionally carries self-reported OK:GO data (hotels, museums) that ZUERST never
had. So migrating to Ginto *grows* the dataset, it does not merely preserve it.

As of **2026-10-17** both APIs are reachable (ZUERST: HTTP 404 on a bad key, ASP.NET/IIS; Ginto: HTTP 401
without a bearer token, Heroku).

---

## 14. Discrepancies between the branch implementation and the official contract

| # | Branch does | Docs say | Risk |
| --- | --- | --- | --- |
| 1 | `availableDefaultRatings { nameDE: name(locale: DE) … }` | entry-level `defaultRatings` exposes `description(locale:)`, `iconUrl`, `key`; no `name` field is documented anywhere | **High** — if `name` does not exist the query fails, `Pictograms` is `[]`, and every place save writes zero pictograms. UNVERIFIED without a key. |
| 2 | `'Id' => $entry['entryId']` in the normalised POI | `Pois[].Id` ↔ `nodes[].zuerst.originIds` | Low — nothing in the app reads `Pois[].Id` |
| 3 | `GINTO_SOURCE_KEY=zuerst` default | docs only say "choose the right source"; `availableSources` lists them | **High** — In Situ's/BKA's own ids may sit under a different `sourceKey` (they are *source* ids, not ZUERST POI ids — see §6.1). If wrong, **every existing link breaks**. The api-key-request explicitly asks support to confirm. |
| 4 | Does not send `Accept: application/graphql-response+json` | docs list it as required | Low–medium; Symfony's `json` option sends `Accept: */*`-ish defaults |
| 5 | Does not send `Accept-Language` | optional | Low (explicit `locale:` arguments are used instead) |
| 6 | Ignores `areas`/`subAreas` ratings | available | Medium — a venue whose accessible areas are modelled as sub-areas may surface no entry-level ratings |
| 7 | Ignores `licenseInfo` / attribution | available | **UNVERIFIED** legal obligation |
| 8 | Ignores `deletedEntries` | available | Stale links are never cleaned (already true of ZUERST) |
| 9 | `entryId` fallback written into `varchar(24)` | entry ids appear UUID-shaped | **High** — silent truncation / write failure. UNVERIFIED. |
| 10 | Adds a `Key` field to pictogram objects | not part of the legacy shape or the OpenAPI schema | Medium — changes the public API payload |
| 11 | `LinkToPictogram === LinkToPictogramSvg` | Ginto has one `iconUrl` | Medium — consumers selecting the `.jpg` get an SVG |

---

## 15. Known defects in the existing (ZUERST) implementation

| # | File:line | Defect |
| --- | --- | --- |
| 1 | `src/ApiPlatform/OccurrenceExtension.php:412`, `src/Repository/EventRepository.php:249`, `src/Repository/EventOccurrenceRepository.php:253` | `JSON_CONTAINS(JSON_EXTRACT(…))` is MySQL-only. **Errors on the Postgres production DB** (verified, §8.3). |
| 2 | `src/Form/PlaceType.php:311` | `if (!$key …)` treats `array_search` index `0` as "not found" → the first POI in the export can never be linked. |
| 3 | `src/Form/PlaceType.php:302` | Clearing the select never clears `pro_infirmis_pictograms` / `pro_infirmis_detail_url`. Observable in the In Situ data (19 detail URLs vs 12 id sources). |
| 4 | `src/Form/PlaceType.php:62` | `getData()` is called before the `proinfirmisActivated` check → ZUERST is hit even when the feature is off (verified, §9). |
| 5 | `config/packages/cache.yaml:20-22` | `pro_infirmis_cache` uses memcached, but no memcached server is deployed → the 24 h cache never hits (verified, §9). |
| 6 | `src/Command/PlaceProinfirmisUpdateCommand.php:47-59` | `findAll()` + per-row `flush()` + O(n·m) linear search; never refreshes pictograms. |
| 7 | `src/Command/PlaceProinfirmisUpdateCommand.php:72` vs `src/Form/PlaceType.php:309` | strict `===` in one place, loose `array_search` in the other — the two matchers can disagree. |
| 8 | `tests/HttpClient/ProInfirmisHttpClientTest.php` | live-network test that passes unconditionally (`getData()` returns `[]` on every error path). |
| 9 | `src/ApiResource/PlaceApi.php:168` vs `public/openapi.yaml:1313` | pictogram `Id` documented as `number` in one place and `string` in the other; stored values are integers. |
| 10 | `src/ApiResource/EventApi.php:296` | `'items' => ['type' => 'int']` — `int` is not a valid OpenAPI type (should be `integer`). |
| 11 | — | No scheduler in the repo for `app:place:proinfirmis-update`. |
| 12 | `src/Form/PlaceType.php:68` | choices keyed by POI `Name` → duplicate names silently collapse. |

---

## Porting notes

*Opinion and recommendation; everything above this line is observation.*

1. **Treat ProInfirmis/ZUERST as a dead source and build only the Ginto path.** ZUERST goes to standby on
   31 Dec 2026 — inside the likely porting window — and full shutdown on 31 Dec 2027. There is no reason to
   re-implement the `exportpois` client in NestJS. What *must* survive ZUERST is the **numeric pictogram id
   space** (1–17 as catalogued in §5), because those ids are part of the public API contract
   (`accessibility_proinfirmis[]`, `pro_infirmis_pictograms[].Id`).

2. **BKA has no data to migrate.** Exactly one BKA place (id 1, "Format-z test Ort", `enabled = false`) carries
   pictograms. The data-migration effort is zero; the *contract*-migration effort is the whole job. If BKA is
   the only tenant being ported, consider whether the feature is wanted at all before building it — and if it
   is, build it Ginto-native (string keys) rather than reproducing the legacy numeric ids. The 19 In Situ
   places are what keeps the legacy id space alive, and In Situ is not being ported here.

3. **Three blocking unknowns need a Ginto API key before any code is written**: (a) which `sourceKey` holds
   our place ids (`availableSources`), (b) the exact field set of `availableDefaultRatings` (`name` vs
   `description`), and (c) the actual rating keys, so the id map can be written. `docs/ginto-migration/api-key-request.md`
   on branch `f/lab-insitu-386` is a ready-to-send request; it needs the organisation/contact fields updated
   from In Situ to the BKA entity.

4. **Model the catalogue as data, not as denormalised JSON.** The existing design copies the whole pictogram
   object (8 fields × 4 languages) into every place row, so a label fix in Ginto never reaches already-saved
   places. In the We.Publish schema, a small `AccessibilityRating` table (`key` PK, `legacyId` int unique,
   `iconUrl`, translated labels) plus a join table to the venue is both smaller and self-healing. Keep
   `legacyId` so the public filter contract can be preserved.

5. **There is no Place/venue model to hang this on yet.** `libs/api/prisma/schema.prisma` has `model Event`
   (line 1389) with a free-text `location String?` and no `Place`, `Venue` or `Organization` model at all.
   Whoever designs the Place port owns this decision. `Event.externalSourceName` / `Event.externalSourceId`
   (lines 1407-1408) are the existing precedent for "this record mirrors a row in a third-party system" and
   are a natural shape for `{sourceKey, originId}` on a venue.

6. **Use `jsonb` or relational columns, never `text`-with-a-JSON-comment.** The current filter is broken
   precisely because `pro_infirmis_pictograms` is a `text` column queried with MySQL JSON functions. In
   Prisma, `Json` maps to `jsonb` on Postgres, and a `rating.legacyId IN (...)` join beats any JSON predicate.

7. **Make the sync a real scheduled job with idempotent upserts**, not a lazy read-through cache on the form
   render path. The present design performs an un-timeouted outbound HTTPS call (returning the entire Swiss
   POI export) on every place-form render, with a cache that does not work. A nightly job that pages through
   `entriesByFilter` (50 per page), upserts venues' ratings, and uses `deletedEntries` to unlink removed POIs
   is the shape the Ginto docs and the api-key-request already assume ("einmal täglich").

8. **The admin picker needs rethinking.** Rendering every Swiss POI as `<option>`s does not scale and already
   collapses duplicate names. A typeahead against a server-side search (`entriesBySearch` supports coordinate
   + text search) is the obvious replacement, and it also solves the manual-linking ergonomics.

9. **Decide explicitly whether the new events use place-level accessibility at all.** The port's events gain
   block-content and the draft/pending/published revision cycle; accessibility data attached to a venue is
   reference data, not revisioned content, so it should live outside the revision system and be resolved at
   read time — otherwise every nightly Ginto sync would dirty every event draft.
