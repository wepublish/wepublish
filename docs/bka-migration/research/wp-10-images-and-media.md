# We.Publish — images and media

> **Scope.** Everything We.Publish does with images and binary media *today*, read from
> `master` at `360b36ccb`: the Prisma `Image` model and all fifteen relations that point at it,
> the `libs/image/api` GraphQL surface (`Image`, `PeerImage`, `uploadImage` / `updateImage` /
> `deleteImage`, `url` / `transformURL`), the `MediaAdapter` abstraction and its only
> implementation `NovaMediaAdapter`, the standalone media server `apps/media` together with
> `libs/media/api` (MinIO `StorageClient`, `MediaService`, the JWT guard) and
> `libs/media-transform-guard` (the signature helper, the dimension whitelist, the DoS guard),
> the editor picker (`ChooseEditImage` / `ImageSelectPanel` / `ImageEditPanel` /
> `FocalPointInput`) and the website renderer (`libs/image/website`, `ImageBlock`,
> `ImageGalleryBlock`), the URL scheme end to end, the storage configuration, and the concrete
> constraints on importing BKa's 27 571 images. Every claim is grounded in a file path with a
> line number, in `apps/api-example/schema-v2.graphql` (generated, read-only), or in an
> aggregate query against the restored BKa production database. The BKa side is
> [`bka-10-images-infra-misc.md`](bka-10-images-infra-misc.md) §1; this document does not repeat
> it except where the two have to be lined up. A clearly separated *Porting notes* section is at
> the end.

---

## 0. One-paragraph summary

A We.Publish `Image` is **a row in `images` plus one object in an S3 bucket, joined only by the
row's `id`**. The id is a UUID v4 minted by the API (`uuidv4()` in `NovaMediaAdapter._uploadImage`),
the object key is literally `images/<id>` — no extension, no original filename, no directory
fan-out. Nothing about the file is stored in the object store beyond the bytes and a
`Content-Type`; everything else (dimensions, mime, size, format, title, description, source,
licence, tags, focal point) lives in the Postgres row. Images are never served from the bucket
directly: every URL the API emits points at the **media server**, which converts the original to
**WebP** on first request, caches the derivative in a second bucket, and 301-redirects to the
public S3 host. The transformation is carried in the query string as JSON and **signed with the
API's EdDSA key**, so only transformations the API chose to sign can ever be rendered. There is
**exactly one image per relation** anywhere in the schema — no galleries at the entity level, no
ordering, no per-image caption at the relation, no translations, no "main image" flag. Galleries
exist only inside block content, as a JSON array in the revision's `blocks` column.

---

## 1. The `Image` model

### 1.1 Prisma — `libs/api/prisma/schema.prisma:248-297`

```prisma
model Image {
  id         String   @id
  createdAt  DateTime @default(now()) @db.Timestamptz(3)
  modifiedAt DateTime @updatedAt @db.Timestamptz(3)

  description String?
  extension   String
  fileSize    Int
  filename    String?
  format      String
  license     String?
  link        String?
  mimeType    String
  source      String?
  tags        String[]
  title       String?
  height      Int
  width       Int

  focalPointX Float @default(0.5)
  focalPointY Float @default(0.5)

  Author     Author[]
  MemberPlan MemberPlan[]
  Comment    Comment[]

  articleRevisionSocialMediaImages ArticleRevision[] @relation("articleRevisionSocialMediaImage")
  articleRevisionImages            ArticleRevision[] @relation("articleRevisionImage")

  pageRevisionSocialMediaImages PageRevision[] @relation("pageRevisionSocialMediaImage")
  pageRevisionImages            PageRevision[] @relation("pageRevisionImage")

  peer   Peer?   @relation(fields: [peerId], references: [id], onDelete: Restrict)
  peerId String?

  users          User[]
  events         Event[]
  paymentMethods PaymentMethod[]

  banners               Banner[]
  peerProfileLogo       PeerProfile[] @relation("logo")
  peerProfileSquareLogo PeerProfile[] @relation("squareLogo")
  goodies               Goodie[]

  @@index([createdAt])
  @@index([modifiedAt])
  @@index([title])
  @@index([tags])
  @@map("images")
}
```

Note what is **not** there: no `@default` on `id` (the caller must supply it), no unique
constraint on `filename`, no content hash, no `alt`, no `position`, no owner FK, no soft delete,
no `deletedAt`, no per-locale anything.

### 1.2 Column semantics, writer and reader

| Column | Type | Null | Written by | Read by | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | `String` PK | no | `NovaMediaAdapter._uploadImage` → `uuidv4()` (`libs/api/src/lib/media/novaMediaAdapter.ts:95`) | everything; it **is** the S3 object key suffix | No DB default. A direct `prisma.image.create` must pass it (or pass a media-server response that contains it). |
| `createdAt` | `Timestamptz(3)` | no | `@default(now())` | editor "created" row (`imageEditPanel.tsx:402-408`) | |
| `modifiedAt` | `Timestamptz(3)` | no | `@updatedAt` | editor "updated" row; default list sort | |
| `title` | `String?` | yes | editor form; EXIF `Headline` / XMP `title.value` | website `<img title>`, picker caption, `ImageFilter.title` | |
| `description` | `String?` | yes | editor form; EXIF `ImageDescription` / `description.value` / `Caption` | **this is the alt text** — `image.tsx:133` `alt={image.description ?? image.title ?? ''}` | The editor tooltip says so verbatim: *"Beschreibe, was auf dem Bild zu sehen ist. Der Text dient als Alternativtext für Menschen mit Screenreader und für Suchmaschinen."* (`apps/editor/src/app/locales/de.json:1165`) |
| `source` | `String?` | yes | editor form; EXIF `Copyright` / `CopyrightNotice` / `rights.value` | rendered after the caption in `ImageBlock` and `ImageGalleryBlock` via the `image.caption` i18n interpolation | the photo-credit field |
| `link` | `String?` | yes | editor form; XMP `WebStatement` | not rendered by any website component found | validated as a URL or empty in the editor (`imageEditPanel.tsx:134-139`) |
| `license` | `String?` | yes | editor form (no EXIF mapping — `DEFAULT_META_TAG_MAP.licence: []`) | not rendered by any website component found | |
| `tags` | `String[]` | no (array) | editor free-solo `Autocomplete` | `ImageFilter.tags` (`hasSome`), public `getImagesByTag` query | `@@index([tags])` |
| `filename` | `String?` | yes | editor: file basename **without** extension (`imageEditPanel.tsx:162`); otherwise the media server's response, which is the image id | picker caption `${filename}${extension}`, delete dialog, `ImageFilter.title` also matches on it | |
| `extension` | `String` | no | media server: `` `.${metadata.format}` `` (`app.controller.ts:101`) | displayed next to `filename` | so a `.jpg` upload is stored as `.jpeg`, a `.JPG` as `.jpeg` |
| `mimeType` | `String` | no | media server: `` `image/${metadata.format}` `` (`app.controller.ts:99`) | nothing on the website; exposed in GraphQL | |
| `format` | `String` | no | media server: sharp's detected `metadata.format` | exposed in GraphQL only | |
| `fileSize` | `Int` | no | media server: `metadata.size` (bytes, post auto-rotate) | editor shows it via `prettyBytes` | |
| `width` / `height` | `Int` | no | media server: sharp `metadata.width` / `metadata.height` | website `aspect-ratio`, `width`/`height` attributes, `FocalPointInput` layout | For animated images sharp's `height` is the *total page height*; the controller does not use `pageHeight`. |
| `focalPointX` / `focalPointY` | `Float` default `0.5` | no | editor `FocalPointInput` (drag) | API → `resize.position`; website → CSS `object-position` | normalised 0…1, origin top-left |
| `peerId` | `String?` | yes | `ImportPeerArticleService.importImage` (`libs/peering/api/import/.../import-peer-article.service.ts:437-445`) | `HasOptionalPeerLc` resolver | provenance of an image copied from a peer. `onDelete: Restrict` — you cannot delete a peer while its imported images exist. |

### 1.3 Migration history of `images`

| Migration | Change |
| --- | --- |
| `20220812113731_init/migration.sql:117-136` | `CREATE TABLE "images"` with `id, createdAt, description, extension, fileSize, filename, format, license, link, mimeType, modifiedAt, source, tags, title, height, width`. A **separate** `images.focal-point` table held `x`/`y` with `ON DELETE CASCADE` (`:691`). |
| `20221019144201_add_image_to_user` | `users.userImageID` |
| `20221025091043_revisions_image_references` | `articles.revisions.imageID`, `pages.revision.imageID` (+ social-media variants), all `ON DELETE SET NULL` |
| `20221122102944_create_events/migration.sql:15,34` | `events.imageId`, originally `ON DELETE RESTRICT` |
| `20230201123630_generate_pending_migrations/migration.sql:38` | `events_imageId_fkey` **re-created as `ON DELETE SET NULL`** |
| `20240527100519_add_image_to_payment_method` | `payment.methods.imageId` |
| `20240911072649_add_banners` | `Banner.imageId` |
| `20241126132734_peer_article_import` | `images.peerId` |
| `20250522123612_add_square_logo_to_peer_profile` | `peerProfiles.squareLogoId` |
| `20260303133449_set_on_delete_cascade_to_setnull/migration.sql:14,35` | `images_peerId_fkey` re-created as `ON DELETE RESTRICT` |
| `20260505224002_move_focalpoint_and_properties_to_same_table/migration.sql:105-112` | **`images.focal-point` dropped**; `focalPointX` / `focalPointY DOUBLE PRECISION NOT NULL DEFAULT 0.5` added to `images` and backfilled |
| `20260714120000_add_goodies` | `goodies.imageID` |
| `20260817121431_add_timezones_to_dates` | `createdAt` / `modifiedAt` → `timestamptz(3)` |

### 1.4 The GraphQL surface — `libs/image/api/src/lib/image.model.ts`

```graphql
type Image implements HasOptionalPeerLc {   # schema-v2.graphql:1549-1572
  id: String!
  createdAt: DateTime!
  modifiedAt: DateTime!
  filename: String
  title: String
  description: String
  link: String
  source: String
  license: String
  focalPointX: Float!
  focalPointY: Float!
  fileSize: Int!
  extension: String!
  mimeType: String!
  format: String!
  width: Int!
  height: Int!
  tags: [String!]!
  url: String!
  transformURL(input: ImageTransformation): String
  peer: Peer
  peerId: String
}
```

Root fields (`apps/api-example/schema-v2.graphql`):

| Field | Line | Guard | Notes |
| --- | --- | --- | --- |
| `images(filter, sort, order, take, skip, cursorId): PaginatedImages!` | 4509 | `@Permissions(CanGetImages)` | `sort: ImageSort = ModifiedAt`, `order = Descending`, `take = 10`, capped by `getMaxTake` |
| `image(id: String!): Image!` | 4506 | `@Permissions(CanGetImage)` | throws `NotFoundException` |
| `getImagesByTag(tag: String!): [Image!]!` | 4476 | **`@Public()`** (`image.resolver.ts:78`) | the only unauthenticated image query; `tags has tag`, newest first |
| `uploadImage(...file: Upload!...): Image!` | 3365 | `@Permissions(CanCreateImage)` | |
| `updateImage(id: String!, ...): Image!` | 3263 | `@Permissions(CanCreateImage)` — **not** a separate update permission | |
| `deleteImage(id: String!): String!` | 2934 | `@Permissions(CanDeleteImage)` | returns the id |

`ImageFilter` is deliberately thin — `title` (which also matches `filename`, case-insensitive
`contains`, `image.service.ts:129-152`) and `tags` (`hasSome`). There is **no filter by owner,
by peer, by mime type, by date or by orphan status.**

Supporting types:

* `PaginatedImages` (`PaginatedType(Image)`) — `nodes`, `totalCount`, `pageInfo{hasNextPage, hasPreviousPage, startCursor, endCursor}`.
* `PeerImage` (`image.model.ts:119-154`) — `OmitType(Image, ['transformURL'])` plus fourteen flat
  pre-resolved URL fields `xxl…xxs` and `xxlSquare…xxsSquare`. This is the shape a *peered*
  We.Publish serves to another instance so the consumer need not sign its own transformations.
* `UploadImageInput` (`:156-174`) — `PickType(Image, ['filename','title','description','tags','link','source','license','focalPointX','focalPointY'])` + `file: Promise<FileUpload>` as `GraphQLUpload`.
* `UpdateImageInput` (`:176-183`) — `PartialType(OmitType(UploadImageInput, ['file']))` + required `id`.
* `ImageTransformation` input (`image-transformation.model.ts:15-37`) — `width`, `height` (both
  declared `@Field(() => Int)` but **typed `string` in TypeScript**, a type lie that survives only
  because the consumer does `parseInt`), `rotation` (`ImageRotation` enum: `auto|0|90|180|270`),
  `blur`, `negate`, `grayscale`, `sharpen`. **Only `width` and `height` have any effect** —
  everything else is commented out in `NovaMediaAdapter.getImageURL` (`novaMediaAdapter.ts:224-250`)
  with the note *"NOT USED AT THE MOMENT … THEY NEED TO BE LIMITED BY CONFIGURATION SAME AS QUALITY
  AND DIMENSION!"*.

### 1.5 The `HasImage` / `HasImageLc` interfaces

`libs/image/api/src/lib/has-image/has-image.model.ts` declares two interfaces that differ only in
the casing of the id field — `HasImage { imageID, image }` and `HasImageLc { imageId, image }` —
and `has-image.resolver.ts` gives each a `image` resolve-field backed by `ImageDataloaderService`.
Implementers today (`apps/api-example/schema-v2.graphql`):

| Interface | Implementers |
| --- | --- |
| `HasImage` | `Author` (248), `BaseTeaser` (378) and its four concrete teasers `ArticleTeaser` (174), `CustomTeaser` (903), `EventTeaser` (1181), `PageTeaser` (3541); `BreakBlock` (545), `ImageBlock` (1574), `ImageGalleryImage` (1614), `ListicleItem` (1800), `QuoteBlock` (4836), `MailchimpFormInterestOption` (2222); `Goodie` (1342), `MemberPlan` (2616) |
| `HasImageLc` | `PaymentMethod` (3737) only |

Everything else (`Event`, `ArticleRevision`, `PageRevision`, `Banner`, `User`, `Comment`,
`PeerProfile`) declares an `image` resolve-field by hand rather than implementing the interface —
e.g. `libs/event/api/src/lib/event.resolver.ts:79-88` and
`libs/article/api/src/lib/article-revision.resolver.ts:56-74`, both of which are literally the
same four lines the interface resolver contains.

---

## 2. How an image is attached to another entity

### 2.1 Every relation in the schema

**Fourteen `Image?` relation fields across eleven models** — every one nullable, every one at most
*one* image (`ArticleRevision`, `PageRevision` and `PeerProfile` each hold two *different* single
images). Row 15 below is the opposite direction: `Image.peer`, with its `Peer.images Image[]`
back-relation, which records provenance rather than ownership.

| # | Model | FK column | Prisma line | DB `ON DELETE` | Where it was created |
| --- | --- | --- | --- | --- | --- |
| 1 | `ArticleRevision` | `imageID` | 31-32 | `SET NULL` | `20221025091043` |
| 2 | `ArticleRevision` | `socialMediaImageID` | 34-35 | `SET NULL` | `20221025091043` |
| 3 | `Author` | `imageID` | 215-216 | `SET NULL` | init |
| 4 | `Comment` | `guestUserImageID` | 370-371 | `SET NULL` | `20220912145417` |
| 5 | `MemberPlan` | `imageID` | 769-770 | `SET NULL` | init |
| 6 | `PageRevision` | `imageID` | 847-848 | `SET NULL` | `20221025091043` |
| 7 | `PageRevision` | `socialMediaImageID` | 850-851 | `SET NULL` | `20221025091043` |
| 8 | `PaymentMethod` | `imageId` | 947-948 | `SET NULL` | `20240527100519` |
| 9 | `PeerProfile` | `logoID` | 998-999 | `SET NULL` | init |
| 10 | `PeerProfile` | `squareLogoId` | 1001-1002 | `SET NULL` | `20250522123612` |
| 11 | `User` | `userImageID` | 1206-1207 | `SET NULL` | `20221019144201` |
| 12 | `Event` | `imageId` | 1400-1401 | `SET NULL` (was `RESTRICT`) | `20221122102944`, fixed in `20230201123630` |
| 13 | `Banner` | `imageId` | 1638-1639 | `SET NULL` | `20240911072649` |
| 14 | `Goodie` | `imageID` | 2209-2210 | `SET NULL` (explicit in schema) | `20260714120000` |
| 15 | `Image` → `Peer` | `peerId` | 280-281 | **`RESTRICT`** | `20241126132734` / `20260303133449` |

Deleting an image therefore never cascades anything away: every referrer's FK goes to `NULL` and
the entity survives with no picture. `ImageUploadService.deleteImage` (`image-upload.service.ts:93-102`)
deletes the S3 objects **first**, then the row — if the row delete fails the bytes are already gone.

### 2.2 Block-content image references are **not** foreign keys

Blocks live in a JSONB column (`ArticleRevision.blocks Json`, `schema.prisma:23`). An
`ImageBlock` stores `{type: 'image', imageID: '<uuid>', caption, linkUrl}` *inside that JSON*. No
FK, no referential integrity, no `SET NULL`. Deleting an image leaves a dangling `imageID` in every
block that referenced it; the `HasImage` resolver simply returns `null`
(`has-image.resolver.ts:11-19`) and the website's `ImageGalleryBlock` filters those out
(`image-gallery-block.tsx:43` `images.filter(image => image.image)`). `ImageBlock` renders nothing
for a missing image but still renders the caption (`image-block.tsx:61,137`).

### 2.3 A real example end to end — `Event.image`

**Prisma** (`schema.prisma:1400-1401`):

```prisma
  imageId String?
  image   Image?  @relation(fields: [imageId], references: [id])
```

**GraphQL model** (`libs/event/api/src/lib/event.model.ts:68-72`):

```ts
  @Field({ nullable: true })
  imageId?: string;

  @Field(type => Image, { nullable: true })
  image?: Image;
```

**Resolver** (`libs/event/api/src/lib/event.resolver.ts:79-88`):

```ts
  @ResolveField(() => Image, { nullable: true })
  public image(@Parent() event: Event) {
    const { imageId } = event;
    if (!imageId) return null;
    return this.imageDataloaderService.load(imageId);
  }
```

**Write path.** `CreateEventInput` / `UpdateEventInput` carry `imageId` as a plain `String`
(`event.model.ts:143` includes `'imageId'` in the picked fields) and `EventService.createEvent`
spreads it straight into `prisma.event.create` (`event.service.ts:140-156`). There is **no
validation that the id exists** at the application layer; the FK does that.

**The pattern the port should copy instead** is `ArticleRevision`
(`libs/article/api/src/lib/article.model.ts:86-88, 114-118`): the revision carries `imageID` and
`socialMediaImageID`, the *input* type omits the resolved `image` / `socialMediaImage` objects
(`:225-238`), and the revision resolver loads both through the dataloader
(`article-revision.resolver.ts:56-74`). `wp-05` already records that the new `EventRevision`
is to be modelled this way.

---

## 3. The upload flow, end to end

### 3.1 Sequence

```
 Editor (browser)                     API (api-example)              Media server (apps/media)        S3 / MinIO
 ────────────────                     ─────────────────              ────────────────────────         ──────────
 drop / pick file
   │ readImageMetaData(file)            (exifr, client-side)
   │ browser-image-compression          if file > IMG_MIN_SIZE_TO_COMPRESS (default 10 MB)
   │
   ├─ mutation uploadImage(file: Upload!, title, description, tags,
   │                       source, link, license, focalPointX, focalPointY, filename)
   │  multipart/form-data, Authorization: Bearer <session token>
   │                                     │
   │                                     │ @Permissions(CanCreateImage)
   │                                     │ graphqlUploadExpress() → FileUpload stream
   │                                     │ ImageService.createImage → ImageUploadService.uploadImage
   │                                     │ NovaMediaAdapter.uploadImage:
   │                                     │   imageId = uuidv4()
   │                                     │   token   = EdDSA JWT {sub: imageId, action:'upload',
   │                                     │              iss: HOST_URL, aud:'wepublish-media-server', exp: 5m}
   │                                     ├── POST {MEDIA_SERVER_INTERNAL_URL}?imageId=<uuid> ──►
   │                                     │   Authorization: Bearer <jwt>, body = multipart 'file'
   │                                     │   AbortSignal.timeout(50 000)
   │                                     │                                  │ JwtAuthGuard:
   │                                     │                                  │   GET {API_URL}/.well-known/jwks.json
   │                                     │                                  │   verify EdDSA, iss, aud,
   │                                     │                                  │   sub === query.imageId,
   │                                     │                                  │   action === 'upload'
   │                                     │                                  │ multer limit 20 MB
   │                                     │                                  │ SupportedImagesValidator (mime whitelist)
   │                                     │                                  │ MediaService.saveImage:
   │                                     │                                  │   sharp metadata; if EXIF orientation>1
   │                                     │                                  │     and not animated → .rotate()
   │                                     │                                  │     (+ jpeg q95 mozjpeg re-encode)
   │                                     │                                  ├── putObject ──────────►
   │                                     │                                  │   bucket = S3_UPLOAD_BUCKET
   │                                     │                                  │   key    = images/<uuid>
   │                                     │                                  │   Content-Type = image/<format>
   │                                     │  ◄── 201 {id, filename, fileSize, mimeType,
   │                                     │           format, extension, width, height}
   │                                     │ prisma.image.create({ id, ...input, ...image,
   │                                     │                       filename: input.filename ?? image.filename })
   │                                     │ publicContentCache.invalidateDraft('images')
   │  ◄── Image (FullImage fragment) ────┤
```

### 3.2 Client side — editor

| Step | File | Detail |
| --- | --- | --- |
| drop zone / picker | `libs/ui/editor/src/lib/atoms/fileDropInput.tsx` | hidden `<input type=file>` + drag handlers, optional `accept` |
| drag onto an existing field | `libs/ui/editor/src/lib/atoms/chooseEditImage.tsx:155-201` | accepts the first dropped file, rejects `!file.type.startsWith('image')` with a snackbar `articleEditor.panels.invalidImage`, then opens `ImageEditPanel` in a right-hand `Drawer` of width `DRAWER_WIDTHS.sm` |
| EXIF/XMP pre-fill | `libs/ui/editor/src/lib/atoms/imageMetaData.ts` | `exifr.parse(file, true)`; map: `title ← Headline \| title.value`, `description ← ImageDescription \| description.value \| Caption`, `source ← Copyright \| CopyrightNotice \| rights.value`, `link ← WebStatement`, `licence ← ∅` |
| client compression | `libs/ui/editor/src/lib/panel/imageEditPanel.tsx:300-329` | `browser-image-compression` with `maxSizeMB = IMG_MIN_SIZE_TO_COMPRESS`, applied only when the file is already larger than that threshold |
| threshold | `apps/editor/src/main.server.ts:15-17`, `libs/editor/api/src/lib/setup.tsx:69` | `IMG_MIN_SIZE_TO_COMPRESS`, **default 10** (MB), injected into the page as a JSON `<script>` and read by `getSettings()` |
| the mutation | `libs/editor/api/src/lib/schemas/image.graphql:111-137` | `UploadImage` sending every metadata field plus `file: Upload!` |

There is **no file-type `accept` filter on the picker** — the check is a runtime
`file.type.startsWith('image')`, so a `.tiff` or `.avif` passes the editor and is accepted by the
media server, while a `.svg` is rejected by the media server's mime whitelist, not by the editor.

### 3.3 API side

`ImageResolver.uploadImage` (`libs/image/api/src/lib/image.resolver.ts:60-64`) →
`ImageService.createImage` (`image.service.ts:88-91`) → `ImageUploadService.uploadImage`
(`image-upload.service.ts:30-45`):

```ts
  async uploadImage({ file, ...input }: UploadImageInput): Promise<Image> {
    const { id, ...image } = await this.mediaAdapter.uploadImage(file);
    const created = await this.prisma.image.create({
      data: { id, ...input, ...image, filename: input.filename ?? image.filename },
    });
    await this.publicContentCache.invalidateDraft('images');
    return created;
  }
```

`...image` is spread **after** `...input`, so the media server's `filename`, `fileSize`,
`extension`, `mimeType`, `format`, `width`, `height` always win over anything the client sent —
except `filename`, which is then explicitly resolved back to the client's value when present.
When the client sends no `filename`, the DB `filename` becomes the UUID (the media server returns
`filename: imageId`, `app.controller.ts:97`).

Payload limits: `apps/api-example/src/main.ts:42,62` set `json`/`urlencoded` to
`MAX_PAYLOAD_SIZE = '1MB'` (`libs/utils/api/src/lib/max-payload-size.ts:1`), but
`graphqlUploadExpress()` (`:63`) handles `multipart/form-data`, which those parsers skip, and is
constructed **with no options** — graphql-upload v13 defaults are `maxFieldSize 1 MB`,
`maxFileSize Infinity`, `maxFiles Infinity`
(`node_modules/graphql-upload/public/processRequest.js:48-50`). **The API imposes no image size
limit at all**; the 20 MB multer cap on the media server is the real one.

### 3.4 Media server side — `apps/media`

| Route (`apps/media/src/app/app.controller.ts`) | Method | Guard | Behaviour |
| --- | --- | --- | --- |
| `/health` | GET | — | `{status:'ok'}` |
| `/favicon.ico` | GET | — | 404 |
| `/` `?imageId=` | POST | `JwtAuthGuard` | `FileInterceptor('file')` + `SupportedImagesValidator`; `MediaService.saveImage`; 201 with the metadata JSON (`:79-105`) |
| `/:imageId` | GET | **none** | the transform endpoint, §6 (`:107-173`) |
| `/:imageId` | DELETE | `JwtAuthGuard` | deletes every derivative then the original; 204 (`:175-181`) |
| `/document` `?documentId=` | POST | `JwtAuthGuard` | `SupportedDocumentsValidator`; key `documents/<id>/<originalname>` (`:183-212`) |
| `/document/:documentId/thumbnail` | GET | none | PDF first page via `pdftoppm -scale-to 600` → WebP, or a static category icon (`:214-271`) |
| `/document/:documentId/:filename` | GET | none | delegates to the next route (`:273-280`) |
| `/document/:documentId` | GET | none | lazily copies the object into the transformation bucket with the right `Content-Type`, then redirects (`:282-339`) |
| `/document/:documentId` | DELETE | `JwtAuthGuard` | (`:341-350`) |

> **The `@Controller({version: '1'})` decorator (`app.controller.ts:45-47`) has no effect.**
> `app.enableVersioning()` is never called (`apps/media/src/bootstrap.ts`, and
> `grep -rn "enableVersioning" apps libs` returns nothing), so Nest mounts the routes at the root.
> The `/v1/...` paths in the guard's comments (`jwt-auth.guard.ts:77-81`) and in
> `MEDIA_SERVER_URL: http://localhost:4100` (no path) agree with "root", not with the decorator.

Bootstrap (`apps/media/src/bootstrap.ts`): `sharp.cache({memory: 50, items: 20})`,
`sharp.concurrency(2)`, global `ZodValidationPipe` (this is what turns the query string into a
`TransformationsDto`), CORS `origin: true, credentials: true`, `helmet` with CSP and CORP
disabled, port `PORT || 4100`.

Accepted upload mime types (`libs/media/api/src/lib/media-service/supported-images-validator.ts:4-12`):
`image/webp`, `image/png`, `image/gif`, `image/jpeg`, `image/jpg`, `image/avif`, `image/tiff`.
**No SVG, no HEIC, no BMP, no JFIF-as-its-own-type** (a `.jfif` file is normally sent as
`image/jpeg`, so it passes).

### 3.5 Authentication: the EdDSA JWT handshake

| Side | Code | Fact |
| --- | --- | --- |
| API signs | `novaMediaAdapter.ts:73-87` | `new SignJWT({action}).setProtectedHeader({alg:'EdDSA'}).setSubject(imageId).setIssuer(hostUrl).setAudience('wepublish-media-server').setExpirationTime('5m').setIssuedAt()` with `importPKCS8(JWT_PRIVATE_KEY, 'EdDSA')` |
| API publishes the public half | `libs/session/api/src/lib/jwks.controller.ts:22-47` | `GET /.well-known/jwks.json`, `@Public()`, one key, `use: 'sig'`, `alg: 'EdDSA'`, computed `kid`, cached in-process |
| Media server fetches it | `libs/media/api/src/lib/authentication/jwks-client.service.ts:36-77` | `GET {API_URL}/.well-known/jwks.json`, `importJWK(keys[0], 'EdDSA')`, cached 24 h, **falls back to the stale key** if a refresh fails |
| Media server verifies | `jwt-auth.guard.ts:18-64` | Bearer token; `jwtVerify(..., {algorithms:['EdDSA'], audience:'wepublish-media-server', issuer: apiUrl})`; then `payload.sub === imageId` from `params.imageId \|\| query.imageId \|\| params.documentId \|\| query.documentId`; then `payload.action === (method === 'DELETE' ? 'delete' : 'upload')` |

So the token is **scoped to one object and one action and expires in five minutes**. Anybody
holding `JWT_PRIVATE_KEY` can mint one — which is exactly what the seed script does (§11.4).

There is **no shared static token**. `.ai/development.md:130` still lists
`MEDIA_SERVER_TOKEN | secret | Media server auth token`; `grep -rn MEDIA_SERVER_TOKEN` over the
whole tree finds it only in that documentation line. **The doc is stale.**

### 3.6 Replace and delete

| Operation | Code | Behaviour |
| --- | --- | --- |
| `ImageUploadService.replaceImage(imageId, input, {profileImage})` | `image-upload.service.ts:47-91` | uploads a *new* object (new UUID), `prisma.image.update` moves the row to the **new id** while keeping the same primary-key row, then deletes the old object from storage if the id changed. Used only by `ProfileService.uploadUserProfileImage` (`libs/user/api/src/lib/profile.service.ts:26-31`). Note it rewrites `title/description/tags/source/link/license/focalPoint*` from the input, so omitted fields become `undefined` → Prisma skips them. |
| `ImageUploadService.deleteImage(imageId, {profileImage})` | `:93-102` | `mediaAdapter.deleteImage` (HTTP DELETE, signed) **then** `prisma.image.delete` **then** cache invalidation |
| `MediaService.deleteImage` | `libs/media/api/src/lib/media-service/media.service.ts:318-335` | lists every object under `images/<id>` in the *transformation* bucket (recursive) and removes them, then removes `images/<id>` from the upload bucket |

Nothing deletes images that nothing references. **There is no orphan garbage collection** — no
command, no cron, no `nx` target. `grep` for any such job finds none.

---

## 4. The media server's transform pipeline

`MediaService.transformImage` (`media.service.ts:145-285`):

1. `storage.getFile(uploadBucket, 'images/<id>')`. On `NoSuchKey` → `imageExists = false` and the
   stream becomes `assets/fallback-image.webp` with a **random aspect ratio** filled in when only
   one of width/height was requested (`:105-138`; ratios 4:3, 16:9, 1:1, 3:2, 5:4, 9:16).
2. If the image is missing and a fallback derivative for this exact transformation key already
   exists, return it immediately (`:172-181`).
3. **Signature check** — only when `hasTransformations()` is true, i.e. when anything other than
   `sig` is present (`:140-143, 185-194`). Since `NovaMediaAdapter` always appends `quality=…`,
   every URL the API emits is signed and verified.
4. `sharp({animated: true, failOn: 'error'})`, then `TransformGuard.checkDimensions` and
   `checkQuality`, then in order: `extend`, `resize`, `blur`, `sharpen`, `flip`, `flop`, `rotate`,
   `negate`, `grayscale` (`:209-247`).
5. `.webp({quality, effort})` — **output is always WebP**, whatever the source was.
6. `TransformGuard.checkImageSize` on the result, then `putObject` into the transformation bucket
   at `images/<id>/<transformationsKey>` (or `images/fallback/<transformationsKey>`), with
   `Content-Type: image/webp`.

### 4.1 `TransformGuard` limits — `libs/media/api/src/lib/media-service/transform.guard.ts`

| Constant | Value | Effect |
| --- | --- | --- |
| `M_PIXEL_LIMIT` | 20 | A requested output above 20 MP → `BadRequestException('Transformation exceeds pixel limit!')` (`:136-138`). With **no** resize/extend requested and an original above 20 MP, the guard silently injects `resize {width,height,withoutEnlargement:true}` scaled down to 20 MP (`:86-106`). |
| `IMAGE_SIZE_LIMIT` | 10 | Output larger than 10 MB → `BadRequestException('Transformation exceeds image size limit!')` (`:142-147`). Comment: "WebP Max". |
| `MAX_IMAGE_QUALITY` | 80 | `quality > 80` → `BadRequestException` (`:149-153`) |
| `DEFAULT_IMAGE_QUALITY` | 65 | applied when no `quality` parameter is present |
| `effort` | `ceil(4 - mPixel/(20/5))`, floored at 0 | WebP encode effort, lower for bigger images (`:20-23`) |
| animated | `metadata.pages > 1` | forces `withoutEnlargement: true` on resize (`media.service.ts:214-217`) — DoS prevention |

### 4.2 The transformation key and object layout

`getTransformationKey` (`libs/media-transform-guard/api/src/lib/media-server-signature.helper.ts:70-84`)
is `JSON.stringify` with a replacer that **recursively sorts object keys**. The result is used
both as the signing payload and, verbatim, as the S3 object-key suffix:

```
<S3_UPLOAD_BUCKET>/images/<uuid>                                           ← the original, as uploaded
<S3_TRANSFORMATION_BUCKET>/images/<uuid>/{"quality":80,"resize":{"fit":"cover","width":1500,"withoutEnlargement":true}}
<S3_TRANSFORMATION_BUCKET>/images/fallback/{"quality":80,"resize":{…}}     ← the placeholder, shared by every missing image
<S3_UPLOAD_BUCKET>/documents/<uuid>/<original filename>
<S3_TRANSFORMATION_BUCKET>/documents/<uuid>/thumbnail
```

Yes — the object key literally contains a JSON document, braces and quotes included.

### 4.3 Caching, redirects and the fallback host

`AppController.transformImage` (`app.controller.ts:107-173`):

* In-process `CacheModule` (`app.module.ts:20-24`: `ttl 259 200 s = 72 h`, `max 50 000` entries,
  global) keyed `"<imageId>-<transformationsKey>"` → `{uri, exists}`.
* Hit **and** `exists` → `Cache-Control: public, max-age=43200, immutable, stale-if-error=604800,
  stale-while-revalidate=86400` (production only, `:59-67`) and **301** to
  `${S3_PUBLIC_HOST}/${uri}`; the cache entry's TTL is refreshed.
* Hit **and** `!exists` → `Cache-Control: public, max-age=600` and **307** (so the negative answer
  is not cached by intermediaries as permanent).
* `MEDIA_FALLBACK_URL` set and the original is absent → **301 to `${MEDIA_FALLBACK_URL}${req.url}`**,
  i.e. the *same path and query* on another media server. This is how review deployments borrow
  production images: `.github/workflows/on-pr-label-deploy-review.yml:90` sets
  `media_fallback_url: https://media-<project>.wepublish.cloud`. It is **not** a way to point at a
  bare bucket — the target must be a media server able to honour the signed query string.
* Miss and no fallback → the derivative is generated, then `{uri, exists:false}` is cached for
  14 400 s when the original is missing.
* `assertRemoteFileIsAccessible` (`apps/media/src/app/assertRemoteFileIsAccessible.ts`) does a
  one-off `HEAD` on the first constructed public URL per process and **throws** if it is
  unreachable — a boot-time misconfiguration tripwire guarded by the module-level
  `S3_HOST_CHECKED` flag.

### 4.4 Runtime image

`Dockerfile:256-309`. Build stage installs `libjemalloc-dev poppler-utils fonts-liberation`,
copies `pdftoppm` and its shared libraries into the runtime image, sets
`LD_PRELOAD=/usr/lib/x86_64-linux-gnu/libjemalloc.so` and
`NODE_OPTIONS=--max-old-space-size=512`, exposes 4100, runs as uid 1001. `MEDIA_FALLBACK_URL` is
baked in as a build arg. `apps/media` has its **own `package.json` + `package-lock.json`** and the
build stage runs `npm ci` against them (and strips `nx.json` plugins first) — so adding a
dependency to the media server means updating that lockfile, not the root one.

---

## 5. Storage configuration

### 5.1 What is on `master`: MinIO

`libs/media/api/src/lib/storage-client/storage-client.service.ts` wraps the `minio` SDK
(`minio@^8.0.1`, both in the root `package.json:340` and `apps/media/package.json:24`):

```ts
export type StorageClientConfig = ClientOptions;      // minio's ClientOptions

@Injectable()
export class StorageClient {
  private client: Client;
  constructor(@Inject(STORAGE_CLIENT_MODULE_OPTIONS) config: StorageClientConfig) {
    this.client = new Client(config);
  }
  hasFile(...)            // statObject, boolean
  getFile(...)            // getObject → Readable
  getFileInformation(...) // statObject
  saveFile(...)           // putObject
  deleteFile(...)         // removeObject
  listFiles(...)          // listObjects, drained into BucketItem[]
  deleteFiles(...)        // removeObjects
}
```

Wired in `apps/media/src/app/app.module.ts:30-56`:

```ts
StorageClientModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    endPoint:  config.getOrThrow('S3_ENDPOINT'),
    port:     +config.getOrThrow('S3_PORT'),
    accessKey: config.getOrThrow('S3_ACCESS_KEY'),
    secretKey: config.getOrThrow('S3_SECRET_KEY'),
    publicHost: config.getOrThrow('S3_PUBLIC_HOST'),
    useSSL:   Boolean(config.get('S3_SSL')),
    region:   config.get('S3_REGION', 'us-east-1'),
  }),
}),
// MediaServiceModule.forRootAsync:
  uploadBucket:         config.get('S3_UPLOAD_BUCKET', 'wepublish-staff'),
  transformationBucket: config.get('S3_TRANSFORMATION_BUCKET', 'wepublish-transformed'),
```

**Two buckets, one endpoint.** The transformation bucket is the public one; the upload bucket is
never served directly (`docker-compose.yml:131` `mc anonymous set download local/wepublish-transformed`
makes only the transformed bucket world-readable).

`useSSL: Boolean(config.get('S3_SSL'))` is a trap: any non-empty string, `"false"` included, is
truthy.

### 5.2 `@nestjs/storage` exists only on an unmerged branch

The task brief mentions `@nestjs/storage` disks. **It is not on `master`**:
`grep -rn "@nestjs/storage\|InjectDisk" .` (excluding `node_modules`/`.git`) matches nothing in
the working tree. It lives in a local worktree,
`/Users/itrulia/Documents/wepublish/.claude/worktrees/nestjs-storage-migration`, commit
`18239d083 refactor(media): replace the minio storage client with @nestjs/storage`. For
completeness, what that branch does:

| Aspect | `master` | `nestjs-storage-migration` |
| --- | --- | --- |
| Dependency | `minio@^8.0.1` | `@nestjs/storage@^0.0.3` (+ root `package.json:257`) |
| Abstraction | `StorageClient` service, bucket passed per call | two named **disks**, injected: `@InjectDisk(UPLOAD_DISK)` / `@InjectDisk(TRANSFORMATION_DISK)` with `UPLOAD_DISK = 'upload'`, `TRANSFORMATION_DISK = 'transformation'` (`libs/media/api/src/lib/media-service/media.service.ts:30-32,72-78`) |
| Registration | `StorageClientModule.forRootAsync` | `StorageModule.forRootAsync` with `{default: TRANSFORMATION_DISK, disks: {upload: new S3Disk({...,bucket: S3_UPLOAD_BUCKET}), transformation: new S3Disk({..., bucket: S3_TRANSFORMATION_BUCKET, publicUrl: S3_PUBLIC_HOST})}}` |
| Endpoint | host + port fields | one URL: `` `${S3_SSL?'https':'http'}://${S3_ENDPOINT}:${S3_PORT}` ``, `forcePathStyle: true` |
| `libs/media/api` files | `storage-client.service.ts`, `storage-client.module.ts` | both **deleted** |
| Env vars | unchanged | unchanged — `S3_PUBLIC_HOST` is still read from `process.env` in the controller |

Everything below describes `master` (MinIO) unless it says otherwise. Note also the memory-level
caveat recorded elsewhere in this repo: `@nestjs/storage` is ESM-only and has to be
webpack-externalised.

### 5.3 Environment variables

| Variable | Read by | Default | Purpose |
| --- | --- | --- | --- |
| `S3_ENDPOINT` | media `app.module.ts:36` | required | MinIO/S3 host (no scheme) |
| `S3_PORT` | `:37` | required | |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | `:38-39` | required | |
| `S3_PUBLIC_HOST` | `:40`, and `app.controller.ts:138,154,241,253,309,321` | required | prefix of every redirect target; **the browser-facing bucket URL** |
| `S3_SSL` | `:41` | unset = falsy | see trap above |
| `S3_REGION` | `:42` | `us-east-1` | |
| `S3_UPLOAD_BUCKET` | `:49` | `wepublish-staff` | originals |
| `S3_TRANSFORMATION_BUCKET` | `:50-53` | `wepublish-transformed` | derivatives, public |
| `MEDIA_FALLBACK_URL` | `app.controller.ts:56`, `bootstrap.ts:31` | unset | upstream media server for misses |
| `API_URL` | `app.module.ts:60` | required | where the JWKS lives |
| `PORT` | `bootstrap.ts:28` | 4100 | |
| `MEDIA_SERVER_URL` | api `app.module.ts:363`, `libs/health/api/.../health.controller.ts:55`, `libs/system-info/api/.../system-info.controller.ts:35`, `helm/charts/wepublish/templates/ingress.yaml:54` | required | **public** base URL the API bakes into every image URL |
| `MEDIA_SERVER_INTERNAL_URL` | api `app.module.ts:357` | falls back to `MEDIA_SERVER_URL` | cluster-internal URL used for upload/delete |
| `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | api `app.module.ts:358-360`, `libs/session/api/.../jwks.controller.ts` | required | Ed25519 PKCS#8 PEM, `\n` escaped in env |
| `HOST_URL` | api `app.module.ts:365` | required | JWT `iss`, must match what the media server reads from JWKS |
| `EXTRA_ALLOWED_DIMENSIONS` | `libs/media-transform-guard/api/src/lib/image-transformation.limiter.ts:38-43` | unset | JSON array of extra `{width?,height?}` the API is willing to sign |
| `EXTRA_ALLOWED_QUALITIES` | `:47-52` | unset | **dead** — `ALLOWED_QUALITIES` is declared, appended to, and never read |
| `IMG_MIN_SIZE_TO_COMPRESS` | editor `main.server.ts:15` | 10 | MB threshold for client-side compression |
| `mediaServer.quality` (config YAML, not env) | api `app.module.ts:366`, `apps/api-example/src/default.yaml:5-6` | `1` | multiplied by 80 to produce the `quality` query parameter |

### 5.4 Local development

`docker-compose.yml:123-140` runs `minio/minio:latest`, creating
`/data/wepublish-staff` and `/data/wepublish-transformed` and making the latter anonymously
downloadable. The media container (`:92-107`) gets `S3_ENDPOINT: storage`, `S3_PORT: 9000`,
`API_URL: http://api:4000`. The api container (`:28-32`) gets
`MEDIA_SERVER_URL: http://localhost:4100`, `MEDIA_SERVER_INTERNAL_URL: http://media:4100` and a
committed throwaway Ed25519 key pair. `npm run clean:media` removes the `wepublish_storage`
volume (`package.json:17`).

---

## 6. The URL scheme

### 6.1 How a URL is built — `NovaMediaAdapter.getImageURL` (`libs/api/src/lib/media/novaMediaAdapter.ts:189-266`)

```ts
async getImageURL(image: Image, transformations?: ImageTransformation): Promise<string> {
  const queryParameters = [] as string[];

  if (transformations?.width || transformations?.height) {
    const xFocalPoint = image.focalPointX > 0.6 ? 'right' : image.focalPointX < 0.4 ? 'left'   : '';
    const yFocalPoint = image.focalPointY > 0.6 ? 'bottom': image.focalPointY < 0.4 ? 'top'    : '';
    const position = `${xFocalPoint} ${yFocalPoint}`.trim() || undefined;

    validateImageDimension(transformations.width, transformations.height);

    queryParameters.push(`resize=${JSON.stringify({
      width: transformations.width,
      height: transformations.height,
      withoutEnlargement: true,
      fit: 'cover',
      position,
    })}`);
  }

  // Max quality is 80 so 1 => 80
  queryParameters.push(`quality=${Math.ceil(this.config.quality * 80)}`);

  const transformationsDto = this.parseTransformations(queryParameters);
  const privateKey = await this.privateKeyPromise;
  const signature  = await signImageTransformations(privateKey, image.id, transformationsDto);
  queryParameters.push(`sig=${signature}`);

  return encodeURI(`${this.url}/${image.id}?${queryParameters.join('&')}`);
}
```

Consequences worth spelling out:

* **The plain `url` field is not the original file.** With no transformation it still carries
  `quality=80` and a signature, and the media server still converts to WebP. There is **no way,
  through the API, to obtain the bytes exactly as uploaded.**
* `fit: 'cover'` and `withoutEnlargement: true` are hard-coded. Requesting a width larger than the
  original yields the original size, not an upscale.
* The focal point collapses to **nine discrete sharp positions** (`''`, `left`, `right`, `top`,
  `bottom`, and the four corners) via the 0.4/0.6 thresholds — a focal point of 0.45 is treated as
  centre.
* `encodeURI` percent-encodes the JSON braces and quotes, so the wire form is
  `resize=%7B%22width%22:1500,...%7D`.

### 6.2 A worked example

Image `id = 1f8b…`, `focalPointX = 0.8`, `focalPointY = 0.5`, config `quality: 1`,
`MEDIA_SERVER_URL = https://media.example.org`, query `transformURL(input:{width:1500})`:

```
resize JSON  {"width":1500,"withoutEnlargement":true,"fit":"cover","position":"right"}
params       resize=<that>&quality=80
signing key  getTransformationKey(dto)
             {"quality":80,"resize":{"fit":"cover","position":"right","width":1500,"withoutEnlargement":true}}
payload      "1f8b…-" + that key                 (media-server-signature.helper.ts:17-22)
signature    third segment of a compact JWS, EdDSA, deterministic   (:28-43)

https://media.example.org/1f8b…?resize=%7B%22width%22:1500,%22withoutEnlargement%22:true,%22fit%22:%22cover%22,%22position%22:%22right%22%7D&quality=80&sig=<base64url>
```

The media server recomputes the key from the parsed query, rebuilds
`header.payload.signature` and calls `compactVerify`
(`media-server-signature.helper.ts:50-63`). Any change to the query — including re-ordering that
survives `JSON.stringify` key sorting, or a different `quality` — invalidates the signature.

### 6.3 Which dimensions the API is willing to sign

`libs/media-transform-guard/api/src/lib/image-transformation.limiter.ts:8-36`. `validateImageDimension`
throws `BadRequestException('Requested forbidden dimension (WxH)')` for anything not in this list;
width-only, height-only and width+height are matched as distinct shapes.

| Group | Entries |
| --- | --- |
| Editor formats | `100×100`, `280×200`, `400×200`, `800×300`, `260×300`, `300` (width only) |
| Website, free height | `2400`, `1500`, `1200`, `1000`, `800`, `500`, `300`, `200` (width only) |
| Website, square | `2400×2400`, `1500×1500`, `1200×1200`, `1000×1000`, `800×800`, `500×500`, `300×300`, `200×200` |

(`{width: 300}` appears twice, once per group — harmless.) `EXTRA_ALLOWED_DIMENSIONS` appends more
at module load. **Note the guard runs only in the API process**; the media server trusts the
signature instead, so the whitelist is about *what the API will sign*, not about what the media
server will render.

### 6.4 The preset fragments

| Consumer | File | Aliases |
| --- | --- | --- |
| Editor | `libs/editor/api/src/lib/schemas/image.graphql:1-11` | `largeURL`=500, `mediumURL`=300, `thumbURL`=280×200, `squareURL`=100×100, `previewURL`=400×200, `column1URL`=800×300, `column6URL`=260×300 |
| Website | `libs/website/api/src/lib/schemas/image.graphql:1-25` | `ImageURLs`: `xxxl`=2400, `xxl`=1500, `xl`=1200, `l`=1000, `m`=800, `s`=500, `xs`=300, `xxs`=200. `SquareImageURLs`: the same eight as `W×W` squares, aliased `…Square`. `FullImageURLs` = both. |
| Peering (remote fetch) | `libs/peering/api/src/lib/remote/remote-image.graphql:4-18` | the website set minus `xxxl`/`xxxlSquare` |

`SlimImage` = `id,width,height,title,description,focalPointX,focalPointY` + `ImageURLs`;
`FullImage` adds `source,link,license` + `FullImageURLs`
(`libs/website/api/src/lib/schemas/image.graphql:34-65`).

**Cost note:** `FullImage` resolves **17** `transformURL` fields, each of which performs an EdDSA
signature. `Math` aside, that is 17 signs per image per query; the private key is imported once
and cached in a promise (`novaMediaAdapter.ts:67-71`), but the signing itself is per field.

---

## 7. Focal point

| Layer | Representation | Code |
| --- | --- | --- |
| DB | `focalPointX`, `focalPointY` `DOUBLE PRECISION NOT NULL DEFAULT 0.5` | `schema.prisma:267-268` |
| GraphQL | `Float!` with `defaultValue: 0.5` on both the type and the inputs | `image.model.ts:53-56` |
| Editor | `FocalPointInput` — the image is laid out at its real aspect ratio capped at `maxHeight` (420 px in the panel) and a 50 px draggable circle writes `{x,y}` in 0…1 | `libs/ui/editor/src/lib/atoms/focalPointInput.tsx:78-140`, used at `imageEditPanel.tsx:368-383` |
| API → media server | thresholded into sharp's `position` string, §6.1 | `novaMediaAdapter.ts:199-209` |
| Website | CSS `object-position: ${focalPointX*100}% ${focalPointY*100}%`, **unless `square`**, in which case `center center` | `libs/image/website/src/lib/image.tsx:91-97, 74` |

So the focal point is applied **twice and differently**: coarsely server-side when the image is
actually cropped to a square, and precisely client-side as `object-position` for the non-square
case where the image is letterboxed by `object-fit: contain`.

---

## 8. The editor image picker

### 8.1 The components

| Component | File | Role |
| --- | --- | --- |
| `ChooseEditImage` | `libs/ui/editor/src/lib/atoms/chooseEditImage.tsx` | The **field widget**. Empty → a dashed `ButtonBase` "choose image" that also accepts a drop. Filled → the image on a blurred copy of itself, with up to three overlay icon buttons (choose / edit / remove). Props: `image`, `disabled`, `openChooseModalOpen?`, `openEditModalOpen?`, `removeImage?`, `onSelect?`, `maxHeight = 240`. Each optional callback controls whether its button renders. |
| `ImageSelectPanel` | `libs/ui/editor/src/lib/panel/imageSelectPanel.tsx` | The **library browser**. A `FileDropInput` at the top, a search `TextField` bound to `ImageList(filter:)`, a responsive grid of 180 px cards (`mediumURL` thumbnail, title, `filename+extension`), 20 per page with a "load more" cursor pagination. Dropping a file switches the whole panel to `ImageEditPanel` in upload mode. Wrapped in `createCheckedPermissionComponent([CanGetImage, CanGetImages, CanGetImages, CanDeleteImage])` (yes, `CanGetImages` twice). |
| `ImageEditPanel` | `libs/ui/editor/src/lib/panel/imageEditPanel.tsx` | The **metadata form**, in both "upload" (`file` prop) and "edit" (`id` prop) modes. |
| `ImageUploadPanel` | `libs/ui/editor/src/lib/panel/imageUploadPanel.tsx` | A full-height drop zone only. |
| `ImageUploadAndEditPanel` | `libs/ui/editor/src/lib/panel/imageUploadAndEditPanel.tsx` | `ImageUploadPanel` → (on file) → `ImageEditPanel`, used by the standalone `/images/upload` route. |
| `FocalPointInput` | `libs/ui/editor/src/lib/atoms/focalPointInput.tsx` | §7 |
| `readImageMetaData` | `libs/ui/editor/src/lib/atoms/imageMetaData.ts` | EXIF/XMP pre-fill |
| `ImageList` route | `apps/editor/src/app/routes/images/imageList.tsx` | The image library page: grid/list toggle persisted in `localStorage` (`LocalStorageKey.ImageListLayout`), search, pagination, upload button, per-row edit/delete with a confirmation dialog. Routes `images`, `/images/upload`, `/images/edit/:id` (`apps/editor/src/app/app.tsx:605,613,621`). |

### 8.2 The `ImageEditPanel` form in detail

`react-hook-form` + `zodResolver`, with **async `defaultValues`** — the repo's standard record-form
pattern.

| Mode | `defaultValues` source | `:160-233` |
| --- | --- | --- |
| upload (`file` set) | `readFile(file)` via `FileReader`/`Image` to get a data URL and the natural dimensions; `filename` = basename, `extension` = `.` + the rest of the dotted name; metadata pre-filled from `imageMetaData` | `:161-187` |
| edit (`id` set) | `client.query(ImageDocument, {id})`, mapping `focalPoint: {x: image.focalPointX, y: image.focalPointY}`, `imageURL: image.mediumURL`, `originalImageURL: image.url` | `:193-227` |

Fields rendered: a focal-point picker, a read-only `DescriptionList` (filename+extension,
`WxH`, created, updated, `prettyBytes(fileSize)`, a link to the original), then `filename`,
`title`, `description` (+ the alt-text tooltip), the block-level `linkUrl` when an
`ImageBlockValue` was passed, a free-solo `tags` `Autocomplete`, and `source` / `link` / `license`
under an "attribution" heading.

Submit (`:257-298`) builds

```ts
const commonInput = {
  filename:    values.filename    || undefined,
  title:       values.title       || undefined,
  description: values.description || undefined,
  tags:        values.tags,
  source:      values.source      || undefined,
  link:        values.link        || undefined,
  license:     values.license     || undefined,
  focalPointX: values.focalPoint?.x ?? 0.5,
  focalPointY: values.focalPoint?.y ?? 0.5,
};
```

> **Finding.** Because `'' || undefined === undefined`, Apollo drops the variable, the GraphQL arg
> is absent, and `prisma.image.update({data: {...input}})` skips the column. **Clearing a title,
> description, source, link, licence or filename in the editor does not clear it in the
> database** — the old value survives. Only `tags` (always an array) and the focal point (always
> defaulted) can be reset. Code-level certainty; not exercised at runtime here.

### 8.3 How a form field uses the picker — real example

`apps/editor/src/app/routes/events/eventForm.tsx`. The form value object carries **both** the id
and the resolved image, because `ChooseEditImage` needs the URLs:

```ts
// eventSchema, :46-47
    imageId: z.string().nullish(),
    image: z.custom<FullImageFragment>().nullish(),
```

```tsx
// :264-287
<FormControl>
  <FormLabel>{t('event.form.image')}</FormLabel>
  <Controller
    control={control}
    name="image"
    render={({ field }) => (
      <ChooseEditImage
        onSelect={image => {
          setChooseModalOpen(false);
          setValue('imageId', image.id);
          setValue('image', image);
        }}
        image={field.value}
        disabled={false}
        openChooseModalOpen={() => setChooseModalOpen(true)}
        openEditModalOpen={() => setEditModalOpen(true)}
        removeImage={() => {
          field.onChange(undefined);
          setValue('imageId', undefined);
        }}
      />
    )}
  />
</FormControl>
```

plus two sibling `Drawer`s at the bottom of the component (`:293-327`):

```tsx
<Drawer anchor="right" slotProps={{paper:{sx:{width: DRAWER_WIDTHS.sm, maxWidth:'100vw'}}}}
        open={isChooseModalOpen} onClose={() => setChooseModalOpen(false)}>
  <ImageSelectPanel
    onClose={() => setChooseModalOpen(false)}
    onSelect={image => { setChooseModalOpen(false); setValue('imageId', image.id); setValue('image', image); }} />
</Drawer>

{imageId && (
  <Drawer anchor="right" /* … */ open={isEditModalOpen} onClose={() => setEditModalOpen(false)}>
    <ImageEditPanel id={imageId} onClose={() => setEditModalOpen(false)} />
  </Drawer>
)}
```

The recipe, then, is four moving parts: two boolean `useState` flags, a `Controller` over the
resolved-image field, a mirrored `imageId` scalar that is what actually gets submitted, and two
drawers. The same four parts recur in `goodieForm.tsx`, `userEditView.tsx`,
`libs/banner/editor/src/lib/banner-form.tsx`,
`libs/membership/editor/src/lib/memberplan/memberplan-form.tsx`, and every image-bearing block in
`libs/ui/editor/src/lib/blocks/`.

### 8.4 Blocks

`libs/ui/editor/src/lib/blocks/types.ts:72-85`:

```ts
export interface ImageBlockValue extends BaseBlockValue {
  image: FullImageFragment | null;
  caption: string;
  linkUrl?: string;
}
export interface GalleryImageEdge { image: FullImageFragment | null; caption: string }
export interface ImageGalleryBlockValue extends BaseBlockValue { images: GalleryImageEdge[] }
```

`imageGalleryBlock.tsx` is a one-at-a-time carousel editor: left/right arrows over
`value.images[index]`, each slot its own `ChooseEditImage` + caption `TypographicTextArea`, plus a
`GalleryListEditPanel` for reordering and adding/removing slots. **This is the only place in
We.Publish where several images are ordered**, and the order is just the array order inside the
revision's `blocks` JSON.

---

## 9. Rendering on websites

### 9.1 The `Image` component — `libs/image/website/src/lib/image.tsx`

```tsx
export const Image = forwardRef<HTMLImageElement, BuilderImageProps>(function Image({image, ...props}, ref) {
  const {maxWidth, square, fetchPriority, loading} = useImageProps(props);
  const images = square ? imageToSquareImageItems(image) : imageToImageItems(image);
  const objectPosition = square ? 'center center'
                                : `${image.focalPointX*100}% ${image.focalPointY*100}%`;
  // srcSet: drop anything wider than maxWidth, keep `${url} ${size}w`
  // sizes:  reversed, `(max-width: ${size*2}px) ${size}w`, last entry bare `${size}w`
  return <ImageWrapper {...props} ref={ref}
    alt={image.description ?? image.title ?? ''}
    title={image.title ?? ''}
    aspectRatio={image.width / image.height}
    objectPosition={objectPosition}
    srcSet={imageArray.join(',\n')}
    sizes={imageSizes.join(',\n')}
    loading={loading} fetchPriority={fetchPriority}
    width={square ? undefined : image.width}
    height={square ? undefined : image.height} />;
});
```

Key facts:

* **Eight candidates**, from the eight aliased `transformURL` fields: 2400, 1500, 1200, 1000, 800,
  500, 300, 200 (`:21-43`). `xxxl` is read defensively (`'xxxl' in image ? … : undefined`) because
  the peering fragment does not have it.
* **`sizes` is generated, not authored**: for each candidate except the largest,
  `(max-width: ${size * 2}px) ${size}w`; the largest contributes a bare `${size}w`. The doubling is
  a crude DPR-2 assumption. Note `sizes` is emitted with `…w` descriptors rather than CSS lengths,
  which is not what the HTML spec asks for — browsers fall back to the default `100vw`. Flagged,
  not fixed here.
* **`maxWidth` defaults to 1200** (`image.context.tsx:12-24`), so the 1500 and 2400 candidates are
  normally dropped. An `ImageContext` provider can override `square`, `maxWidth`, `loading` and
  `fetchPriority` for a subtree, and **context wins over props** (`mergeDeepRight(props, contextProps)`).
* Defaults: `loading: 'lazy'`, `fetchPriority: 'low'`.
* Styling (`:67-79`): `max-width: 100%`, `height: auto`, `aspect-ratio: auto <w/h>`,
  `max-height: 80lvh`, `object-fit: contain`, `object-position` as computed.
* **`alt` comes from `description`, falling back to `title`, falling back to `''`.** `title` is
  also set as the `title` attribute. There is no separate alt field.

Registered into the website builder as `elements.Image`
(`libs/website/src/lib/website.provider.tsx:86,282`); every consumer gets it through
`useWebsiteBuilder()`, so a tenant can substitute its own.

### 9.2 `ImageBlock` — `libs/block-content/website/src/lib/image/image-block.tsx`

A `<figure>` containing the image (optionally wrapped in a `Link` when `linkUrl` is set,
`target="_blank"`) and a `<figcaption>` rendered through the `image.caption` i18n key with
`{caption, source}` interpolation, where `source` falls back to the literal string `'EMPTY'`
(`:148-157`). `fetchPriority="high"` is forced on the image (`:65`). A `ResizeObserver` plus a
`load` listener measure the rendered width via `getContainedImageSize`
(`contained-image-size.ts`) and pin the caption to exactly the image's visible width — the block
can break out of its container with negative margins, so the available width is
`min(wrapperWidth, visibleWidth)` against `document.documentElement.clientWidth` (`:77-105`).

### 9.3 `ImageGalleryBlock` — `libs/block-content/website/src/lib/image-gallery/image-gallery-block.tsx`

A MUI `ImageList`, 1 / 2 / 3 columns at `xs` / `sm` / `md`, 8 px gap. Entries with no resolved
image are filtered out (`:43`). Each entry's caption is `image.caption ?? image.image?.title`,
with `image.image?.source` appended through the same `image.caption` i18n key. **No lightbox, no
ordering UI, no "main" marker.**

There is also an `ImageSlider` **block style**
(`libs/block-content/website/src/lib/block-styles/image-slider/`) registered as
`blockStyles.ImageSlider` (`website.provider.tsx:327`) — a presentation variant selectable per
block, not a separate block type.

---

## 10. Caching and dataloaders

| Mechanism | Code | Detail |
| --- | --- | --- |
| Per-request dataloader | `libs/image/api/src/lib/image-dataloader.service.ts` | `@Injectable({scope: Scope.REQUEST})`, named `ImageDataLoader`, batches `prisma.image.findMany({where:{id:{in}}})` behind `KvTtlCacheService.getOrLoadManyNs` |
| Shared cache namespace | `libs/kv-ttl-cache/api/src/lib/kv-ttl-cache-shared-namespaces.ts:35` | `content:images`, key prefix `id:` |
| Priming | `@PrimeDataLoader(ImageDataloaderService)` on `getImages`, `updateImage`, `createImage`, `getImagesByTag`, `uploadImage`, `replaceImage` | list queries seed the per-id loader |
| Invalidation | `image.service.ts:83`, `image-upload.service.ts:42,104-108` | `updateImage` → `invalidate('images')`; `uploadImage` → `invalidateDraft('images')`; delete/replace → `invalidate` unless `profileImage`, which uses `invalidateDraft` |
| HTTP caching | `apps/media/src/app/app.controller.ts:59-67` | 12 h `immutable`, 7 d `stale-if-error`, 1 d `stale-while-revalidate`, **production only** |
| Public GraphQL response cache | `GraphqlResponseCacheModule` imported by `ImageModule` (`image.module.ts:15`); `libs/kv-ttl-cache/api/src/lib/graphql-response-cache.plugin.ts:85-112,119-124` | `getImagesByTag` is in `CACHEABLE_QUERIES` and is versioned by `contentCacheNamespace('images')`, so any image write busts it. `images` / `image` are **not** cacheable (they are editor-only, permission-guarded queries). |

---

## 11. Importing BKa's 27 571 images

The BKa side is `bka-10-images-infra-misc.md` §1. Re-measured against the restored production DB
for this document:

| Owner | rows |
| --- | --- |
| `event_id` set | 27 107 |
| no owner at all (orphan) | 199 |
| `organization_id` set | 163 |
| `place_id` set | 102 |
| **total** | **27 571** |

Events: 19 505 have at least one image; **3 254 have more than one**, accounting for 10 856 images;
the maximum is **28** on one event. Legends: 11 821 rows have a non-null German legend, 14 a
French one; the longest German legend is **547 characters** (the admin form's own
`TEXT_MAX_LENGTH` is 125, and **493 rows exceed it**); 6 907 distinct German legend values; **3 576
of them match `/(foto|photo|bild|©|\(c\)|copyright)/i`**, i.e. roughly 30 % of the legends are
photo credits rather than captions.

### 11.1 Field mapping

| BKa `image` column | We.Publish `Image` column | Comment |
| --- | --- | --- |
| `id` (bigint) | — | no home. `Image.id` must be a fresh UUID (the object key is derived from it). Keep the old id in an import ledger, not in the row. |
| `file_name` (`<22 hex>.<ext>`) | `filename` + `extension` | split on the last `.`; `filename` conventionally carries no extension (`imageEditPanel.tsx:162`). But see §11.3 — `extension` is normally overwritten by sharp's detected format, so `.JPG` becomes `.jpeg`. |
| `labels['legend'][<lang>]` | `description` **or** `source` | one scalar column vs a per-language map; see §12 |
| `labels['alt'][<lang>]` | `description` | the same column the legend wants. **Zero rows in BKa production carry an `alt` key**, so this is a future conflict, not a present one. |
| `legend` (deprecated varchar) | — | 0 non-null rows in production; drop |
| `position` | — | **no home.** §12 |
| `created_at` / `updated_at` | `createdAt` / `modifiedAt` | `createdAt` has `@default(now())` but is settable; `modifiedAt` is `@updatedAt` and **cannot be set through Prisma's normal update path** — a raw SQL insert can set it. |
| `organization_id` / `place_id` / `event_id` | the owning entity's `imageId` FK | inverted: We.Publish puts the FK on the *owner*, and allows only one |
| — | `title` | nothing in BKa maps to it |
| — | `link`, `license`, `tags` | nothing in BKa maps to them |
| — | `focalPointX/Y` | nothing in BKa; default 0.5/0.5 |
| — | `width`, `height`, `fileSize`, `mimeType`, `format` | **BKa stores none of these.** They must be derived by reading each of the 27 571 objects. |
| — | `peerId` | leave null |

### 11.2 File naming and dedupe

* **File naming is a non-issue on the We.Publish side.** The object key is `images/<uuid>`; the
  original name survives only as DB text. BKa's mixed-case extensions (`JPG`, `PNG`, `JPEG`) and
  the one `.jfif` have no effect on storage.
* **All 27 571 BKa `file_name` values are distinct** (per `bka-10` §1.2), so a 1:1 import produces
  27 571 rows with no name collisions.
* **There is no dedupe mechanism of any kind.** No unique index on `filename`, no content hash
  column, no `ON CONFLICT` anywhere. `MediaService.generateETag` (`media.service.ts:83-87`) computes
  an MD5 of a buffer and is **called from nowhere** — dead code. If the import runs twice it
  creates 27 571 additional rows and 27 571 additional objects. Idempotency has to be built by the
  importer, e.g. an external ledger mapping BKa `image.id` → new UUID.

### 11.3 Can an `Image` point at a remote URL?

**No.** `Image.url` is a resolve-field computed as
`mediaAdapter.getImageURL(image)` (`image.resolver.ts:84-87`), which is unconditionally
`${MEDIA_SERVER_URL}/${image.id}?…`. There is no column holding a URL, and `link` is a
*metadata* field (the photographer's web statement; it is not rendered by any website component
found). The media server resolves `images/<id>` in its own bucket or serves the placeholder.

The only "remote" mechanisms that exist are:

1. `MEDIA_FALLBACK_URL` — forwards a *miss* to **another media server** with the identical signed
   path. Not usable to serve a foreign bucket, because the upstream must also recognise the
   signature and the id.
2. `ImageFetcherService` (`libs/image/api/src/lib/image-fetcher/image-fetcher.service.ts`) —
   `httpService.get(url, {responseType:'arraybuffer', timeout: 30_000})` returning
   `{filename, mimetype, arrayBuffer}`, intended to be piped into
   `MediaAdapter.uploadImageFromArrayBuffer`. This is a **copy-in**, not a reference.

So the 27 571 R2 objects must end up as 27 571 objects in `S3_UPLOAD_BUCKET` under
`images/<new-uuid>`.

### 11.4 Can a bulk import bypass the HTTP upload path?

**Partly, and there is precedent for every layer.**

| Precedent | What it bypasses | File |
| --- | --- | --- |
| `seedImages` | the **GraphQL mutation**: constructs `NovaMediaAdapter` directly, uploads over HTTP, then `prisma.image.create({data: {...photo, title, description}})` | `apps/api-example/prisma/seed.ts:89-231` |
| `KulturZueriService.createEvent` / `AgendaBaselService.createEvent` | same: `imageFetcher.fetch(url)` → `mediaAdapter.uploadImageFromArrayBuffer(file)` → `prisma.image.create({data: image})` → `prisma.event.create({data:{imageId}})` | `libs/event/import/api/src/lib/import/kultur-zueri.service.ts:74-83`, `agenda-basel.service.ts` (same lines) |
| `ImportPeerArticleService.importImage` | same, plus `source`, `license`, `peerId` | `libs/peering/api/import/src/lib/import-peer-article/import-peer-article.service.ts:429-452` |

So **writing the `images` row directly with Prisma is the established pattern**; nothing in the
schema or the services requires the row to have come from `uploadImage`.

Going one level further — writing the **S3 object** directly and skipping the media server's
`POST` — is possible but means re-implementing three things the media server does:

1. **The object key and content type.** `putObject(uploadBucket, 'images/<uuid>', buffer, size, {'Content-Type': 'image/<format>'})` (`media.service.ts:301-307`). Trivial.
2. **EXIF auto-rotation.** `saveImage` (`:287-309`) checks `metadata.orientation > 1 && !animated`,
   runs `sharp(image).rotate().withMetadata()` and, for JPEG, re-encodes at
   `{quality: 95, mozjpeg: true}`, then re-reads the metadata. Skipping this leaves sideways
   photos sideways, because the transform pipeline does **not** rotate on read.
3. **The metadata the row needs** — `width`, `height`, `fileSize`, `format`, `mimeType`,
   `extension` — all from `sharp(buffer).metadata()` *after* the possible rotation. BKa stores none
   of them, so every one of the 27 571 files must be read regardless.

Given that every file has to be opened anyway, the cheapest correct importer is:

* read the object from BKa's R2 (or a local `rclone`'d copy — `tools/sync-staging-images.sh` on the
  BKa side already does bucket-to-bucket copies),
* run the same sharp rotate/metadata step,
* `putObject` into `S3_UPLOAD_BUCKET` at `images/<new uuid>`,
* `prisma.image.create` (or a batched `createMany`) with the derived metadata + the mapped BKa
  metadata + explicit `id` and `createdAt`.

`modifiedAt` is `@updatedAt`; to preserve BKa's `updated_at` the importer must use raw SQL
(`$executeRaw` / `COPY`) rather than Prisma's `create`.

Using the HTTP path instead (`POST {media}/?imageId=<uuid>` with a self-minted 5-minute JWT, exactly
as `seed.ts` does) is also viable and keeps the rotation logic in one place; the cost is 27 571
round trips through multer/sharp/putObject with a 20 MB per-request cap and a 50 s client timeout.

**Derivatives need no pre-generation.** The transformation bucket is populated lazily on first
request, so the import does not have to produce any WebP.

### 11.5 Other constraints

| Constraint | Value | Source |
| --- | --- | --- |
| Accepted mime types | webp, png, gif, jpeg, jpg, avif, tiff | `supported-images-validator.ts:4-12` |
| Per-file upload cap (HTTP path) | 20 MB | `apps/media/src/app/app.module.ts:27-31` |
| Per-request timeout (API → media) | 50 s | `novaMediaAdapter.ts:105` |
| Source megapixels | no cap at upload; >20 MP sources are auto-downscaled *per derivative* | `transform.guard.ts:86-106` |
| Derivative size cap | 10 MB | `transform.guard.ts:142-147` |
| Media server heap | `--max-old-space-size=512`, `sharp.concurrency(2)` | `Dockerfile:300`, `bootstrap.ts:9-10` |
| `images` indexes | `createdAt`, `modifiedAt`, `title`, `tags` | `schema.prisma:292-295` |

27 571 rows is nothing for Postgres. The real cost is I/O: 27 571 object reads + sharp decodes +
27 571 writes.

---

## 12. BKa's position, "main image", legend and alt

BKa attaches **N ordered images** to an event/place/organization; the first (`position = 0`) is the
"main" one — `assets/controllers/image-collection_controller.js` puts an `is-main` class on row 0
and the UI says *"Ihr Hauptbild ist dasjenige, das hervorgehoben wird"*. We.Publish has nothing
equivalent at the entity level.

| BKa concept | Nearest We.Publish home | Verdict |
| --- | --- | --- |
| **"main image"** (`position = 0`) | the owning entity's single `imageId` FK — exactly how `Event.imageId`, `ArticleRevision.imageID`, `Author.imageID` already work | **Direct fit.** The main image becomes the entity's one image. |
| **ordered gallery** (`position > 0`, 3 254 events, up to 28 images) | an `ImageGalleryBlock` inside the revision's block content: `{type:'imageGallery', images:[{imageID, caption}, …]}` (`libs/block-content/api/src/lib/image/image-gallery-block.model.ts:13-30`) | **Fits, with a change of meaning.** Order becomes array order in the revision's `blocks` JSON, so it is versioned with the revision rather than being a property of the image. There is no `position` column anywhere and no relation-level ordering to fall back on. |
| **per-image caption/legend** | two candidates: the image's own `description`/`source` columns (global to the image, shared by every use) or the **block's** `caption` field (per placement, `ImageBlock.caption` / `ImageGalleryImage.caption`) | **Fits only one way at a time.** BKa's legend is a property of the `image` row, which is itself owned by exactly one entity, so "global to the image" and "per placement" coincide in the source data. Either target works; `caption` keeps the legend out of the alt text. |
| **alt text** (`labels['alt']`) | `Image.description` — the field the website uses as `alt` | **Collides with the legend.** `description` is a single column and the website reads it as `alt`. If the legend goes into `description`, the alt text has nowhere to go; if the alt text goes into `description`, the legend has to go to `caption` or `source`. **No home for both.** |
| **translations** (`labels` is `{field: {de: …, fr: …}}`) | — | **No home at all.** Not one image column is translatable. BKa is fr\|de; 2 798 rows carry an `fr` key though only 14 have a non-null French legend. Options are (a) drop French, (b) pick the locale at import time, (c) add per-locale columns or a JSON column to `Image`, (d) store the caption on a per-locale *block*. Nothing in the current model supports (c) or (d) today. |
| **photo credit inside the legend** (3 576 rows match a credit pattern) | `Image.source`, which the website already renders after the caption | **Fits**, but needs a heuristic split at import time, and the heuristic will be wrong sometimes. |
| **legends over 125 characters** (493 rows, max 547) | `description` / `source` are unbounded `TEXT` | **Fits.** No truncation needed, but the editor form has no length limit either, so nothing enforces BKa's old rule. |
| **199 orphan images** | — | They have no owner, and We.Publish cannot represent an un-owned image as anything other than a row nothing references. Importing them produces 199 rows no page can reach; dropping them loses nothing observable. A decision, not a technical constraint. |
| **`Video` (2 025 rows, free-text embed URL)** | `BlockContent` already has `YouTubeVideoBlock`, `VimeoVideoBlock`, `IFrameBlock`, `SoundCloudTrackBlock`, `TikTokVideoBlock` (`apps/api-example/schema-v2.graphql`) | Out of this document's scope, but note the 30 "other" hosts in BKa include a `.jpg`, a Google search and a Spotify link — none of which map to a typed block. |
| **`TechnicalSheet` (1 row, a PDF on a place)** | the `Document` model | §13 |

---

## 13. Documents, for completeness

`Document` (`schema.prisma:299-314`) is `Image`'s thinner sibling: `id`, `createdAt`,
`modifiedAt`, `filename`, `title`, `description`, `mimeType`, `fileSize`, `extension`. **It has no
relations at all** — nothing in the schema points at a document; references live only inside block
JSON or rich text. GraphQL exposes `documents(...)` (`schema-v2.graphql:4450`) and
`uploadDocument(file: Upload!, filename, title, description)` (`:3362`).

Storage differs from images in two ways: the object key keeps the **original filename**
(`documents/<id>/<originalname>`, `media.service.ts:343`) and the file is **copied** into the
transformation bucket on first read with a corrected `Content-Type` rather than being transformed
(`:354-405`). Thumbnails are first-page PDF renders via `pdftoppm -png -f 1 -l 1 -scale-to 600`
→ WebP, falling back to one of seven bundled SVG icons (`apps/media/src/assets/icon-*.svg`).
Sixteen mime types are accepted (`supported-documents-validator.ts:4-28`).

BKa's single `TechnicalSheet` row maps onto `Document` cleanly; its `labels['title']['de']` hits
the same translation wall as image legends.

---

## 14. Permissions

`libs/permissions/src/lib/permissions.ts:115-137`:

| Permission | id | Guards |
| --- | --- | --- |
| `CanCreateImage` | `CAN_CREATE_IMAGE` | `uploadImage`, **and `updateImage`** |
| `CanGetImage` | `CAN_GET_IMAGE` | `image(id)` |
| `CanGetImages` | `CAN_GET_IMAGES` | `images(...)` |
| `CanDeleteImage` | `CAN_DELETE_IMAGE` | `deleteImage` |

Role membership:

| Role array | Image permissions |
| --- | --- |
| `AllPermissions` (`:1193-…`) | all four |
| `EditorPermissions` (`:1376-…`) | `CanCreateImage`, `CanGetImage`, `CanGetImages` — **not** `CanDeleteImage` |
| `PeerPermissions` (`:1447-1451`) | none |

There is **no ownership model for images**: any holder of `CanGetImages` sees every image in the
instance, and any holder of `CanDeleteImage` can delete any of them. BKa's `ImageApiVoter`
(organisation/event ownership, `src/Security/Voters/ImageApiVoter.php`) has **no counterpart**.

The editor mirrors the permissions client-side with
`createCheckedPermissionComponent([...])` on `ImageSelectPanel` and `ImageEditPanel`, and
`PermissionControl`/`useAuthorisation(CanCreateImage.id)` around the save button and the upload
action.

`getImagesByTag` is `@Public()` — unauthenticated callers can enumerate every image carrying a
given tag, with all its metadata and URLs.

---

## 15. Gaps, oddities and UNVERIFIED items

1. **`.nxignore` excludes `libs/image/api`** (`.nxignore`, comment: *"Image requires peers which
   require Image / Without this, the build fails with maximum stack call"*). Its specs are
   therefore not picked up by `nx affected` and must be run by hand:
   `npx vitest run --config libs/image/api/vitest.config.ts` (`wp-08` §15).
2. **`ImageTransformation.width/height` are typed `string` but declared `Int`.** Harmless today
   because the only consumer does `parseInt`, but any new consumer will be misled.
3. **Six of the seven transformation options are dead** — `rotation`, `blur`, `negate`,
   `grayscale`, `sharpen` are commented out in `novaMediaAdapter.ts:224-250`; the media server
   still implements them (`media.service.ts:221-247`) and would honour them **if** something signed
   them. `flip` and `flop` exist in the DTO and the pipeline but in no GraphQL input at all.
4. **`ALLOWED_QUALITIES` / `EXTRA_ALLOWED_QUALITIES` are dead** — declared and appended to, never
   read (`image-transformation.limiter.ts:45-52`).
5. **`MediaService.generateETag` is dead** — no caller.
6. **`@Controller({version:'1'})` on the media app is inert** — versioning is never enabled.
7. **`.ai/development.md:130` documents a `MEDIA_SERVER_TOKEN` that no longer exists.** The
   handshake is JWKS + EdDSA JWT.
8. **Clearing a text field in `ImageEditPanel` does not clear the column** (§8.2). Code-level
   certainty; not executed.
9. **No orphan collection, no reference counting.** Deleting an image that a dozen blocks reference
   is allowed and silently blanks them.
10. **UNVERIFIED — runtime URL shape.** Every URL in §6.2 is derived by reading the code; neither
    the API nor the media server was started for this document (the We.Publish database is
    stopped). Settling it: boot `docker-compose up api media storage`, upload one image, and read
    the `url` / `transformURL` fields.
11. **UNVERIFIED — behaviour of `sizes` with `w` descriptors.** The generated `sizes` attribute uses
    `…w` instead of CSS lengths; browsers should ignore it and fall back to `100vw`, which would
    mean the srcset picks the widest allowed candidate on a wide viewport. Settling it: open a
    tenant page in Chrome and inspect `currentSrc` at a few viewport widths.
12. **UNVERIFIED — whether `@nestjs/storage` is intended to land before the BKa port.** The branch
    exists locally and is not merged. It changes no env var and no object key, so it is
    orthogonal to the import, but it does delete `StorageClient` from `libs/media/api`'s public
    surface.

---

## 16. Porting notes

*Implications, not observations.*

1. **The BKa image model is one-to-many; We.Publish's is many-to-one-owner.** The whole mapping
   turns on this inversion. BKa: `image.event_id` + `position`. We.Publish: `event.imageId`, one,
   plus a gallery block. The import therefore splits each event's image set into
   `position = 0 → EventRevision.imageID` and `position > 0 → one ImageGalleryBlock` appended to
   the revision's `blocks`. 16 251 events need only the first half; 3 254 need both.

2. **Putting the gallery in block content is what the brief already asks for**, and it is the only
   mechanism that exists. It does have a consequence worth stating out loud: the gallery becomes
   *revision-scoped*. Publishing a new revision carries a new copy of the gallery array; an image
   removed from the draft stays in the published revision until it is published over. That is how
   article images already behave, so it is consistent — but it is different from BKa, where the
   gallery is a property of the entity and changes immediately.

3. **Alt text versus legend is the one real modelling hole.** We.Publish has a single
   `description` column that the website renders as `alt`. BKa wants to carry both a legend
   (caption, often a credit) and an alt text, each per language. Three honest options:
   (a) legend → block `caption`, alt → `Image.description`, credits split out to `Image.source`,
   accept one language; (b) add translatable columns to `Image` — a schema change nothing else in
   the repo needs; (c) carry the per-language legend on the *block* (blocks are JSON, so a
   `{de, fr}` caption costs no migration) and keep `Image.description` for alt. (c) is the cheapest
   way to keep both languages and is the only one that does not touch the `images` table — but it
   needs a block-level convention that does not exist yet, and the website's `ImageBlock` would
   have to learn to pick a locale.

4. **"Main image" needs no new field.** The entity's existing single `imageId` *is* the main image,
   and the editor's `ChooseEditImage` already presents it as "the" image. No `isMain` boolean, no
   `position` column.

5. **Import should write rows directly and upload objects directly.** Three services in the repo
   already do exactly `mediaAdapter.upload… → prisma.image.create`, so there is no architectural
   objection. The only thing the HTTP path gives you that direct S3 writes do not is the
   EXIF-rotation step in `MediaService.saveImage`, which is twelve lines and must be replicated.
   Budget one full read + sharp decode per file for the metadata regardless, because BKa stores
   no dimensions.

6. **Keep an external id ledger.** There is no dedupe anywhere in We.Publish; re-running the
   import doubles everything. A `bka_image_id → wepublish_image_id` table (or a tag like
   `bka:<id>` on each imported image, since `tags` is indexed and filterable) makes the import
   resumable and the provenance queryable. The tag trick costs nothing and reuses an existing
   indexed column — though it also makes those tags visible in the editor's tag autocomplete and
   in the public `getImagesByTag` query.

7. **No remote-URL escape hatch.** Pointing `Image` rows at BKa's R2 bucket is not possible without
   inventing a new column and a new branch in `getImageURL`. Plan for a full object copy.

8. **The 199 orphans and the 102 place / 163 organization images need owners.** Places and
   organisations are being ported as first-class entities; whichever model they get needs its own
   `imageId` FK, or those 265 images land in block content too.

9. **Permissions are coarser than BKa's.** BKa's `ImageApiVoter` scoped image editing to the
   owning organisation; We.Publish has four instance-wide permissions and no ownership check. If
   the Agenda-Admin / organisation-user split of D3–D4 is to hold for images as well, that is new
   work in `libs/image/api`, not a configuration change. The cheapest first cut is to leave images
   global (any editor can reuse any image) and let the *event* permissions do the gating — which
   is also what the rest of We.Publish does for articles.

10. **The URL signature means no third party can construct an image URL.** Anything outside the
    API that needs an image URL (an export, a newsletter builder, a static site) has to ask the
    API for it, or hold `JWT_PRIVATE_KEY`. Worth knowing before promising BKa's `/api/v2` consumers
    a drop-in replacement for `url_webp_size_512_q_65` — and note that the current whitelist has
    no 512 or 1024 entry, so those two BKa presets would need `EXTRA_ALLOWED_DIMENSIONS` or an
    addition to `ALLOWED_DIMENSIONS`.

11. **BKa's `/img/{file}` legacy URLs cannot be preserved by this stack.** They are
    filename-addressed; We.Publish is uuid-addressed and has no filename index. Keeping them alive
    means a redirect table keyed on the old `file_name`, maintained outside the `images` table.
