# BKA admin — images, file storage, background jobs and infrastructure miscellany

> **Scope.** This document describes *what exists today* in `/Users/itrulia/Documents/insitu-admin`
> for everything that is not the event/place/organization/user domain model, the API surface or the
> admin forms: the **image and file pipeline end to end** (`Image`, `Video`, `TechnicalSheet`,
> `vich_uploader` + `flysystem` + `liip_imagine`, the resize/optimize listener, the `/img` redirect),
> the **image generator** feature, the **complete list of console commands**, **messenger queues**,
> **caching**, the **Sylius theming mechanism and the BKA theme's overrides**, the **XLSX user
> import**, the **test fixtures/factories**, the odds and ends under `src/Service`, `src/Twig`,
> `src/Encoder`, `src/Serializer/Normalizer`, `src/Doctrine/Type`, `src/DQL`, `src/Traits`,
> `src/Organization`, the **Dockerfile/entrypoint/CI**, and **every environment variable the app
> reads**. Facts are grounded in file paths with line numbers, in SQL actually run against the
> restored BKA **production** database, or in HTTP requests made against the local admin at
> `http://localhost:8080`. A short, clearly-separated *Porting notes* section is at the end.

---

## 0. Caveats about the checkout and the data

| Thing | State |
| --- | --- |
| Git HEAD | `7920869 Merge pull request #20 from wepublish/f/BKA-84-print-category` |
| Working tree | **Dirty.** `git diff HEAD --stat` shows modified `.env`, `Dockerfile`, `README.md`, `config/packages/league_oauth2_server.yaml`, `config/packages/lexik_jwt_authentication.yaml`, `docker-compose.yaml`, and a deleted `.env.gitlab-ci`. Everything below describes the **working tree** (that is what the running container was built from), and flags where the committed version differs. |
| Migrations | 67 files in `migrations/`, all recorded as applied in the restored DB. Migrations up to and including `Version20251017081234` are **MySQL** (`AUTO_INCREMENT`, `ENGINE = InnoDB`, backticks, `LONGTEXT … COMMENT '(DC2Type:json)'`). From `Version20260608120000` onwards they are **PostgreSQL** (`ALTER COLUMN … TYPE … USING`, `CREATE EXTENSION unaccent`). The set is therefore **not runnable from scratch on Postgres**. |
| `LOCALES` for BKA | The **committed** `docker-compose.yaml` had `LOCALES: de`; the **working tree** changes it to `LOCALES: fr|de`. The brief states `fr|de`. Both values appear in the project's own history — see §9.3. |

---

## 1. The image domain

### 1.1 `Image` entity — `src/Entity/Image.php`

```php
#[ORM\Entity(repositoryClass: ImageRepository::class)]
#[Vich\Uploadable]
class Image implements TranslatableInterface
{
    use TimestampableEntity;   // createdAt / updatedAt, Gedmo Timestampable
    use TranslatableEntity;    // the `labels` JSON column
```

| Property | Mapping | Groups | Notes |
| --- | --- | --- | --- |
| `id` | `INTEGER`, identity | `reader`, `archive` | line 23–27 |
| `legend` | `STRING(255) NULL` | `default`, `reader`, `archive` | **`@deprecated`** (line 30), superseded by `labels['legend']`. `#[OA\Property(deprecated: true)]`. |
| `fileName` | `STRING(255)` NOT NULL | `reader`, `archive` | the object key inside the R2 `img/` prefix |
| `file` | **not persisted** — `#[Vich\UploadableField(mapping: 'image', fileNameProperty: 'fileName')]` | — | line 41–42 |
| `position` | `INTEGER NOT NULL DEFAULT 0` | `reader`, `archive` | "Order within the owning entity's gallery; the first image is the main one" (line 44–49) |
| `organization` | `ManyToOne(inversedBy: 'images')`, `onDelete: CASCADE` | — | line 51–53 |
| `place` | `ManyToOne(inversedBy: 'images')` — **no** `onDelete` | — | line 55–56 |
| `event` | `ManyToOne(inversedBy: 'images')`, `onDelete: CASCADE` | — | line 58–60 |
| `labels` | from `TranslatableEntity`: `#[ORM\Column(name: 'labels', type: Types::JSON, nullable: true)]` | `default`, `reader`, `archive` | holds `legend` and `alt` per language |

Three behaviours matter for the port:

* **`setFile()` bumps `updatedAt`** (line 102–113) — otherwise Doctrine sees no change and Vich's listeners never fire:
  ```php
  if (null !== $file) {
      // It is required that at least one field changes if you are using doctrine
      // otherwise the event listeners won't be called and the file is lost
      $this->updatedAt = new \DateTime();
  }
  ```
* **`getAltLabels()` is deliberately *not* called `getAlt()`** (line 127–139): `MultilangCollectionType` treats a readable property matching the field name as a legacy untranslated value and would copy the whole array into a text input.
* **Path helpers are hard-coded to `img/`** (line 141–159), *relative to the admin host*, and `getFileRootDir()` still points at `public/img/` even though nothing is written there any more:
  ```php
  public function getFileRelativePath(bool $urlEncode = false): ?string
  { return self::getFileWebPath().($urlEncode ? rawurlencode($this->fileName) : $this->fileName); }
  public static function getFileWebPath(): string { return 'img/'; }
  public static function getFileRootDir(): string { return __DIR__.'/../../public/'.self::getFileWebPath(); }
  ```

### 1.2 `image` table as it really is (production)

```
\d+ image
     Column      |           Type           | Nullable |              Default
-----------------+--------------------------+----------+-----------------------------------
 id              | bigint                   | not null | nextval('image_id_seq'::regclass)
 organization_id | bigint                   |          |
 place_id        | bigint                   |          |
 event_id        | bigint                   |          |
 legend          | character varying(255)   |          | NULL::character varying
 file_name       | character varying(255)   | not null |
 created_at      | timestamp with time zone | not null |
 updated_at      | timestamp with time zone | not null |
 labels          | text                     |          |            -- (DC2Type:json)
 position        | integer                  | not null | 0
Indexes:
    "idx_252857_primary" PRIMARY KEY, btree (id)
    "idx_252857_idx_c53d045f32c8a3de" btree (organization_id)
    "idx_252857_idx_c53d045f71f7e88b" btree (event_id)
    "idx_252857_idx_c53d045fda6a219"  btree (place_id)
Foreign-key constraints:
    "fk_c53d045f32c8a3de" FK (organization_id) -> organization(id) ON DELETE CASCADE
    "fk_c53d045f71f7e88b" FK (event_id)        -> event(id)        ON DELETE CASCADE
    "fk_c53d045fda6a219"  FK (place_id)        -> place(id)        ON DELETE RESTRICT
```

Note `labels` is **`text`**, not `jsonb` — a leftover of the MySQL `LONGTEXT COMMENT '(DC2Type:json)'`
origin. Every query below has to `CAST(labels AS jsonb)`.

#### Real volumes

```sql
SELECT count(*) AS total, count(event_id) AS with_event, count(organization_id) AS with_org,
       count(place_id) AS with_place, count(legend) AS with_legend, count(labels) AS with_labels
FROM image;
```
| total | with_event | with_org | with_place | with_legend | with_labels |
| --- | --- | --- | --- | --- | --- |
| 27 571 | 27 107 | 163 | 102 | **0** | 27 571 |

* The deprecated `legend` column is **completely empty in BKA production**; everything lives in `labels`.
* `27107 + 163 + 102 = 27372`, so **199 image rows have no owner at all** (see §1.10).

By year of `created_at`: 2023 → 834, 2024 → 11 651, 2025 → 10 485, 2026 (to date) → 4 601.

#### File names

All 27 571 `file_name` values are **distinct** (1:1 with R2 objects). All of them match
`^[0-9a-f]{22}\.[A-Za-z0-9]+$` — 0 rows deviate. That is exactly Vich's `UniqidNamer`
(`vendor/vich/uploader-bundle/src/Naming/UniqidNamer.php`):

```php
$name = \str_replace('.', '', \uniqid('', true));   // 13 hex + 9 digits = 22 chars
$extension = $this->getExtension($file);
return \sprintf('%s.%s', $name, $extension);
```

Extension distribution (case preserved from the client filename):

| ext | count |
| --- | --- |
| `jpg` | 22 834 |
| `png` | 3 558 |
| `jpeg` | 812 |
| `JPG` | 338 |
| `PNG` | 20 |
| `JPEG` | 8 |
| `jfif` | 1 |

So the store contains **mixed-case extensions** and one `.jfif`, despite the upload form only
accepting `.png,.jpg,.jpeg`.

#### Sample rows

```
 id | organization_id | place_id | event_id | legend |         file_name          |       created_at       |       updated_at       |                  labels                  | position
----+-----------------+----------+----------+--------+----------------------------+------------------------+------------------------+------------------------------------------+----------
  1 |               1 |          |          |        | 653a87d3015d4115677028.png | 2023-10-26 17:37:55+00 | 2023-12-05 14:39:43+00 | {"legend":{"de":"Format-z"}}             |        0
  2 |                 |        1 |          |        | 653a8864ca599176908751.png | 2023-10-26 17:40:20+00 | 2023-12-05 14:40:02+00 | {"legend":{"de":"Format-z test"}}        |        0
  5 |                 |          |        6 |        | 655f27404bb2b909990910.PNG | 2023-11-23 11:19:44+00 | 2023-11-23 11:19:44+00 | {"legend":{"de":null}}                   |        0
  7 |                 |          |        7 |        | 655f2d67a1337860382774.jpg | 2023-11-23 11:45:59+00 | 2023-12-29 14:45:56+00 | {"legend":{"de":null}}                   |        0
 11 |                 |          |       14 |        | 65646116975eb365403684.jpg | 2023-11-27 10:27:50+00 | 2023-12-05 14:42:38+00 | {"legend":{"de":"Testbild"}}             |        0
 15 |                 |          |       18 |        | 6565b71cc1722766444767.jpg | 2023-11-28 10:47:08+00 | 2023-12-05 14:39:06+00 | {"legend":{"de":"Foto: Dario Kaufmann"}} |        0
```

#### `labels` shape in production

`SELECT jsonb_object_keys(labels::jsonb) …` returns **only `legend`** across all 27 571 rows.
The `alt` key that `ImageType` and `ImageApi` support **does not exist in the BKA data yet** —
the alt-text feature was added after the last production write we can see.

Top `labels` values:

| labels | count |
| --- | --- |
| `{"legend":{"de":null}}` | 14 340 |
| `{"legend":{"fr":null,"de":null}}` | 1 410 |
| `{"legend":{"de":"Foto: Yoshiko Kusano"}}` | 62 |
| `{"legend":{"de":"Cantonale Berne Jura 2024/2025, Foto: David Aebi"}}` | 60 |
| `{"legend":{"de":"©TOBS!"}}` | 45 |

Language-key statistics:

| has `fr` key | has `de` key | `fr` non-null | `de` non-null |
| --- | --- | --- | --- |
| 2 798 | 27 571 | **14** | 11 821 |

i.e. BKA is effectively German-only for legends; the 14 French legends are recent
(`id` 26686–27997), e.g. `© Bertrand PICHENE`, `©Moreno Gardenghi`.

#### `position`

| position | rows |
| --- | --- |
| 0 | 19 828 |
| 1 | 3 302 |
| 2 | 1 718 |
| 3 | 855 |
| 4 | 476 |
| 5 | 257 |
| 6…19 | 185, 142, 111, 101, 87, 61, 61, 58, 44, 41, 24, 24, 24, 23 |

Images per event:

| images | events |
| --- | --- |
| 1 | 16 251 |
| 2 | 1 568 |
| 3 | 850 |
| 4 | 369 |
| 5 | 217 |
| 6 | 70 |
| 7 | 41 |
| 8 | 30 |
| 9 | 10 |
| 10 | 14 |
| 11 | 26 |
| 13 | 3 |
| 14 | 14 |
| 15 | 2 |
| 16 | 17 |
| 20 | 2 |
| 25 | 5 |
| 26 | 2 |
| 28 | 14 |

`position` was added very late by `migrations/Version20260930123256.php` ("Add image.position for
gallery ordering"), which backfilled it per owner with `ROW_NUMBER() OVER (PARTITION BY <owner_id>
ORDER BY id) - 1`. The owning collections then got `#[ORM\OrderBy(['position' => 'ASC', 'id' => 'ASC'])]`
(`src/Entity/Event.php:161-164`, `src/Entity/Organization.php`, `src/Entity/Place.php`).

### 1.3 `Video` entity — `src/Entity/Video.php`

A three-column entity: `id`, `embedLink` (`STRING(255)` NOT NULL, group `reader`), `event`
(`ManyToOne(inversedBy: 'videos')`, `onDelete: CASCADE`) plus `TimestampableEntity`.
It is **not** `Vich\Uploadable` and **not** `TranslatableInterface` — it is just a URL.

```
\d+ video
   Column   |           Type           | Nullable | Default
------------+--------------------------+----------+-----------------------------------
 id         | bigint                   | not null | nextval('video_id_seq'::regclass)
 event_id   | bigint                   |          |
 embed_link | character varying(255)   | not null |
 created_at | timestamp with time zone | not null |
 updated_at | timestamp with time zone | not null |
```

Production data: **2 025 videos on 1 906 distinct events**.

| host | count |
| --- | --- |
| youtube / youtu.be | 1 855 |
| vimeo | 140 |
| other | 30 |

The "other" bucket is *not* video at all in several cases — the field is a free-text URL with only a
`Url` constraint (`src/Form/Type/VideoType.php:28-30`). Real production values include:

```
https://meisterzyklus.ch/wp-content/uploads/2024/01/Jan-Lisiecki-1-MPEG-4.mp4
https://buehnenbern.ch/site/assets/files/21893/thumbnails64.jpg     <- a JPEG
https://www.stewyvonwattenwyl.ch/music
https://nikkoy.bandcamp.com/
https://open.spotify.com/intl-de/track/7pEqFcVLNGGRv1NSTTFCcN?si=...
https://www.instagram.com/reel/DA27nRCSJi9/?igsh=...
https://www.srf.ch/play/tv/-/video/-?urn=urn:srf:video:7e68d7fe-...
https://www.google.com/search?q=Trailer+leave+no+trace&oq=...      <- a Google search
https://www.linkedin.com/posts/bernerkammerorchester_...
```

Videos are gated behind `ACTIVATE_EVENT_VIDEOS` (`true` for BKA); `src/Form/EventType.php:471-486`
only adds the `videos` collection when `$this->eventVideosActivated`.

### 1.4 `TechnicalSheet` — the second Vich mapping (`file`)

`src/Entity/TechnicalSheet.php` is the twin of `Image` for PDFs attached to a **Place**:
`#[Vich\UploadableField(mapping: 'file', fileNameProperty: 'fileName')]` (line 41), web path
`file/` (line 110-113), deprecated `title` column superseded by `labels['title']`.

Production holds exactly **1** technical sheet:

```
 id | place_id |                            file_name                            |                         labels
----+----------+-----------------------------------------------------------------+--------------------------------------------------------
  1 |      197 | 65ad4ce50d49b_2024 01 21 Anreiseplan Öffnungszeiten Galerie.pdf | {"title":{"de":"Anreiseplan und Öffnungszeiten"}}
```

That filename confirms the `file` mapping uses `OrignameNamer`: `uniqid().'_'.$clientOriginalName`
— **spaces and non-ASCII characters are preserved in the object key**.

### 1.5 Storage configuration: Vich → Flysystem → Cloudflare R2

`config/packages/vich_uploader.yaml` (whole file):

```yaml
vich_uploader:
    db_driver: orm
    storage: flysystem
    metadata:
        type: attribute
    mappings:
        image:
            uri_prefix: '%env(R2_PUBLIC_BASE)%/img'
            upload_destination: 'r2_image.storage'
            namer: Vich\UploaderBundle\Naming\UniqidNamer

        file:
            uri_prefix: '%env(R2_PUBLIC_BASE)%/file'
            upload_destination: 'r2_file.storage'
            namer: Vich\UploaderBundle\Naming\OrignameNamer
```

`config/packages/flysystem.yaml`:

```yaml
flysystem:
    storages:
        r2_image.storage:
            adapter: 'aws'
            options:
                client:  'Aws\S3\S3Client'
                bucket: '%env(string:R2_BUCKET)%'
                prefix: 'img'
        r2_file.storage:
            adapter: 'aws'
            options:
                client: 'Aws\S3\S3Client'
                bucket: '%env(string:R2_BUCKET)%'
                prefix: 'file'
```

`config/services.yaml:59-68`:

```yaml
  Aws\S3\S3Client:
    arguments:
      -
        version: 'latest'
        region: '%env(string:R2_REGION)%'
        endpoint: '%env(string:R2_ENDPOINT)%'
        use_path_style_endpoint: true
        credentials:
          key: '%env(string:R2_ACCESS_KEY)%'
          secret: '%env(string:R2_SECRET_KEY)%'
```

**Both mappings share one bucket** (`R2_BUCKET`), separated only by the `img/` and `file/` prefixes.
None of `R2_BUCKET`, `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_PUBLIC_BASE` has a default
in `.env`, so the container cannot boot without them being injected by the deployment.
`R2_REGION: auto` is the only one set in `docker-compose.yaml` (line 40).

Vich's own defaults apply (`vendor/vich/uploader-bundle/src/DependencyInjection/Configuration.php`):
`delete_on_remove: true` (line 129), `delete_on_update: true` (line 131), `inject_on_load: false`
(line 132). So removing an `Image` **entity** through Doctrine deletes the R2 object; a DB-level
`ON DELETE CASCADE` (deleting an Event) does **not** — see §1.10.

#### History: this used to be local disk

`git show f64cea4` ("Added S3 storage support", Elias Summermatter, **2026-01-22**) is the commit
that moved storage off the container filesystem:

```diff
 vich_uploader:
     db_driver: orm
+    storage: flysystem
     mappings:
         image:
-            uri_prefix: /img
-            upload_destination: '%kernel.project_dir%/public/img'
+            uri_prefix: '%env(R2_PUBLIC_BASE)%/img'
+            upload_destination: 'r2_image.storage'
```

The same commit switched the Imagine loader from `filesystem` to `flysystem`, deleted the
`liip_imagine.{jpegoptim,pngquant,cwebp}.binary` parameter overrides, and added the `S3Client`
service. Everything in §1.7 follows from it.

`public/img/` and `public/file/` still exist in the repo but contain only a `.gitignore`.

### 1.6 Upload paths — the three ways an image enters the system

| # | Entry point | Form/type | Validation | Namer |
| --- | --- | --- | --- | --- |
| 1 | Admin event/organization/place form (`/[locale]/…/edit`) | `src/Form/EventType.php:456-469` `CollectionType` of `src/Form/Type/ImageType.php` | `Image(mimeTypes: image/jpg, image/jpeg, image/png)`, `NotBlank`, `File(maxSize: '10M')`; `accept=".png,.jpg,.jpeg,image/png,image/jpeg"` | `UniqidNamer` |
| 2 | Public "propose an event" wizard, step 2 | same `ImageType`, block `_propose_event_step2_images_lists_row` (`templates/form/fields.html.twig:71`) | same | `UniqidNamer` |
| 3 | REST API `POST /api/v2/images` (`multipart/form-data`) | `src/ApiResource/ImageApi.php:28-58` → `src/State/ImageEntityDtoPostStateProcessor.php` | `#[Assert\NotNull]` on `$file` only — the OpenAPI description says *"WARNING: only files with the extensions jpg, jpeg and png are allowed"* but `ImageApi.php:82` carries a literal `// TODO only jpg jpeg and png extensions` | `UniqidNamer` |

`ImageType` (`src/Form/Type/ImageType.php`) also defines the per-language text fields:

```php
public const TEXT_MAX_LENGTH = 125;   // legend and alt
->add('legend', MultilangCollectionType::class, ['property_path' => 'labels[legend]', ...])
->add('alt',    MultilangCollectionType::class, ['property_path' => 'labels[alt]',    ...])
->add('position', HiddenType::class, ['attr' => ['data-image-collection-target' => 'position']])
```

and on `PRE_SET_DATA` (line 99-126) swaps `VichFileType` for `VichImageType` (with `image_uri: true`)
once the entity already has a `fileName`, so the existing picture is shown as a thumbnail.
Note line 105: `if (file_exists($entity->getFileAbsolutePath()))` — this probes
`public/img/<file>`, which **never exists any more since the R2 move**, so the local `File` object
is never re-attached (harmless, but dead).

There is a fourth, legacy, non-API form: `src/Form/ApiForm/ApiImageType.php` accepts a
**base64 string plus an explicit `fileExtension` choice** (`.jpg`, `.jpeg`, `.png`), writes it to
`var/tmp/image_<uniqid><ext>` and wraps it in a `Vich\ReplacingFile`.

#### Multipart decoding

API Platform needs help reading `multipart/form-data`. Two tiny classes do it:

* `src/Encoder/MultipartDecoder.php` — `const FORMAT = 'multipart'`; `decode()` returns
  `$request->request->all()` with every value `json_decode`d when it parses as an array, merged with
  `$request->files->all()`. This is what lets the client send
  `labels={"legend":{"fr":"…","de":"…"},"alt":{…}}` as a form field.
* `src/Serializer/Normalizer/UploadedFileDenormalizer.php` — `supportsDenormalization()` returns true
  for anything `instanceof File` and `denormalize()` returns the value untouched, "to ensure the
  uploaded file is not denormalized". It carries an unusual `__call()` shim standing in for
  `getSupportedTypes()`.

#### Client-side pre-shrink — `assets/js/ImageResizer.ts`

Before the browser even posts the form, a delegated `change` listener on every
`input[type=file][accept*="image/"]` shrinks oversize files:

```ts
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const SCALE_STEP = 0.85;
const MAX_ITERATIONS = 12;
```

JPEG: drop quality from 0.85 in 0.1 steps down to 0.6, then scale dimensions by 0.85 per iteration.
PNG: dimensions only (canvas PNG ignores quality). A JPEG re-encode renames the file to `.jpg`.
On failure it clears the input and shows `misc.image_too_large` with `size: '10 MB'`.
Submit buttons are disabled while shrinking.

#### Gallery UX — `assets/controllers/image-collection_controller.js`

A 333-line Stimulus controller wrapping the a2lix Symfony collection:
`ACCEPTED_TYPES = ['image/jpeg','image/jpg','image/png']`; multi-file picker and drag-and-drop onto
the gallery; a page-wide guard that swallows file drops elsewhere so a half-filled form is not lost;
drag-handle reordering that rewrites every row's hidden `position` input; `is-main` class on row 0
("The first image is the one shown in the agenda"); per-field character counters against
`maxlength`; and `img.error` handling that strips `src` so a broken thumbnail shows an empty frame
instead of the browser's broken-image icon.

German UI strings (`translations/messages.de.yml:488-508`):

```yaml
images:
  _label: "Bild/er (optional)"
  main: "Hauptbild"
  reorder: "Bild verschieben"
  remove: "Bild entfernen"
  add:
    _label: "Dateien hinzufügen"
    _help: "Wählen Sie ein oder mehrere Bilder in den folgenden Formaten: jpg / png"
    _rejected: "%count% Datei(en) ignoriert: Es können nur jpg- und png-Bilder hinzugefügt werden."
  footer:
    _help: "Ihr Hauptbild ist dasjenige, das hervorgehoben wird. Die Dateien werden für die Anzeige automatisch optimiert."
  legend:
    _placeholder: "Beispiel: Grafik von Visual Studio | Freiburg"
    _help: "Künstlernachweis oder Zusatzinfo, sichtbar unter dem Bild"
  alt:
    _label: "Alternativtext"
    _help: "Nützlich für Suchmaschinen und Barrierefreiheit. Beschreiben Sie kurz, was Ihr Bild zeigt: wo, was, wann und wie."
```

### 1.7 Server-side resize / optimize — `src/EventListener/ResizeImageUploadedListener.php`

Subscribes to `Vich\UploaderBundle\Event\Events::POST_UPLOAD` and, for `Image` entities only:

1. `$uploadDirectory = $event->getMapping()->getUploadDestination();`
2. `$imagePath = $uploadDirectory.'/'.$entity->getFileName();`
3. `$this->imagine->open($imagePath)` — `Imagine\Image\ImagineInterface` is **aliased to
   `liip_imagine.gd`** in `config/services.yaml:71-72` (GD), even though LiipImagine itself is
   configured with `driver: "imagick"`.
4. `Imagine\Filter\Basic\Autorotate` (EXIF orientation).
5. `RelativeResize('widen', 2000)` if wider than 2000 px; `RelativeResize('heighten', 2000)` if taller.
6. `$image->save(null, ['quality' => 100, 'resolution-units' => PIXELSPERINCH, 'resolution-x' => 72, 'resolution-y' => 72])`.
7. `PngquantPostProcessor()` — **constructed with no arguments**, so it uses liip's default binary
   `/usr/bin/pngquant` and `quality = [80, 100]`. The injected `$pngquantExecPath` is **never used**.
8. `JpegOptimPostProcessor($this->jpegOptimExecPath, strip: false, progressive: false)` then
   `->process($binary, ['strip' => 'none'])` — deliberately *lossless*:
   `// don't set quality to do a lossless compression, setting the parameter quality will do a lossy compression, even with 100`
9. `file_put_contents($imagePath, $imageBinary->getContent());`
10. The whole body is wrapped in `try { … } catch (\Exception $e) { error_log($e->getMessage()); }`.

> **Finding — this listener is dead code since 2026-01-22.**
> `PropertyMapping::getUploadDestination()` returns the *raw configured value*
> (`vendor/vich/uploader-bundle/src/Mapping/PropertyMapping.php:312-315`), which under
> `storage: flysystem` is the **service id string** `r2_image.storage`, not a path. So step 2
> produces `r2_image.storage/<filename>`, step 3 throws, and the exception is swallowed by the
> `catch` at line 95-97 into `error_log`. Nothing is resized, auto-rotated, jpegoptim'd or
> pngquant'd on the server any more. Before commit `f64cea4` the destination was
> `%kernel.project_dir%/public/img`, a real directory, and the listener worked.
> The only surviving size control is the **client-side 10 MB shrink** (§1.6) and the 10 MB
> `File` constraint.
> *Not directly executed to confirm the exception — but `getUploadDestination()` demonstrably
> returns the service id, and no `public/img` files exist in the running container.*

Binaries are nonetheless present in the runtime image (`Dockerfile:92-105`): `webp`, `jpegoptim`,
`pngquant`, `libmagickwand-6.q16-6`, plus the `imagick` PHP extension.

### 1.8 Derivative URLs — LiipImagine

`config/packages/liip_imagine.yaml` (whole file):

```yaml
liip_imagine:
    driver: "imagick"

    loaders:
        default:
            flysystem:
                filesystem_service: 'r2_image.storage'

    data_loader: default

    resolvers:
        default:
            web_path:
                web_root: '%kernel.project_dir%/public'

    filter_sets:
        cache: ~
        webp:
            quality: 80
            format: webp
            filters:
                thumbnail: { size: [2000, 2000], mode: inset }
            post_processors:
                cwebp: { metadata: ['none'], q: 70, alphaQ: 70, alphaFilter: 'fast' }

        webp_size_512_q_65:
            quality: 65
            format: webp
            filters:
                thumbnail: { size: [512, 512], mode: inset }
            post_processors:
                cwebp: { metadata: ['none'], q: 70, alphaQ: 70, alphaFilter: 'fast' }

        webp_size_1024_q_65:
            quality: 65
            format: webp
            filters:
                thumbnail: { size: [1024, 1024], mode: inset }
            post_processors:
                cwebp: { metadata: ['none'], q: 70, alphaQ: 70, alphaFilter: 'fast' }

    default_filter_set_settings:
        format: webp

    webp:
        generate: true
```

| Filter set | Max box | Imagine quality | cwebp `q` | Used by |
| --- | --- | --- | --- | --- |
| `cache` | — (empty definition, inherits `format: webp`) | — | — | **nothing** — defined but never referenced anywhere in `src/`, `templates/`, `themes/` or `assets/` |
| `webp` | 2000×2000 inset | 80 | 70 | `url_webp` |
| `webp_size_512_q_65` | 512×512 inset | 65 | 70 | `url_webp_size_512_q_65` |
| `webp_size_1024_q_65` | 1024×1024 inset | 65 | 70 | `url_webp_size_1024_q_65` |

* **Source** of every derivative is the R2 object (flysystem loader).
* **Destination** of every derivative is the **container's own local disk**:
  `web_path` resolver with `web_root = public/`, default cache prefix `media/cache` →
  `public/media/cache/<filter>/<filename>`. The Dockerfile creates `public/media`
  (`Dockerfile:142`) and `docker-compose.yaml:19` bind-mounts `./public` over it locally.
  **The derivative cache is ephemeral per container and is not on R2.**
* Routes are loaded by `config/routes/liip_imagine.yaml` →
  `liip_imagine_filter: /media/cache/resolve/{filter}/{path}` and
  `liip_imagine_filter_runtime: /media/cache/resolve/{filter}/rc/{hash}/{path}`.
* Because `webp.generate: true`, `CacheManager::getBrowserPath()` **never** short-circuits to the
  stored file (`vendor/liip/imagine-bundle/Imagine/Cache/CacheManager.php:119-121`:
  `return !$this->webpGenerate && $this->isStored(...) ? resolve(...) : generateUrl(...)`).
  Every `url_webp*` the API emits is therefore always the **absolute `/media/cache/resolve/…` URL
  on the admin host**, which 301-redirects to `/media/cache/<filter>/<file>` once generated.
  Locally this returns `500` (no R2 credentials):
  `GET http://localhost:8080/media/cache/resolve/webp/653a87d3015d4115677028.png → 500`.

The binary paths used by the `cwebp` post-processor are liip's defaults
(`vendor/liip/imagine-bundle/Resources/config/imagine.xml:10,25,33`):
`/usr/bin/jpegoptim`, `/usr/bin/pngquant`, `/usr/bin/cwebp`. The project's
`liip_imagine.*.binary` parameter overrides were **removed** in `f64cea4`, which makes
`CWEBP_EXEC_PATH` (still present in `.env:88`) a **dead environment variable**.

### 1.9 How URLs reach consumers

Two places compute the same four URLs — the legacy serializer and the API Platform mapper.

`src/Serializer/Normalizer/ImageNormalizer.php:18-28` (v1 API / `image_generator/events` JSON):

```php
$data['url'] = $this->router->generate('index', [], UrlGeneratorInterface::ABSOLUTE_URL)
             . $object->getFileRelativePath(true);                      // https://<admin>/img/<file>
$data['url_webp']                 = $this->cacheManager->getBrowserPath($object->getFileName(), 'webp');
$data['url_webp_size_512_q_65']   = $this->cacheManager->getBrowserPath($object->getFileName(), 'webp_size_512_q_65');
$data['url_webp_size_1024_q_65']  = $this->cacheManager->getBrowserPath($object->getFileName(), 'webp_size_1024_q_65');
```

`src/Mapper/ImageEntityToApiMapper.php:40-49` (API v2) is identical plus
`$dto->legend`, `$dto->fileName`, `$dto->labels`, `$dto->alt = $entity->getAltLabels()`.

`src/ApiResource/ImageApi.php` exposes, under the serialization groups
`api:image:read-item`, `api:event:read-item`, `api:event:read-collection`,
`api:occurrence:read-collection`, `api:occurrence:read-lite-collection`,
`api:place:read-item`, `api:organization:read-item`:
`id`, `legend` (deprecated), `fileName`, `alt`, `labels`, `url`, `urlWebp`,
`urlWebpSize_512_q_65`, `urlWebpSize_1024_q_65`.
The serializer is configured with `name_converter: serializer.name_converter.camel_case_to_snake_case`
(`config/packages/framework.yaml:29-30`), so the wire names are `file_name`, `url_webp`,
`url_webp_size_512_q_65`, `url_webp_size_1024_q_65`.

Operations on `/api/v2/images`: `GetCollection`, `Get`, `Post` (multipart, `is_granted("ROLE_USER")`,
processor `ImageEntityDtoPostStateProcessor`), `Delete` (`is_granted("IMAGE_API_EDIT", object)`).
Resource-level security: `is_granted("ROLE_USER") or is_granted("ROLE_BROADCAST_PARTNER")`.
`outputFormats: ['jsonld' => ['application/ld+json']]`.

**`ImageApiVoter`** (`src/Security/Voters/ImageApiVoter.php`) decides `IMAGE_API_EDIT`:
`ROLE_ADMIN` → always yes; otherwise the image must belong to an event owned by the user, or to an
organization/place whose organization has the user; a **`null` subject returns true** ("to be able
to create new image, not sure if it's the best way"), and an **orphan image returns true**
("orphean images can be assigned"). `src/Validator/EventImagesValidator.php` reuses the voter to
block reassigning somebody else's image onto your event.

#### `/img/{path}` — `src/Controller/ImageRedirectController.php`

```php
#[Route('/img/{path}', name: 'legacy_image_redirect', requirements: ['path' => '.+'])]
public function __invoke(string $path): Response
{
    if (str_contains($path, '..')) { return new Response('Not found', 404); }
    $base = rtrim($_ENV['R2_PUBLIC_BASE'], '/');
    $response = new RedirectResponse($base . '/img/' . $path, 302);
    $response->setPublic();
    $response->setMaxAge(86400);
    $response->setSharedMaxAge(86400);
    return $response;
}
```

This keeps the historical `https://<admin-host>/img/<file>` URLs (still what `url` returns) working
after the R2 move, as a cacheable 302. It is the **only** place in `src/` that reads `$_ENV` directly.
Verified live: `GET http://localhost:8080/img/653a87d3015d4115677028.png` → `302` with
`Location: http://localhost:8080/img/653a87d3015d4115677028.png` — i.e. with `R2_PUBLIC_BASE=""`
(as `.env.local:26` sets it) the route **redirects to itself**, an infinite loop. Production must set
a non-empty `R2_PUBLIC_BASE`.

Admin-side thumbnails do *not* go through this: `uri_prefix: '%env(R2_PUBLIC_BASE)%/img'` means
`VichImageType`'s `image_uri` already points straight at `R2_PUBLIC_BASE/img/<file>`
(`templates/bundles/VichUploaderBundle/Form/fields.html.twig:34-38`).

### 1.10 Deletion semantics and the 199 orphans

| Owner | Mapping | Consequence |
| --- | --- | --- |
| `Event::$images` | `OneToMany(cascade: ['persist','remove'])`, **no `orphanRemoval`** (`src/Entity/Event.php:161-164`) | Removing a row in the event form calls `removeImage()`, which only sets `$image->setEvent(null)` (line 524-533). The `image` row survives with all three FKs `NULL`, and the R2 object is **never deleted**. |
| `Place::$images` | `OneToMany(cascade: ['persist','remove'], orphanRemoval: true)` | properly deleted |
| `Organization::$images` | `OneToMany(cascade: ['persist'])` only | neither removed nor orphan-removed |
| DB level | `image.event_id` / `image.organization_id` → `ON DELETE CASCADE` | deleting an Event/Organization row removes `image` rows **in SQL**, bypassing Doctrine, so Vich never runs and the R2 objects leak |

Measured in production:

```sql
SELECT count(*) FROM image WHERE event_id IS NULL AND organization_id IS NULL AND place_id IS NULL;
-- 199
SELECT min(created_at), max(created_at) FROM image WHERE event_id IS NULL AND organization_id IS NULL AND place_id IS NULL;
-- 2023-11-30 15:23:57+00 | 2026-05-05 14:26:00+00
```

199 orphan rows accumulated steadily over the whole lifetime of the product. There is **no garbage
collection command** for them or for the matching R2 objects.

### 1.11 Bucket-to-bucket copy script — `tools/sync-staging-images.sh`

The only other file-storage tooling. It sources `.env` then `.env.local` with `set -a` so
`RCLONE_CONFIG_*` is exported, asserts eight variables are set, and runs:

```bash
rclone copy "SRC:${SRC_BUCKET}" "DST:${DST_BUCKET}" --transfers 16 --checkers 32 --stats 60s --stats-one-line -v
rclone check "SRC:${SRC_BUCKET}" "DST:${DST_BUCKET}" --size-only --one-way
```

Comment: *"Incremental copy: only transfers missing/changed files, never deletes at destination"*.
Both remotes are typed `s3` with `provider = Cloudflare`, `region = auto`,
`no_check_bucket = true` (`.env:114-134`).

---

## 2. The image generator (`ACTIVATE_IMAGE_GENERATOR`)

A React 18 + Redux Toolkit single-page widget mounted into a Twig page, used to produce social
media artwork for an event. **`ACTIVATE_IMAGE_GENERATOR` defaults to `false` (`.env:90`) and is not
set at all in `docker-compose.yaml`, so it is OFF for BKA locally.**

### 2.1 Server side — `src/Controller/ImageGeneratorController.php`

| Route | Name | Method | What it does |
| --- | --- | --- | --- |
| `/image_generator` | `app_image_generator` | GET | renders `templates/image_generator/index.html.twig` |
| `/image_generator/event/{eventId}` | `app_image_generator_event` | GET | same template with `data-event-id` preset |
| `/image_generator/events` | `app_image_generator_get_events` | GET | JSON list of events with `dateTo >= today`, `leftJoin` place + organization; **non-admins are restricted to their own organizations** (401 `No organizations found for the user` if they have none); serialized with group `default` and a `circular_reference_handler` returning `->getId()` |
| `/image_generator/upload-og-images` | `upload_og_images` | **POST** | takes `eventId`, `ogImageFr`, `ogImageDe` files; requires `ROLE_USER`; `uniqid().'.'.$image->guessExtension()`; `move()`s them into **`public/img/event-og-images/`** (local disk, *not* R2) and stores `/img/event-og-images/<name>` into `Event::$ogImage[<locale>]` |
| `/image_generator/remove-og-images` | `remove_og_images` | **POST** | `unlink()`s the files for each locale in `explode('|', $this->locales)` and clears `Event::$ogImage` |

`Event::$ogImage` is `#[ORM\Column(type: Types::JSON, nullable: true)]` (`src/Entity/Event.php:241-243`)
with `getOgImageForLocale()` / `setOgImageForLocale()` helpers (lines 833-857).

Production usage: `SELECT count(*) FROM event WHERE og_image IS NOT NULL` → **9**, and all nine hold
`[]` (the feature was used then undone). So no BKA event currently has a generated OG image.

Menu entries are gated on the Twig global `imageGeneratorActivated`
(`templates/includes/header.html.twig:115-123` and `templates/datatables/event-actions.html.twig:16-17`).

### 2.2 Client side — `assets/apps/*`

| File | Role |
| --- | --- |
| `RootApp.tsx` | Redux `Provider` + TanStack `QueryClientProvider` |
| `App.tsx` | layout; Safari warning (`navigator.userAgent.includes('Safari') && !includes('Chrome')`); reads `data-event-id` |
| `Events.tsx`, `Categories.tsx` | selectors driven by `/image_generator/events` |
| `Preview.tsx` | the artwork itself: date range, place/organization (deduplicated when equal), event name, category chips, website line; scaled from a 1080 px design width |
| `Color.tsx` | background colour derived from the chosen category's `tag_color` |
| `Download.tsx` | builds a ZIP with `jszip`, folders `Fr/` and `De/`, three aspect ratios, saved via `file-saver` |
| `OpenGraph.tsx` | choose "event image" vs "generated image" as the OG image; POSTs to `upload-og-images` / `remove-og-images` |
| `hooks/useScreenshot.tsx` | `html2canvas` of the preview, with a Safari repaint hack (nudge width by 10 px then restore) |
| `utils/imageUtils.ts` | `captureImage()` renders at exact pixel sizes; `base64ToBlob()`; `getSizeString()` |
| `store/imageGeneratorSlice.ts` | state; also the hard-coded colour-name map |

Output sizes (`assets/apps/utils/imageUtils.ts:27-34, 86-95`):

| aspect ratio | pixels | label key |
| --- | --- | --- |
| `1:1` | 1080×1080 | `…RATIO_LABEL_SQUARE` |
| `4:5` | 1080×1350 | `…RATIO_LABEL_RECTANGLE` |
| `9:16` | 1080×1920 | `…RATIO_LABEL_STORY` |

ZIP entry names: `${IMAGE_GENERATOR_PACK_ORG}_ID${eventID}_{fr|de}_{1080x1080|1080x1350|1080x1920}.png`;
archive name `${PACK_ORG}_${PACK_NAME}_ID${eventID}.zip`.
OG uploads are named `Event_<id>_og_fr.png` / `Event_<id>_og_de.png`, always captured at `1:1`.

Category colour names hard-coded in `store/imageGeneratorSlice.ts:27-36`:

```ts
'#01646A': { fr: 'Turquoise', de: 'Türkis' },   '#FFAAFF': { fr: 'Rose',       de: 'Rosa' },
'#FF4D00': { fr: 'Orange',    de: 'Orange' },   '#75FB70': { fr: 'Vert',       de: 'Grün' },
'#1983FF': { fr: 'Bleu',      de: 'Blau' },     '#863D15': { fr: 'Marron',     de: 'Braun' },
'#FFDF00': { fr: 'Jaune',     de: 'Gelb' },     '#93B27F': { fr: 'Vert clair', de: 'Hellgrün' }
```

The OG preview falls back to `/og-image.jpg` (a 275 KB file committed at `public/og-image.jpg`)
when the event has no usable `url_webp_size_1024_q_65` (HEAD-checked first).

---

## 3. Console commands — the complete list

Nine `#[AsCommand]` classes in `src/Command/`. **There is no scheduler anywhere in the repository**
(no cron file, no `symfony/scheduler`, no k8s CronJob, no `messenger:consume` in the entrypoint or
CI). `dragonmantank/cron-expression` is a direct `composer.json` requirement but is referenced
nowhere in `src/` or `config/`. The only documented invocation guidance is the README's
"Be sure to have the data up to date to support this feature" list.

| Command | Class | Arguments | Purpose | Intended cadence |
| --- | --- | --- | --- | --- |
| `app:events:calculate-event-occurences` *(sic — one "r")* | `EventsCalculateOccurrencesCommand` | none | Loads every event **id** first (`SELECT e.id`), then per event clears existing `EventOccurrence`s and recreates them: one occurrence for `RECURRENCE_NONE`, otherwise one per `EventDatesCalculator::getFromToRelatedRecurrenceDates()`. Flushes + `clear()`s every 100 events to bound memory. | **One-off backfill** before enabling `USE_OPTIMIZED_EVENT_LOAD` (README §9). Afterwards `OnFlushEventListener` maintains occurrences on every write. |
| `app:events:update-multiday` | `EventsUpdateMultidayCommand` | none | `$event->setIsMultiDayEvent($event->isMultiDayEvent())` for all events — "before, was calculated on the flight but now stored in db". One `flush()` at the end, `findAll()` → whole table in memory. | one-off backfill |
| `app:events:update-related-dates` | `EventsUpdateRelatedDatesCommand` | none | Touches `updatedAt` on every event so the Doctrine `onFlush` listener recomputes `relatedDates`. Flushes per event (`add($event, true)`). | one-off backfill |
| `app:events:update-subevent-organization` | `EventsUpdateSubeventOrganizationCommand` | none | Copies `mainEvent.organization` onto each `SubEvent`. Flush every >100. | one-off backfill |
| `app:events:update-subevent-users` | `EventsUpdateSubeventUsersCommand` | none | Copies `mainEvent.user` onto each `SubEvent`. Flush every >100. | one-off backfill |
| `app:events:update-subevents-categories` | `SubeventsUpdateCategoriesCommand` | none | `$subEvent->setCategories($mainEvent->getCategories())` for all sub-events. | one-off backfill |
| `app:import-users-xlsx` | `ImportUsersXlsxCommand` | `pathToFile` (**required**) | See §7. | ad-hoc, run by an operator |
| `app:oauth-accesstoken-generator` | `OauthAccessTokenGeneratorCommand` | `email`, `scope`, `client_id` (all required), `access_token_duration` (optional, PHP duration, default `PT1H`) | Prints an OAuth2 access token + refresh token for a user. Description is still the maker-bundle placeholder *"Add a short description for your command"*. | ad-hoc |
| `app:place:proinfirmis-update` | `PlaceProinfirmisUpdateCommand` | none | Pulls the ZUERST POI export via `ProInfirmisAPICacheManager`, and for every `Place` with a `proInfirmisIdSource` refreshes `proInfirmisDetailUrl` from the matching POI's `LinkToDetailView`. Fails with `Command::FAILURE` if the payload lacks `Pictograms`/`Pois`. Shows a progress bar over all places. | **periodic** (the upstream cache TTL is 24 h, see §5) — but nothing schedules it |

### 3.1 ProInfirmis: what BKA production actually has

`src/ProInfirmis/ProInfirmisHttpClient.php:19-22` calls
`https://zuerst.proinfirmis.ch/api/v1/tasks/exportpois?key=<PROINFIRMIS_KEY>&format=json`, logs an
error on non-200 and returns `[]` on transport failure.
`src/ProInfirmis/ProInfirmisAPICacheManager.php` wraps it in the `pro_infirmis_cache` pool with
`expiresAfter(86400)` under the key `pro_infirmis_get_data`.

Production data:

```sql
SELECT count(*) AS places, count(pro_infirmis_id_source) AS with_pi_id,
       count(pro_infirmis_pictograms) AS with_pictos, count(pro_infirmis_detail_url) AS with_url
FROM place;
--  1276 | 7 | 1276 | 1
```

Of those 7 non-null `pro_infirmis_id_source` values, **6 are empty strings**; only place `id = 1`
(`Format-z test Ort`, the developer's test place) carries a real id (`265`), a detail URL
(`https://zuerst.proinfirmis.ch/pois/detail/16672`) and three pictograms. Every other place has
`pro_infirmis_pictograms = '[]'`.

**Conclusion: the ProInfirmis integration carries no real BKA data.** That is consistent with
`ACTIVATE_PROINFIRMIS: false` in `docker-compose.yaml:46`. *UNVERIFIED:* the value used by the real
production deployment — only the deployment's own environment would settle it; the DB contents are
strong circumstantial evidence that it is off.

The **Ginto** successor API (`ACTIVATE_GINTO`, `GINTO_API_URL`, `GINTO_API_KEY`, `GINTO_FILTER_ID`,
`GINTO_SOURCE_KEY`) is documented in `README.md:94-120` — including a `bin/console app:ginto:ratings`
command and a `ginto_rating_legacy_ids` parameter in `config/services.yaml` — but **neither exists in
this checkout**: `rg -ni ginto src config templates assets` returns nothing, and `config/services.yaml`
has no such parameter. The README is ahead of the code (the env block was added in the uncommitted
`.env` diff). ZUERST is stated to shut down **end of 2026**.

---

## 4. Messenger and background jobs

`config/packages/messenger.yaml` (whole file, comments trimmed):

```yaml
framework:
    messenger:
        failure_transport: failed
        transports:
            async:
                dsn: '%env(MESSENGER_TRANSPORT_DSN)%'
                options: { use_notify: true, check_delayed_interval: 60000 }
                retry_strategy: { max_retries: 3, multiplier: 2 }
            failed: 'doctrine://default?queue_name=failed'
            sync: 'sync://'
        routing:
            Symfony\Component\Mailer\Messenger\SendEmailMessage: sync
            Symfony\Component\Notifier\Message\ChatMessage: async
            Symfony\Component\Notifier\Message\SmsMessage: async
```

* `MESSENGER_TRANSPORT_DSN` is `doctrine://default?auto_setup=0` everywhere
  (`.env:23`, `.env.local:6`, `docker-compose.yaml:30`).
* **Emails are sent synchronously** inside the request (`SendEmailMessage: sync`).
* `ChatMessage`/`SmsMessage` are routed `async`, but `rg -n "MessageBusInterface|NotifierInterface|ChatMessage|SmsMessage" src` finds **no dispatch anywhere** — the Notifier is configured
  (`config/packages/notifier.yaml`, all channel policies `['email']`, `admin_recipients: admin@example.com`)
  but unused.
* There are **no application messages** (`src/Message/` does not exist).
* The `messenger_messages` table exists in production and is **empty**
  (`SELECT queue_name, count(*) FROM messenger_messages GROUP BY 1` → 0 rows).
* **No worker is started**: `docker/entrypoint.sh` ends with `exec "$@"` → `apache2-foreground`; no
  `messenger:consume` appears in the Dockerfile, compose file or CI.

> There are effectively **no background jobs** in this application. Everything is request-scoped or
> an operator-run console command.

---

## 5. Caching

| Layer | Configuration | Notes |
| --- | --- | --- |
| Symfony `cache.app` / `cache.system` | defaults (filesystem under `var/cache`) — `config/packages/cache.yaml` leaves everything commented out | |
| `pro_infirmis_cache` pool | `adapter: cache.adapter.memcached` (`cache.yaml:20-22`) | No `default_memcached_provider` is configured anywhere, so Symfony's default `memcached://localhost` applies. **No memcached service exists in `docker-compose.yaml`.** The PHP `memcached` extension *is* installed (`Dockerfile:62-63,104`). Only reachable code path is `ProInfirmisAPICacheManager` (TTL 86 400 s). |
| Doctrine query/result cache | `when@prod` only: `doctrine.result_cache_pool → cache.app`, `doctrine.system_cache_pool → cache.system` (`config/packages/doctrine.yaml:44-62`) | |
| OPcache | `Dockerfile:110-128`: `opcache.enable=1`, `enable_cli=0`, `validate_timestamps=1`, `revalidate_freq=0`, `max_accelerated_files=20000`, `memory_consumption=256`, `interned_strings_buffer=16`, `save_comments=1`, `fast_shutdown=1`; `realpath_cache_size=4096K`, `realpath_cache_ttl=600`. `docker/dev-opcache.ini` re-states `validate_timestamps=1`/`revalidate_freq=0` and is bind-mounted as `zz-dev-opcache.ini` locally. | `validate_timestamps=1` with `revalidate_freq=0` means a stat() per include — chosen so the bind-mounted `src/` is picked up. |
| LiipImagine derivative cache | `public/media/cache/<filter>/<file>` on container disk | ephemeral; see §1.8 |
| HTTP caching | only `/img/{path}` sets `public, max-age=86400, s-maxage=86400` | API Platform `cache_headers: vary: ['Content-Type','Authorization','Origin']` (`config/packages/api_platform.yaml:16-18`) |
| PHP preload | `config/preload.php` requires `var/cache/prod/App_KernelProdContainer.preload.php` when present | |
| Entrypoint | runs `cache:clear` + `cache:warmup` on every container start (`docker/entrypoint.sh:16-22`) | |

Other PHP limits (`Dockerfile:110-114`): `memory_limit=2048M`, `upload_max_filesize=64M`,
`post_max_size=64M`, `date.timezone=Europe/Zurich`.

---

## 6. Sylius theming and the BKA theme

### 6.1 Mechanism

* Bundle: `Sylius\Bundle\ThemeBundle\SyliusThemeBundle` (`config/bundles.php:27`), `sylius/theme-bundle: ^2.3`.
* `config/packages/sylius_theme.yaml` is three lines: `sylius_theme: sources: filesystem: ~` → themes are
  discovered by scanning for `composer.json` files under `themes/`.
* The active theme is **not** per-host or per-channel; it is a single env var:
  `config/services.yaml:9` `sylius_theme: '%env(SYLIUS_THEME)%'`, bound as `$syliusTheme`.
* `src/EventListener/ThemeRequestListener.php` subscribes to `RequestEvent` at **priority 9**, and on
  the main request only does
  `$theme = $this->themeRepository->findOneByName($this->syliusTheme); if (null !== $theme) { $this->themeContext->setTheme($theme); }`.
  An unknown name (e.g. the default `SYLIUS_THEME=none`) silently leaves the base templates in place.
* `themes/bka/composer.json` is the theme manifest:
  ```json
  { "name": "in-situ-admin/bka", "title": "Theme for BKA" }
  ```
  so the value to set is **`SYLIUS_THEME=in-situ-admin/bka`** — exactly what `docker-compose.yaml:42` uses.
* Theme assets are published by `php bin/console sylius:theme:assets:install` (a composer
  `auto-scripts` entry) into `public/_themes/in-situ-admin/bka/`. Because that breaks the
  `bundles/` symlink, both `composer.json:115-117` (`symlink-themes` script) and
  `docker/entrypoint.sh:20-21` re-create it:
  ```bash
  mkdir -p public/_themes/in-situ-admin/bka
  ln -sfn ../../../bundles public/_themes/in-situ-admin/bka/bundles
  ```

### 6.2 What the BKA theme overrides

`themes/bka/` contains 49 files. Templates resolve theme-first, falling back to `templates/`.

**Overridden templates** (theme file replaces the base file of the same path):

| Path | base lines | theme lines | diff lines |
| --- | --- | --- | --- |
| `base.html.twig` | 42 | 32 | 62 |
| `datatables/event-archived-actions.html.twig` | 48 | 39 | 25 |
| `emails/admin_event_1a.html.twig` | 33 | 34 | 35 |
| `emails/admin_event_1b.html.twig` | 75 | 88 | 83 |
| `emails/admin_event_2a.html.twig` | 194 | 193 | 193 |
| `emails/admin_event_2b.html.twig` | 86 | 89 | 143 |
| `emails/admin_event_3a.html.twig` | 25 | 33 | 34 |
| `emails/admin_event_3b.html.twig` | 48 | 59 | 85 |
| `emails/admin_event_4a.html.twig` | 26 | 28 | 26 |
| `emails/admin_event_4b.html.twig` | 21 | 35 | 34 |
| `emails/layout.html.twig` | 643 | 693 | 284 |
| `includes/event_dates.html.twig` | 15 | 15 | 4 |
| `includes/header_frontend_link.html.twig` | 12 | 12 | 10 |
| `includes/header_logo.html.twig` | 1 | 1 | 5 |
| `includes/login_logo.html.twig` | 1 | 3 | 6 |
| `layout-propose-event.html.twig` | 229 | 23 | 210 |
| `propose_event/step1.html.twig` … `step6.html.twig` | 51/44/34/15/128/17 | 54/47/29/18/131/17 | 15/9/25/9/19/4 |
| `reset_password/check_email.html.twig` | 20 | 13 | 27 |
| `reset_password/request.html.twig` | 24 | 29 | 34 |
| `reset_password/reset.html.twig` | 18 | 21 | 31 |
| `security/login.html.twig` | 31 | 54 | 73 |

**Theme-only templates** (no base counterpart): `includes/svg/bka_logo_big.html.twig`,
`includes/svg/bka_logo_horizontal.html.twig`, `propose_event/steps.html.twig`, and eight empty
`propose_event/svg/{1..6,next,prev}.svg.twig` files (0 lines each).

`base.html.twig` is representative of the kind of change:

```diff
-        <title>{% block title %}In Situ · admin{% endblock %}</title>
-        <meta name="description" content="La plateforme culturelle fribourgeoise In Situ ...">
-        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
+    <title>{% block title %}BKA · admin{% endblock %}</title>
+    <meta name="description" content="Auf Augenhöhe mit Berns Kulturleben: Das Magazin und die Agenda für Theater, Kino, Ausstellungen, Musik und Clubkultur.">
+    <link rel="apple-touch-icon" sizes="180x180" href="/_themes/in-situ-admin/bka/apple-touch-icon.png">
...
-        <!-- Matomo -->  (full tracker, stats1.format-z.ch, siteId 12)
+    <!-- Matomo -->
+        {# TODO #}
+    <!-- End Matomo -->
-    <body class="{% block bodyClass %}{% endblock %}">
+<body class="{% block bodyClass %}{% endblock %}" data-theme="bka">
```

So on BKA: different title/description, favicons served from `/_themes/in-situ-admin/bka/`,
**Matomo analytics disabled (a `TODO`)**, and `data-theme="bka"` on `<body>`.

**Theme public assets** (10 files): `android-chrome-192x192.png`, `android-chrome-512x512.png`,
`apple-touch-icon.png`, `browserconfig.xml`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon.ico`,
`mstile-150x150.png`, `safari-pinned-tab.svg`, `site.webmanifest`.

**Theme translations**: exactly one file, `themes/bka/translations/messages.de.yml` (82 lines). There
is **no `messages.fr.yml` in the theme**, so in French the BKA admin shows the In-Situ wording.
Its content is the BKA vocabulary:

```yaml
misc:
  nav: { Visit-frontend: 'Zur BKA' }
  support: { content: 'Kontaktieren Sie <a href="mailto:support@bka.ch">support@bka.ch</a>' }
event:
  showInPrint:
    _label: "BKa Mitgliederanlass"
    _help: "Wenn dieses Kästchen aktiviert ist, erscheint die Veranstaltung in der Printausgabe."
  printCategory:
    _label: "Print-Kategorie"
    _help: "Die Kategorie, unter der die Veranstaltung für BKa Mitglieder in der Printausgabe erscheint."
  printDescription:
    _label: "Kurzbeschreibung für de Printausgabe (nur BKA Mitglieder)"
    _help: "max. 256 Zeichen"
  categories: { _help_members: "Wählen Sie maximal 3 Kategorien aus, die zu Ihrer Veranstaltung passen." }
user:
  create_defaults:
    organism_from: "Organisationen von"
    place_from: "Ort von"
    city: "Bern"
    zip: "3000"
```

compared with the base `translations/messages.de.yml:563-567`, which says `city: "Fribourg"`,
`zip: "1700"`. This is the only *behavioural* difference the theme introduces (§7 shows it in the DB).

**Theme styling** is *not* done by Sylius: `assets/styles/bka/overrides.scss` (55 lines) is imported
unconditionally by `assets/app.tsx:21` and scoped with `body[data-theme='bka'] { … }`. It overrides
heading fonts to `Arial, sans-serif`, widens `.login-box` to 700 px, and restyles the
propose-an-event step indicator (`.step`, `.step-link`, `.nav-step`, with responsive rules at
1199/1200 px).

### 6.3 Other front-end build facts

* Webpack Encore 3 (`webpack.config.js`), single entry `app` =
  `['core-js/stable','regenerator-runtime/runtime','./assets/app.tsx']`, Stimulus bridge,
  `splitEntryChunks()`, `enableSingleRuntimeChunk()`, Sass, TypeScript loader, Babel with
  `@babel/plugin-proposal-class-properties` and `useBuiltIns: 'usage'` / `corejs: '3.23'`.
  `assets/images` is copied to `images/[path][name].[hash:8].[ext]`.
* `assets/styles/app.scss` starts with `@import '../../in-situ-static/src/scss/styles'` — a **git
  submodule** (`.gitmodules` → `https://github.com/wepublish/in-situ-static.git`) holding the shared
  design system. `public/images` is a symlink into it.
* Scripts: `npm run dev|watch|build` (`encore production --progress`).
* Notable runtime deps: `bootstrap 5.3`, `tinymce 6`, `choices.js`, `html2canvas`, `jszip`,
  `file-saver`, `react 18`, `@reduxjs/toolkit`, `@tanstack/react-query`, `bazinga-translator`,
  `iframe-resizer`, `swiper`, `moment`, `@a2lix/symfony-collection` (from a GitHub fork).

---

## 7. The XLSX user import — `app:import-users-xlsx`

`src/Command/ImportUsersXlsxCommand.php`, using `openspout/openspout ^4.22`.

```
#[AsCommand(
    name: 'app:import-users-xlsx',
    description: 'Import users from an xlsx file and output passwords. xlsx file format : user email in third column, might be multiple separated with ";".',
)]
->addArgument('pathToFile', InputArgument::REQUIRED, 'The path to the xlsx file.')
```

Algorithm:

1. Open the workbook; iterate **every sheet**, **every row** (no header skip).
2. Read **cell index 2** (the third column); split on `;`.
3. Trim Unicode spaces (`preg_replace('/^\p{Z}+|\p{Z}+$/u', '', …)`) and `filter_var(..., FILTER_VALIDATE_EMAIL)`.
4. If a `User` with that email exists → record the literal string `!User Already Exists!` and skip.
5. Otherwise create a `User`: `enabled = true`, `member = true`, `roles = ['ROLE_USER']`,
   `locale = 'de'` (hard-coded), password from `App\Security\PasswordGenerator::generateNewPassword()`
   hashed with `UserPasswordHasherInterface`.
6. *"until public release in january, we also create organization and place"* — it then creates:
   * an `Organization`: `name = trans('user.create_defaults.organism_from', locale 'de') . ' ' . email`,
     `subTitle=''`, `address=''`, `zip = (int) trans('user.create_defaults.zip')`,
     `city = trans('user.create_defaults.city')`, `region = regionRepository->find(10)`,
     `about=''`, **`enabled = false`**;
   * a `Place`: `name = trans('user.create_defaults.place_from') . ' ' . email`, `private = true`,
     `address=''`, same zip/city/region, `about=''`, all three wheelchair flags `false`,
     **`enabled = false`**.
7. At the end it prints one line per spreadsheet row with the generated plaintext passwords joined by
   `' ; '` — **the passwords only ever exist on stdout**.

Region `10` is `{"fr": "Ville de Berne","de": "Stadt Bern"}` in production — confirmed:

```sql
SELECT id, label FROM region ORDER BY id;
--  10 | {"fr": "Ville de Berne","de": "Stadt Bern"}
```

### 7.1 Evidence that it really ran on BKA production

```sql
SELECT count(*) FROM organization WHERE name LIKE 'Organisationen von %';  --  123
SELECT count(*) FROM place        WHERE name LIKE 'Ort von %';             --  128
```

Grouped by the defaults that were in force at the time:

| region_id | zip | city | organizations | first | last |
| --- | --- | --- | --- | --- | --- |
| 10 | 3000 | Bern | 84 | 2024-01-04 | 2025-10-30 |
| 10 | 3001 | Bern | 25 | 2023-12-07 | 2023-12-07 |
| 5 | 3001 | Bern | 14 | 2023-11-09 | 2023-11-23 |

| region_id | zip | city | places | first | last |
| --- | --- | --- | --- | --- | --- |
| 10 | 3000 | Bern | 91 | 2024-01-04 | 2025-10-30 |
| 10 | 3001 | Bern | 22 | 2023-12-07 | 2023-12-07 |
| 5 | 3001 | Bern | 13 | 2023-11-09 | 2023-11-23 |
| 10 | 3011 | Bern | 1 | 2023-12-07 | 2023-12-07 |
| 5 | 3000 | Bern | 1 | 2023-11-30 | 2023-11-30 |

So the command (or an earlier variant with `region 5` / `zip 3001`) was run repeatedly between
November 2023 and October 2025. Since the repository's git history is squashed into one
"Initial commit", the earlier parameter values cannot be recovered from this checkout.

For context the production `user` table holds **427 users, 269 of them `member = true`, 414 enabled**.
`ACTIVATE_MEMBERS=true` for BKA, which is what makes the `member` flag meaningful.

The only other code that reads `user.create_defaults.*` is `src/Controller/EventController.php:206-217`
(the "create your organization" modal shown to a user who has none) — but that one takes the name
from the form, so it does not produce the `Organisationen von …` pattern.

---

## 8. Fixtures, factories and test data

### 8.1 Doctrine fixtures (`dev` + `test` only — `config/bundles.php:24`)

**`src/DataFixtures/AppFixtures.php`** — raw SQL via `Doctrine\DBAL\Connection::executeStatement()`:

* one `oauth2_client` / `oauth2_access_token` / `oauth2_refresh_token` triple for
  `tests1@venue-example.org` (access token expiring 2044-02-06);
* **30 categories** with hex-encoded bilingual labels and `tag_color`s;
* **4 affiliations** (AG culturel / Kulturlegi / AHV-IV / Student);
* **13 regions** (ids 1-5, 7-11, 13-15) — ids 1-9 Fribourg, 10-15 Bern, with `hidden` set on the
  Fribourg ones;
* **4 audiences**;
* 5 `Place_<n>` places and one `User` (`tests1@venue-example.org`, plaintext password `password`).

> **Finding — `AppFixtures` cannot run on PostgreSQL.** Every statement uses MySQL backtick
> identifiers (`` INSERT INTO `oauth2_client` ``) and MySQL hex literals
> (`X'7B226672223A...'`). The test database is derived from `DATABASE_URL` (PostgreSQL, with
> `dbname_suffix: '_test%env(default::TEST_TOKEN)%'`, `config/packages/doctrine.yaml:38-42`).
> The README's documented flow (`doctrine:fixtures:load`) is therefore MySQL-era.
> *Not executed — claim rests on the SQL dialect in the file.*

**`src/DataFixtures/EventFixtures.php`** (400 lines, `getDependencies() => [AppFixtures::class]`)
builds a deliberately exhaustive date matrix using Foundry factories. It warns:

```php
// WARNING : because we often use +/- 1/2 hour with relative dates in the fixture,
// testing between 22:00 and 02:00 is not relevant.
```

| Group | Cases | What they cover |
| --- | --- | --- |
| A1–A20 | 20 main events, several with sub-events | past-only, single future, multiple future, past+future, today with `start<now<end`, `start>now`, `end<now`, >1-day span, future publication date, and the same matrix again expressed through sub-events, plus "tomorrow ±1h" variants |
| B1–B11 | 11 weekly-recurring main events (`recurrence: 'week'`, `recurrenceWeekDays: [1..7]`) | all-past, all-future, straddling, and start/end exactly `now±1h` or `tomorrow±1h` |

### 8.2 Zenstruck Foundry factories (`src/Factory/`, 13 classes)

All are `PersistentProxyObjectFactory`; the only non-boilerplate part is `defaults()`.

| Factory | Defaults |
| --- | --- |
| `AffiliationFactory` | `label: {fr: word, de: word}`, timestamps |
| `AudienceFactory` | `label: {fr: word, de: word}`, timestamps |
| `CategoryFactory` | `label`, `tagColor: hexColor()`, `hidden: false`, timestamps |
| `ContactFactory` | `email`, `designationEmail`, `phoneNumber`, `designationPhone`, `labels.designationEmail.{fr,de}` |
| `ImageFactory` | `legend: text()`, **`fileName: word().'.png'`**, `labels.legend.{fr,de}`, timestamps |
| `MainEventFactory` | `name: 'Test Event'`, `eventStatus: 'confirmed'`, `audience: AudienceFactory::new()`, `dateFrom: now`, `dateTo: +2h`, `openingTime: '16:00'`, `description`, `specialRate: 'free_entry'`, `publicationStatus: PUBLICATION_STATUS_PUBLISH`, `publicationDate: yesterday 00:00`, `labels.description.{fr,de}` |
| `OrganizationFactory` | address/city/name/zip(1000-10000), `enabled: true`, `region: RegionFactory::new()`, `labels.about.{fr,de}` |
| `PlaceFactory` | address/city/name/website/zip, `private`, three wheelchair booleans — all `faker()->boolean()`, `enabled: true` |
| `RegionFactory` | `label: {fr,de}` |
| `SubEventFactory` | `dateFrom: tomorrow 15:00`, `dateTo: tomorrow 20:00`, `eventStatus: 'confirmed'`, `openingTime: '18:00'`, `specialRate: 'free_entry'`, `publicationStatus: 'publish'`, `publicationDate: yesterday 00:00` |
| `TechnicalSheetFactory` | `title: text(15)`, **`fileName: word().'.png'`** (a PDF entity with a `.png` default), `labels.title.{fr,de}` |
| `UserFactory` | `email`, `enabled: true`, `member: false`, `password: faker password` (**not hashed**), `roles: ['ROLE_USER']` |
| `UserTokenFactory` | `expiresAt: +1 hour`, `name`, `owner: UserFactory::new()`, `token: 'empty'` |

### 8.3 Story — `src/Story/UsersStory.php`

Builds the standard cast and issues real JWTs via `App\Security\JWTGenerator`:
pool `users` (4), pool `members` (2, `member: true`), state `admin`
(`['ROLE_USER','ROLE_ADMIN']`), state `partner` (`['ROLE_BROADCAST_PARTNER']`); a `UserToken` per
user/member plus one each for admin and partner, each token's `token` column overwritten with the
generated JWT.

### 8.4 Tests

`phpunit.xml.dist`: bootstrap `tests/bootstrap.php`, `APP_ENV=test` forced, Zenstruck
`BrowserExtension`, `SymfonyTestsListener`, coverage over `src/`.
PHPUnit **9.5** (`SYMFONY_PHPUNIT_VERSION=9.5`).

19 test files. `tests/Functional/AbstractApiTestCase.php` is a `KernelTestCase` with Zenstruck
`HasBrowser`, defaulting `Accept: application/ld+json`.

Image-specific tests:

* `tests/Functional/ApiImageTest.php` — 401 without auth, 401 with a bogus bearer,
  `GET /api/v2/images` `totalItems = 6` after `ImageFactory::createMany(6)`,
  `GET /api/v2/images/{id}` asserting `id`, `file_name`, and the presence of `labels`, `url`,
  `url_webp`, `url_webp_size_512_q_65`, `url_webp_size_1024_q_65`; `DELETE` → 204 then 404;
  and `testDeleteOrphanImage` showing a plain `ROLE_USER` may delete an unowned orphan image.
* `tests/Functional/ApiImagePostTest.php` — multipart POST with
  `labels='{"legend":{"fr":"legend FR","de":"legend DE"}}'`, 401 unauthenticated / 201 with the admin
  token. It copies the fixture first *"because uploadedFile will remove the source file after process"*
  and carries a TODO: *"find why png gives an extra pipe broken error (working but return an
  errorException and break the tests) — symfony/symfony#58687"*.

Binary test fixtures in `tests/fixtures/`:

| File | Type |
| --- | --- |
| `Test Sign.jpg` | JPEG 640×452, 75 353 B (name has a space on purpose — exercises `OrignameNamer`) |
| `img-test.png` | PNG 400×400 RGB, 3 349 B |
| `test2.jpg` | JPEG 332×152, progressive, EXIF from GIMP 2.10.34, 17 612 B |
| `test2.png` | PNG 332×152 colormap, 3 447 B |

---

## 9. Localisation, translation and the locale plumbing

### 9.1 Configuration

`config/packages/translation.yaml`:
```yaml
framework:
    default_locale: '%locale%'      # = %env(DEFAULT_LOCALE)%
    translator:
        default_path: '%kernel.project_dir%/translations'
        fallbacks: ['%locale%']
```
(`providers:` for Crowdin/Loco/Lokalise/Phrase are commented out, hence the dangling
`CROWDIN_DSN`/`LOCO_DSN`/`LOKALISE_DSN`/`PHRASE_DSN` env references.)

`translations/` holds `messages.{de,fr}.yml` (~38 KB each), `security.{de,fr}.yml`,
`tables.{de,fr}.yml` (datatables domain, `config/packages/datatables.yaml` sets
`translation_domain: 'tables'`), `validators.{de,fr}.yml`.

JS translations: `bazinga_js_translation` with `active_locales: [fr, de]` and
`locale_fallback: '%locale%'`; dumped to `assets/translations/{config,fr,de}.json` via
`php bin/console bazinga:js-translation:dump assets --format=json --merge-domains` (README).
`symfony/ux-translator` additionally dumps into `var/translations`.

### 9.2 Runtime locale resolution

* `src/EventListener/LocaleSubscriber.php` (priority **20** on `kernel.request`, before Symfony's own
  locale listener): skips sub-requests, `_stateless` requests and sessionless requests; prefers the
  `_locale` route attribute, then `?_locale=xx` from the language switcher (which also sets the
  session flag `_locale_from_switcher` and strips the query parameter via `overrideGlobals()`), then
  the session value, then `getPreferredLanguage(explode('|', $this->locales))`.
* `src/EventListener/UserLocaleSubscriber.php` on `LoginSuccessEvent` (*"also fires for remember-me
  logins, unlike InteractiveLoginEvent"*): switches the session to `User::$locale` unless the
  switcher flag is set, guarding against `_stateless` JWT requests that still carry a session object.
* `src/Twig/RouteLanguageSwitcher.php` adds the Twig function `switchLanguagePath(locale, relative=false)`
  which regenerates the current route with `_locale` merged into `_route_params` + the current query
  string.

### 9.3 Which locales BKA runs with

| Source | Value |
| --- | --- |
| `.env:73-74` (defaults) | `LOCALES=fr\|de`, `DEFAULT_LOCALE=fr` |
| `.env.local:11-12` | `LOCALES=fr\|de`, `DEFAULT_LOCALE=fr` |
| `docker-compose.yaml` **committed** | `LOCALES: de`, `DEFAULT_LOCALE: de` |
| `docker-compose.yaml` **working tree** | `LOCALES: fr\|de`, `DEFAULT_LOCALE: de` |
| Brief | `LOCALES=fr\|de`, `DEFAULT_LOCALE=de` |

Production data is consistent with a *mostly* German deployment: 27 571 image rows carry a `de`
legend key, 2 798 carry an `fr` key, but only **14** have a non-null French legend.
*UNVERIFIED:* what the live BKA deployment sets. The committed `LOCALES: de` suggests it was
single-locale at some point and `fr|de` is a recent change.

---

## 10. Serializer, encoder, Doctrine types and DQL

### 10.1 `src/Serializer/Normalizer/` — six normalizers + one denormalizer

| Class | Supports | Adds |
| --- | --- | --- |
| `ImageNormalizer` | `App\Entity\Image` | `url`, `url_webp`, `url_webp_size_512_q_65`, `url_webp_size_1024_q_65` (see §1.9) |
| `TechnicalSheetNormalizer` | `TechnicalSheet` | `url` = absolute `index` route + `file/<name>` (URL-encoded) |
| `CategoryNormalizer` | `Category` | `level` = 1 when it has children **or** is a root, 2 when it is a childless child |
| `EventNormalizer` | `Event` | `event_type` (`'mainevent'`/`'subevent'`), `mainevent_id`, `mainevent_slug` |
| `EventOccurrenceNormalizer` | `EventOccurrence` | **mutates the Event before normalizing**: reads `date_from` from the *main request* query (default `now`) and sets `$event->setNextDate()` / `setNextFilteredDate()` to the occurrence's `dateFrom` when it is in the future, otherwise `null`. Comment on `setNextFilteredDate`: `// usefull ?` |
| `RateNormalizer` | `Rate` | divides `price` by 100 and casts to string (prices stored in cents) |
| `UploadedFileDenormalizer` | anything `instanceof File` | returns the value untouched |

`src/Twig/AppExtension.php` has the matching display filter `price_formatted`
(`number_format(floatval($price)/100, 2)`).

### 10.2 `src/Doctrine/Type/` — timezone handling

`config/packages/doctrine.yaml:10-13` **replaces the built-in types**:

```yaml
types:
    datetimetz: App\Doctrine\Type\LocalDateTimeTzType
    datetimetz_immutable: App\Doctrine\Type\LocalDateTimeTzImmutableType
```

`LocalDateTimeTzType::TIMEZONE = 'Europe/Zurich'`. The class docblock explains both reasons:

> PostgreSQL returns "timestamp with time zone" values in the session timezone (UTC), so without this
> the DateTime objects carry a +00:00 offset and every `->format('H:i')` call on them returns UTC
> hours instead of local ones. Values may also carry fractional seconds
> (e.g. `2026-05-08 11:18:49.967444+00`), which the parent type refuses, so parsing falls back to
> PHP's own parser like `DateTimeType` does.

`LocalDateTimeTzImmutableType` is the `DateTimeImmutable` twin.
`config/packages/twig.yaml:3-4` sets the Twig `date.timezone` to `Europe/Zurich`;
`Dockerfile:113` sets PHP's `date.timezone=Europe/Zurich`.

### 10.3 `src/DQL/` — PostgreSQL-only DQL functions

Registered in `config/packages/doctrine.yaml:28-36` alongside three MySQL functions from
`scienta/doctrine-json-functions` that are now unusable on Postgres (`JSON_CONTAINS`,
`JSON_EXTRACT`, `JSON_VALUE`).

| DQL name | Class | Emitted SQL |
| --- | --- | --- |
| `ILIKE(field, value)` | `App\DQL\ILike` | `(unaccent(CAST(%s AS TEXT)) ILIKE unaccent(CAST(%s AS TEXT)) ESCAPE '!')` |
| `UNACCENT(field)` | `App\DQL\Unaccent` | `unaccent(CAST(%s AS TEXT))` |
| `JSON_VALUES_TEXT(field)` | `App\DQL\JsonValuesText` | `jsonb_path_query_array(CAST(%s AS JSONB), '$.** ? (@.type() == "string")')::text` |
| `JSON_KEY_VALUES_TEXT(field, 'key')` | `App\DQL\JsonKeyValuesText` | `jsonb_path_query_array(CAST(%s AS JSONB), '$.<key>.** ? (@.type() == "string")')::text` — the key is interpolated into the jsonpath literal, so `parse()` rejects anything not matching `^[A-Za-z0-9_]+$` |

The `unaccent` extension is created by `migrations/Version20260926170000.php`
(*"Enable the unaccent extension for accent-insensitive searches"*).

`App\DQL\LikeQueryHelpers` is a trait providing `makeLikeParam($search, $pattern = '%%%s%%')`, which
escapes `%`, `_` and `!` with `!` (the escape char must be `'!'` because DQL mangles backslashes), and
documents that callers must spell `ESCAPE '!'` in the DQL themselves.

`App\Search\SearchNormalizer::normalize()` mirrors the database side in PHP with
`\Transliterator::create('Any-Latin; Latin-ASCII; Lower()')`, falling back to `mb_strtolower`, plus
`containsPattern()` returning `'%'.normalize($v).'%'`.

### 10.4 `src/Traits/`

| Trait / interface | Purpose |
| --- | --- |
| `TranslatableEntity` | Declares the shared `labels` JSON column (`#[ORM\Column(name: 'labels', type: Types::JSON, nullable: true)]`, groups `default`/`reader`/`archive`, with an OpenAPI schema describing `{property: {fr, de}}`), plus `getLabels()`, `setLabels()`, `getLabel($locale, $property = 'label', $defaultLocale = null, $defaultValue = null)`, `getLabelWithLocales($locale, $locales, $property)` (walks a locale list), `deleteLabel($property)` and `extractLanguage()` which truncates `de_CH` → `de` and lowercases. |
| `TranslatableInterface` | `extends Gedmo\Translatable\Translatable`; declares `getLabels`, `setLabels`, `getLabel`. |
| `EnumTranslatableChoice` | For backed enums: `getTranslationPrefix()` returns the short class name + `.`; `getTranslatableChoices(?placeholderLabel, ?locale)` builds `value => case` and optionally prepends `null => placeholder`. The `$locale` parameter is accepted but unused. |
| `App\Entity\Trait\TimestampableEntity` | `createdAt`/`updatedAt` (Gedmo `timestampable: true` via `config/packages/stof_doctrine_extensions.yaml`, which also enables `sluggable: true`). |

### 10.5 `src/Organization/OrganizationMagazine.php`

A 34-line service with one method, `getCurrentUserOrganizations()`:
`ROLE_ADMIN` **or no user** → `organizationRepository->findAll()`; otherwise
`$user->getOrganizations()`. Comment: *"Admin must have all organizations"*.
(Note the `null == $user` branch gives an anonymous caller the full list.)

### 10.6 `src/Service/` — two small services

* `HtmlSanitizerService::sanitizeTranslatableFields(array $labels)` walks the two-level
  `[property][lang] => value` structure and runs every string through Symfony's
  `HtmlSanitizerInterface`. **No `framework.html_sanitizer` configuration exists**, so the default
  (W3C-safe) ruleset applies.
* `TimeChoiceGenerator::generateTimeChoices()` returns `['00:00' => '00:00', '00:15' => …]` — 96
  quarter-hour slots.

### 10.7 `src/Twig/`

**`AppExtension`** registers ten filters:

| Filter | Behaviour |
| --- | --- |
| `type_class` | transliterates ~70 accented characters via a hard-coded `strtr` map and lowercases |
| `date_localized` | `setlocale(LC_TIME,'fr_FR')` + `strftime('%a %d.%m')`, converted ISO-8859-1 → UTF-8 |
| `date_time_localized` | same, `'%A %d.%m.%y - %H:%M'`, returns `null` for `null` |
| `month_localized` | `'%b'` |
| `day_localized` | `'%A'` |
| `day_short_localized` | `'%a'` |
| `display_language` | `\Locale::getDisplayLanguage($locale, $displayLocale)` |
| `price_formatted` | cents → `number_format($v/100, 2)` |
| `weekday_name(int, locale)` | `IntlDateFormatter` pattern `EEEE` anchored at 2024-01-01 (*"un lundi"*), 1 = Monday … 7 = Sunday, `''` out of range |
| `string_to_custom_date(str, locale)` | parses `Y-m-d H:i:s.u`, formats `EE dd.MM.yyyy` |

> The five `*_localized` filters are **hard-coded to French** (`// @TODO need to check the current
> language`) and use `strftime()`, deprecated since PHP 8.1.

**`src/Twig/Components/`** — two Symfony UX Live Components, both pure `FormView` carriers with
`#[LiveProp(useSerializerForHydration: true)]`:
`EventDates` (`schedule`, `dateFrom`, `dateTo`, `openingTime`, `recurrence`, `recurrenceWeekDays`,
`subEvents`, `slotTimeOpening`, `slotTimeFrom`, `slotTimeTo`) and `EventTicketings` (`ticketings`).
`config/packages/twig_component.yaml` maps `App\Twig\Components\` → `templates/components/`;
`config/routes/ux_live_component.yaml` mounts the component endpoint at `/{_locale}/_components`.

Twig globals (`config/packages/twig.yaml:6-18`) expose the feature flags to templates:
`app_google_map_api_key`, `app_google_map_id`, `app_locales`, `sponsoredEventsActivated`,
`clipboardEventLinks`, `joinUsLink`, `eventVideosActivated`, `proinfirmisActivated`,
`hasPrintOptions`, `imageGeneratorActivated`, `showManual`, `multiTicketingsActivated`.
Form themes: `bootstrap_5_layout.html.twig`, `form/fields.html.twig`, `form/multilang.html.twig`.

`SHOW_MANUAL` (true for BKA) surfaces a single static PDF:
`public/documents/Manual_BKa_Mitglieder.pdf` (2.9 MB), linked from
`templates/event/create.html.twig:12-13` and `templates/event/edit.html.twig:11-12`.

---

## 11. Container image, entrypoint, CI

### 11.1 `Dockerfile` — four stages

| Stage | Base | Does |
| --- | --- | --- |
| `vendor` | `composer:2.7` | `composer install --no-dev --prefer-dist --optimize-autoloader --no-scripts`, then `composer dump-autoload --optimize --no-dev`. A long comment explains **why not `--classmap-authoritative`**: an authoritative classmap refuses the PSR-4 fallback, so files added to `src/` after the build (the dev stack bind-mounts `./src`) cannot be autoloaded. |
| `assets` | `node:20-bookworm-slim` | `npm ci` + `npm run build`, with `vendor/` copied in (needed by the `file:vendor/...` deps) |
| `php-ext-builder` | `php:8.3-apache-bookworm` | builds `imagick`, `memcached` (pecl) and `intl`, `zip`, `opcache`, `pdo`, `pdo_pgsql`, `gd` (with freetype + jpeg) |
| `app` | `php:8.3-apache-bookworm` | Apache on **port 8080** with `APACHE_DOCUMENT_ROOT=/var/www/html/public`, `a2enmod rewrite headers`, group-0-writable `/var/run/apache2` + `/var/lock/apache2` (OpenShift-style). Runtime libs: `libpq5 libicu72 libzip4 libmagickwand-6.q16-6 libpng16-16 libjpeg62-turbo libfreetype6 webp jpegoptim pngquant libmemcached11`. Copies the extensions from the builder, writes `/usr/local/etc/php/conf.d/app.ini`, copies the source + `vendor/` + `public/build`, `mkdir -p var/cache var/log public/media` with `chgrp -R 0` / `chmod -R g+rwX` / `775` and `usermod -a -G 0 www-data`. |

Baked environment: `APP_ENV=prod`, `APP_DEBUG=0`, `RUN_MIGRATIONS=1`,
`JPEG_OPTIM_EXEC_PATH=/usr/bin/jpegoptim`, `PNG_QUANT_EXEC_PATH=/usr/bin/pngquant`.
`ENTRYPOINT ["/entrypoint.sh"]`, `CMD ["apache2-foreground"]`, `EXPOSE 8080`.

### 11.2 `docker/entrypoint.sh`

```bash
set -euo pipefail
if [ "${RUN_LOCAL:-1}" = "1" ]; then sleep 5; fi                 # wait for the DB
if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  php bin/console --env=prod doctrine:migrations:migrate --allow-no-migration -n
fi
php bin/console --env=prod cache:clear
php bin/console --env=prod cache:warmup
php bin/console assets:install public --symlink --relative
mkdir -p public/_themes/in-situ-admin/bka
ln -sfn ../../../bundles public/_themes/in-situ-admin/bka/bundles
"$@"
```

Note the theme symlink path is **hard-coded to the BKA theme** even in the generic entrypoint.

### 11.3 Local compose (`docker-compose.yaml`, working tree)

`app` on `8080:8080`, bind-mounting `src`, `migrations`, `config`, `assets`, `in-situ-static`,
`themes`, `templates`, `translations`, `public`, plus `docker/dev-opcache.ini`;
`env_file: .env.local` then an explicit `environment:` block (the BKA flag set quoted in the brief);
`APP_ENV: prod`, `APP_DEBUG: "1"`, `RUN_MIGRATIONS: "1"`, `RUN_LOCAL: "1"`,
`DATABASE_URL: pgsql://postgres:secret@postgres/insitu-admin`,
`MAILER_DSN: null://localhost`, `TRUSTED_PROXIES: 10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,127.0.0.1`.
Services: `postgres:18-alpine` (5432) and a vestigial `mariadb:11.4` (3306, commented-out
`DATABASE_URL`). Network `shared-net`.

### 11.4 CI (`.github/workflows/`)

Three workflows, all image-publishing only — **no tests, no lint, no static analysis run in CI**:

| File | Trigger | Tags |
| --- | --- | --- |
| `on-demand-publish-docker-image.yml` | `workflow_call` | reusable buildx/QEMU push to `ghcr.io` |
| `on-main-publish-main-artifacts.yml` | push to `main` | `ghcr.io/wepublish/insitu-admin:main-<epoch>-<sha>` and `:main` |
| `on-main-publish-production-artifacts.yml` | push of tag `v*` | `ghcr.io/wepublish/insitu-admin:production-<epoch>-<sha>` and `:production` |

Dev tooling present but not wired to CI: `rector.php`, `phpstan.dist.neon`, `.php-cs-fixer.dist.php`,
`.prettierrc`/`.prettierignore`.

### 11.5 `public/.htaccess`

Beyond the standard Symfony front-controller rules it contains two hard-coded 301s:

```apache
RewriteCond %{HTTP_HOST} ^(.*)insitu-ba.formatlabs\.ch$
RewriteRule (.*) https://admin.insitu.live/$1 [R=301,L]

RewriteCond %{HTTP_HOST} ^admin\.in-situ\.org [NC]
RewriteCond %{REQUEST_URI} !^/api/ [NC]
RewriteRule (.*) https://admin.insitu.live/$1 [R=301,L]
```

(Commented-out force-HTTPS rules mention `in-situ-admin.localhost` and `bka-admin.localhost`.)

---

## 12. Logging, error reporting, security headers

### 12.1 Monolog (`config/packages/monolog.yaml`)

| Env | Handlers |
| --- | --- |
| dev | `main` stream → `var/log/dev.log`, level `debug`, channels `!event`; `console` (`!event,!doctrine,!console`) |
| test | `main` fingers_crossed(error) → `nested` stream `var/log/test.log` debug, excluding HTTP 404/405 |
| prod | `main` fingers_crossed(`action_level: error`, `buffer_size: 50`, excluded 404/405, channels `!mailer,!deprecation`) → `grouped` = [`streamed` (stream `var/log/prod.log`, level error), `sentry` (level error, `hub_id: Sentry\State\HubInterface`)]; a `console` handler; and `deprecation: type "null"` to **swallow deprecations completely** |

A dedicated `deprecation` channel is declared at the top level.

### 12.2 Sentry (`config/packages/sentry.yaml`)

```yaml
when@prod:
    sentry:
        dsn: '%env(SENTRY_DSN)%'
        register_error_listener: false
        register_error_handler: false
```

With comments: *"Stays dormant when `SENTRY_DSN` is empty/unset: no events are sent"* and
*"Errors are forwarded to Sentry through the Monolog handler … so disable the bundle's own listeners
to avoid reporting the same exception twice."*
`SentryBundle` is registered for `prod` only (`config/bundles.php:38`).
`SENTRY_DSN` is empty in `.env:50`.

### 12.3 `nelmio/security-bundle`

* **Clickjacking**: `DENY` for `^/.*`, with one `ALLOW` exception for
  `^/(fr|de)/proposer-un-evenement/*` (the propose-an-event wizard is embedded in an iframe — which
  is also why `framework.session.cookie_samesite` is `null` with the comment *"todo should be lax,
  null setted to be used the propose event from iframe"*).
* `content_type.nosniff: true`; `xss_protection` enabled + `mode_block`;
  `referrer_policy: ['no-referrer', 'strict-origin-when-cross-origin']`.
* **CSP** enforced, `report-uri: '%router.request_context.base_url%/nelmio/csp/report'`
  (route in `config/routes/nelmio_security.yaml`), `level1_fallback: true`,
  and `frame-ancestors`:
  ```
  http://*.localhost, *.wepublish.cloud, *.wepublish.dev, *.wepublish.works,
  *.wepublish.media, *.in-situ.org, insitu.live, *.bka.ch, bka.ch, in-situ.org
  ```

### 12.4 CORS

`nelmio_cors` applies to `^/`: `origin_regex: true`, `allow_origin: ['%env(CORS_ALLOW_ORIGIN)%']`
(default `^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$`), methods
`GET, OPTIONS, POST, PUT, PATCH, DELETE`, headers `Content-Type, Authorization`,
`expose_headers: ['Link']`, `max_age: 3600`.

### 12.5 Other framework settings worth carrying over

* `framework.trusted_proxies: '%env(TRUSTED_PROXIES)%'` with trusted headers
  `x-forwarded-for|proto|port|host`.
* `framework.serializer.name_converter: serializer.name_converter.camel_case_to_snake_case`
  — the reason every API field is snake_case.
* `framework.uid.default_uuid_version: 7`.
* `framework.validation.email_validation_mode: html5`; `not_compromised_password: false` in test.
* `http_method_override: false`, `handle_all_throwables: true`.
* `fos_rest` is still installed and active, zoned to `^/api(?!/v2)` — i.e. the **v1** API only;
  API Platform owns `/api/v2` (`config/routes/api_platform.yaml`).
* `api_platform`: title `InSitu/BKA API`, version `2.0.3`, `stateless: true`,
  `pagination_client_items_per_page: true`, `pagination_maximum_items_per_page: 500`,
  `normalization_context.skip_null_values: false`, patch format
  `application/merge-patch+json`.

### 12.6 Registered bundles (`config/bundles.php`, 36 entries)

FrameworkBundle, DoctrineBundle, DoctrineMigrationsBundle, DebugBundle(dev), TwigBundle,
WebProfilerBundle(dev,test), WebpackEncoreBundle, TwigExtraBundle, SecurityBundle, MonologBundle,
MakerBundle(dev), **FOSRestBundle**, **LeagueOAuth2ServerBundle**, StofDoctrineExtensionsBundle,
**VichUploaderBundle**, **LiipImagineBundle**, FormatzPhoneNumberBundle, NelmioCorsBundle,
**OminesDataTablesBundle**, NelmioApiDocBundle, DoctrineFixturesBundle(dev,test),
BazingaJsTranslationBundle, NelmioSecurityBundle, **SyliusThemeBundle**,
SymfonyCastsResetPasswordBundle, ZenstruckFoundryBundle(dev,test), UxTranslatorBundle,
TwigComponentBundle, LiveComponentBundle, StimulusBundle, **ApiPlatformBundle**,
SymfonycastsMicroMapperBundle, LexikJWTAuthenticationBundle, **FlysystemBundle**,
SentryBundle(prod).

PHP `>= 8.3`, Symfony `6.4.*`.

---

## 13. Every environment variable the app reads

Compiled from `rg '%env\([^)]*\)%' config src templates themes assets`, `rg '\$_ENV|getenv'`,
`config/services.yaml` binds, `.env`, `.env.local`, `.env.test`, `docker-compose.yaml`,
`Dockerfile`, `docker/entrypoint.sh`, `phpunit.xml.dist`, `tools/sync-staging-images.sh` and
`webpack.config.js`.

### 13.1 Read by the Symfony container

| Variable | Where it is consumed | Meaning | Default in `.env` | BKA value (`docker-compose.yaml`) |
| --- | --- | --- | --- | --- |
| `APP_ENV` | `public/index.php`, `bin/console`, `$appEnv` bind | Symfony env | `dev` | `prod` |
| `APP_SECRET` | `framework.secret` | CSRF/signing secret | `d8597fe29248f4b5c167d3f518549e1f` | same literal |
| `APP_DEBUG` | `public/index.php`, `bin/console` | debug flag | — (Dockerfile `0`) | `"1"` |
| `DATABASE_URL` | `doctrine.dbal.url` (`resolve:`) | DB DSN | `postgresql://app:!ChangeMe!@127.0.0.1:5432/app?serverVersion=15&charset=utf8` | `pgsql://postgres:secret@postgres/insitu-admin` |
| `MESSENGER_TRANSPORT_DSN` | `messenger.transports.async.dsn` | async transport | `doctrine://default?auto_setup=0` | same |
| `MAILER_DSN` | `framework.mailer.dsn` | mailer DSN | commented out | `null://localhost` |
| `MAILER_FROM_ADDRESS` | `$fromAddress` → `App\Mailer\Mailer` | From | empty | `test@wepublish.ch` |
| `MAILER_REPLYTO_ADDRESS` | `$replyToAddress` | Reply-To and admin fallback recipient | empty | `test@wepublish.ch` |
| `MAILER_BCC_ADDRESS` | `$bccAddress` (`csv:`) | BCC list | empty | unset |
| `MAILER_RETURNPATH_ADDRESS` | `$returnPathAddress` | Return-Path | empty | `test@wepublish.ch` |
| `SENTRY_DSN` | `sentry.dsn` (prod only) | error reporting; empty = dormant | empty | unset |
| `CORS_ALLOW_ORIGIN` | `nelmio_cors.allow_origin` | origin regex | `^https?://(localhost\|127\.0\.0\.1)(:[0-9]+)?$` | from `.env.local` |
| `TRUSTED_PROXIES` | `framework.trusted_proxies` | reverse-proxy CIDRs | — | `10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,127.0.0.1` |
| `LOCALES` | `%locales%`, `$locales` bind, bazinga fallback | `\|`-separated locale list | `fr\|de` | `fr\|de` (committed: `de`) |
| `DEFAULT_LOCALE` | `%locale%` → `framework.default_locale`, translator fallback, Gedmo default | default locale | `fr` | `de` |
| `SYLIUS_THEME` | `%sylius_theme%` → `$syliusTheme` → `ThemeRequestListener` | active theme name | `none` | `in-situ-admin/bka` |
| `GOOGLE_MAP_API_KEY` | Twig global `app_google_map_api_key` | Maps JS key | empty | from `.env.local` (empty) |
| `GOOGLE_MAP_ID` | Twig global `app_google_map_id` | Maps style id | empty | `""` |
| `PROINFIRMIS_KEY` | `$proinfirmisKey` → `ProInfirmisHttpClient` | ZUERST API key | empty | from `.env.local` (empty) |
| `OAUTH2_ENCRYPTION_KEY` | `league_oauth2_server.encryption_key`, `$appOauthEncryptionKey` | OAuth2 encryption key | empty | unset |
| `JWT_SECRET_KEY` | `lexik_jwt_authentication.secret_key` (`resolve:`) | private key path | `%kernel.project_dir%/var/jwt/private.key` | `%kernel.project_dir%/var/oauth/test_private.key` |
| `JWT_PUBLIC_KEY` | `lexik_jwt_authentication.public_key` (`resolve:`) | public key path | `%kernel.project_dir%/var/jwt/public.key` | `%kernel.project_dir%/var/oauth/test_public.key` |
| `JWT_PASSPHRASE` | **declared but unused** — `lexik_jwt_authentication.yaml:4` hardcodes `pass_phrase: ''` | — | empty | empty |
| `R2_BUCKET` | `flysystem` both storages | R2/S3 bucket | **none** | **none** — must be injected |
| `R2_ENDPOINT` | `Aws\S3\S3Client` | S3 endpoint | **none** | **none** |
| `R2_ACCESS_KEY` | `Aws\S3\S3Client` | access key | **none** | **none** |
| `R2_SECRET_KEY` | `Aws\S3\S3Client` | secret key | **none** | **none** |
| `R2_REGION` | `Aws\S3\S3Client` | region | **none** | `auto` |
| `R2_PUBLIC_BASE` | `vich_uploader` `uri_prefix` (both mappings) **and** `$_ENV` in `ImageRedirectController` | public base URL of the bucket | **none** (`.env.local` sets `""`) | from `.env.local` (`""`) |
| `JPEG_OPTIM_EXEC_PATH` | `$jpegOptimExecPath` → `ResizeImageUploadedListener` | jpegoptim binary | `/usr/bin/jpegoptim` | Dockerfile `/usr/bin/jpegoptim` |
| `PNG_QUANT_EXEC_PATH` | `$pngquantExecPath` — **injected but never used** | pngquant binary | `/usr/bin/pngquant` | Dockerfile `/usr/bin/pngquant` |
| `VAR_DUMPER_SERVER` | `debug.dump_destination` (dev) | VarDumper server | — | — |
| `TEST_TOKEN` | `doctrine.dbal.dbname_suffix` in test (`default::TEST_TOKEN`) | ParaTest shard suffix | — | — |
| `CROWDIN_DSN`, `LOCO_DSN`, `LOKALISE_DSN`, `PHRASE_DSN` | **commented out** in `translation.yaml` | translation providers | — | — |

### 13.2 Feature flags (all `%env(bool:…)%`)

| Flag | Bound as / Twig global | Default (`.env`) | **BKA** | Effect |
| --- | --- | --- | --- | --- |
| `LIST_OWN_EVENTS_ONLY` | `$listOwnEventsOnly` | `false` | **`true`** | event list restricted to the user's organisation |
| `ACTIVATE_PROINFIRMIS` | `$proinfirmisActivated`, `proinfirmisActivated` | `true` | **`false`** | ProInfirmis block in the place form |
| `ACTIVATE_SPONSORED_EVENTS` | `$sponsoredEventsActivated`, `sponsoredEventsActivated` | `false` | **`false`** | sponsored-event feature |
| `ACTIVATE_MEMBERS` | `$membersActivated` | `false` | **`true`** | `member` flag on users + `member` API filter |
| `ACTIVATE_EVENT_VIDEOS` | `$eventVideosActivated`, `eventVideosActivated` | `false` | **`true`** | `videos` collection on the event form |
| `ACTIVATE_PROPOSAL_PLACE` | `$activateProposalPlace` | `false` | **`true`** | guests may propose a new `PlaceProposed` |
| `USE_OPTIMIZED_EVENT_LOAD` | `$useOptimizedEventLoad` | `false` | **`true`** | occurrence-based search + pagination; disables the `postLoad` next-date calculation |
| `HAS_PRINT_OPTIONS` | `$hasPrintOptions`, `hasPrintOptions` | `false` | **`true`** | print fields (members/admins only) |
| `CLIPBOARD_EVENT_LINKS` | `clipboardEventLinks` (Twig only) | `false` | **`true`** | "copy `event=<slug>` for WePublish" button |
| `SHOW_MANUAL` | `$showManual`, `showManual` | `false` | **`true`** | link to `public/documents/Manual_BKa_Mitglieder.pdf` |
| `ACTIVATE_IMAGE_GENERATOR` | `$imageGeneratorActivated`, `imageGeneratorActivated` | `false` | **not set → `false`** | image generator (§2) |
| `ACTIVATE_MULTI_TICKETINGS` | `$multiTicketingsActivated`, `multiTicketingsActivated` | `false` | **not set → `false`** | several ticketing links per event |
| `ACTIVATE_EVENT_NAME_TRANSLATABLE` | `$activateEventNameTranslatable` | `false` | **not set → `false`** | per-language event names (`.env.local` and `.env.test` set it `true`) |
| `ACTIVATE_SLUG_GENERATOR_WITH_ID` | `$slugGeneratorWithIdActivated` → `SlugEntityValueResolver` | `false` | **not set → `false`** | resolve by `slug`, then `oldSlug`, then trailing `-<id>` (`.env.test` sets `true`) |
| `JOIN_US_LINK` | `$…`/Twig `joinUsLink` (`string:`) | empty | `TODO` | "Join us" link in the login form — *README: "Only used on Bka"* |

### 13.3 Declared somewhere but **not** read by the application

| Variable | Where it appears | Status |
| --- | --- | --- |
| `CWEBP_EXEC_PATH` | `.env:88` | **dead** since commit `f64cea4` removed `liip_imagine.cwebp.binary`; liip's default `/usr/bin/cwebp` is used |
| `ACTIVATE_GINTO`, `GINTO_API_URL`, `GINTO_API_KEY`, `GINTO_FILTER_ID`, `GINTO_SOURCE_KEY` | `.env:58-65` (uncommitted), `README.md:103-109` | **not implemented** in this checkout |
| `MAILER_URL` | `.env.local:4` | legacy SwiftMailer-era variable |
| `LOCK_DSN` | `.env.local:7` | no `framework.lock` configuration exists |
| `SRC_BUCKET`, `DST_BUCKET`, `RCLONE_CONFIG_SRC_{TYPE,PROVIDER,ENDPOINT,ACCESS_KEY_ID,SECRET_ACCESS_KEY,REGION,NO_CHECK_BUCKET}`, `RCLONE_CONFIG_DST_{…}` | `.env:114-134`, `.env.local:28-48` | consumed only by `tools/sync-staging-images.sh` (rclone) |

### 13.4 Infrastructure-level variables

| Variable | Consumer | Default | Meaning |
| --- | --- | --- | --- |
| `RUN_MIGRATIONS` | `docker/entrypoint.sh:9` | `1` (Dockerfile sets it) | run `doctrine:migrations:migrate --allow-no-migration -n` on boot |
| `RUN_LOCAL` | `docker/entrypoint.sh:4` | `1` | `sleep 5` before touching the DB |
| `APACHE_DOCUMENT_ROOT` | `Dockerfile:82` | `/var/www/html/public` | Apache docroot |
| `NODE_ENV` | `webpack.config.js:6` | `dev` | Encore runtime env |
| `KERNEL_CLASS` | `.env.test:2` | `App\Kernel` | PHPUnit kernel |
| `SYMFONY_DEPRECATIONS_HELPER` | `.env.test:4` | `999999` | deprecation budget |
| `PANTHER_APP_ENV`, `PANTHER_ERROR_SCREENSHOT_DIR` | `.env.test:5-6` | `panther`, `./var/error-screenshots` | Panther (not actually used — no Panther tests) |
| `SHELL_VERBOSITY`, `BROWSER_ALWAYS_START_WEBSERVER`, `SYMFONY_PHPUNIT_REMOVE`, `SYMFONY_PHPUNIT_VERSION` | `phpunit.xml.dist:15-18` | `-1`, `1`, `""`, `9.5` | test harness |

---

## 14. Loose ends inside the scope

* **`src/Controller/DefaultController.php`** owns the route **named `index`** (`/`), which
  `ImageNormalizer` and `TechnicalSheetNormalizer` use to build absolute URLs. It redirects
  `ROLE_BROADCAST_PARTNER` to `user_token_index` and everybody else to `events_index`; it also
  serves `/api/doc` (`templates/docs/openapi.html.twig`).
* **`src/Formatter/UrlFormatter.php`** — `setHttpUrl()` prefixes `http://` when neither scheme is
  present (a naive `str_contains`, so `https://x.ch?u=http://y` is untouched);
  `getUrlWithoutProtocol()` strips the scheme.
* **`src/EventListener/OnFlushEventListener.php`** is registered manually in
  `config/services.yaml:55-57` (`{event: onFlush, name: doctrine.event_listener, connection: default}`).
  It recomputes `relatedDates`, `isMultiDayEvent`, propagates main-event fields onto sub-events
  (name, status, place, organization, description, specialRate, publicationStatus, audience, labels,
  relatedDates, isMultiDayEvent, user, showInPrint, printCategory, categories) and **deletes and
  recreates every `EventOccurrence`** on each insert/update, with explicit
  `computeChangeSet`/`recomputeSingleEntityChangeSet` calls (and a comment pointing at
  doctrine/orm#11605).
* **`src/EventListener/ArchivedRelationNameListener.php`** keeps `event.archived_organization` /
  `archived_place` in sync when an Organization/Place is renamed, but only for non-past events and
  only when the legacy `name` field actually changed in that flush.
* **`src/EventListener/EventDoctrineListener.php`** — `postLoad` on `Event`; computes `nextDate`
  **only when `USE_OPTIMIZED_EVENT_LOAD` is false** (so it is a no-op on BKA).
* **`src/Validator/`** holds 15 custom constraints + a `labels.schema.json`
  (used by `LabelsValidator` with `justinrainbow/json-schema`).
  `EventImages`/`EventImagesValidator` is the image-relevant one (§1.9).
* **`public/documents/Manual_BKa_Mitglieder.pdf`** (2.9 MB) and **`public/og-image.jpg`** (275 KB)
  are the only committed binary assets outside the theme.
* **`public/openapi.yaml`** (51 KB) is a committed dump produced by
  `php bin/console nelmio:apidoc:dump --format=yaml > public/openapi.yaml`.
* The restored production DB contains **29 tables**; the ones in this document's scope are `image`,
  `video`, `technical_sheet` and `messenger_messages`.

---

## 15. Porting notes *(opinion, not observation)*

These are suggestions for the We.Publish port, clearly separated from the facts above.

1. **Images map cleanly onto We.Publish's existing `Image` model, but three things do not.**
   (a) `position` — We.Publish images attach to blocks, so gallery ordering comes free from the
   block-content array; the 19 828 `position = 0` rows plus 7 743 ordered ones must be preserved as
   array order. (b) `labels.legend` and `labels.alt` are *per-language on the image row*; We.Publish
   stores image title/description on the image and per-language text in the block. Decide early
   whether legend/alt live on the image (shared across all uses) or on the block.
   (c) The deprecated scalar `legend`/`title` columns are 100 % empty in BKA and can be dropped.

2. **The derivative pipeline can be deleted outright.** `ResizeImageUploadedListener` has been a
   no-op since 2026-01-22, so nothing in the current corpus has been server-side resized, rotated or
   optimized since then; the three `webp_*` LiipImagine filters are resolved on demand by the admin
   host into an ephemeral container-local cache. We.Publish's own image transformation service
   should simply replace all of it. Keep the *sizes* though (2000/1024/512 inset, webp q≈65–80) if
   any downstream consumer hard-codes `url_webp_size_512_q_65` / `url_webp_size_1024_q_65`.

3. **Plan a bucket migration, not a URL rewrite.** 27 571 objects under `img/` (plus 1 under `file/`)
   with `uniqid`-shaped keys and mixed-case extensions, 1:1 with DB rows. The legacy
   `https://<admin>/img/<key>` URL shape is still what the `url` field returns, so either keep a
   redirect shim or rewrite consumers.

4. **Budget for orphan cleanup.** 199 ownerless image rows exist and the bug that creates them
   (`Event::$images` without `orphanRemoval`, plus DB-level `ON DELETE CASCADE` bypassing Vich) will
   keep producing them until the port. Decide whether to migrate them (they are unreachable) or drop
   them, and whether the corresponding R2 objects are deleted.

5. **Videos are untyped URLs, not videos.** 2 025 rows, 30 of which are Instagram posts, Spotify
   tracks, a Google search, a LinkedIn post and one JPEG. A We.Publish embed/`EmbedBlock` port should
   expect to fall back to a plain link for a meaningful minority, and should probably validate and
   normalise on import rather than at write time.

6. **There is nothing to port in "background jobs".** No queue consumers, no schedule, no custom
   messages, an empty `messenger_messages` table, and synchronous mail. The nine console commands are
   eight one-off backfills (made obsolete the moment occurrences are recomputed by the new system)
   plus the XLSX import. Only `app:place:proinfirmis-update` is genuinely periodic, and BKA has no
   ProInfirmis data.

7. **The theme is 49 files, of which the substance is: strings, logos, favicons, the email layout, and
   `user.create_defaults`.** Everything else is cosmetic. In the We.Publish monorepo this is a tenant
   website + a handful of German strings; there is no need for a theming engine. Watch out for the
   theme having **only** a German translation file — French BKA screens currently fall through to
   In-Situ wording.

8. **`LOCALES` deserves an explicit decision.** The committed BKA compose said `de`; the working tree
   says `fr|de`; the data says German with 14 French legends. Shipping a bilingual editor for a
   corpus that is 99.9 % German is a cost with little payoff.

9. **Carry over the timezone discipline.** `Europe/Zurich` is pinned in four places (PHP ini, Twig,
   the two custom Doctrine types, and implicitly in every `->format('H:i')`). The custom
   `datetimetz` override exists precisely because Postgres hands back UTC; the equivalent trap exists
   in Prisma/Node and should be handled once, centrally.

10. **Things that look like cleanup but are load-bearing:** the `composer dump-autoload --optimize`
    (not `--classmap-authoritative`) choice; the theme `bundles` symlink recreated in two places; the
    `cookie_samesite: null` needed for the iframe-embedded propose-event wizard; the CSP
    `frame-ancestors` list including `*.bka.ch`; and `setFile()` touching `updatedAt`.
