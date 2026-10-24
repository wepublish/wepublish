# We.Publish — how a NestJS/GraphQL domain module is built

**Scope.** This document describes the house style for a domain API library in the We.Publish
monorepo (`/Users/itrulia/Documents/wepublish`, branch `master`, commit `360b36ccb`), so the new
events domain can be written to match it rather than invented. It documents three exemplary libs end
to end — `libs/article/api` (revisions, block content, scheduled publication; the closest existing
analogue to the new events), `libs/changelog/api` (the newest small CRUD lib, complete with resolver
and service specs), and `libs/audit-log/api` (recent, adds a global interceptor and a nightly cron) —
then the shared infrastructure they all lean on: `libs/nest-modules`, `libs/utils`,
`libs/authentication/api`, `libs/permissions/api`, `libs/errors`, `libs/api`, and the registration
point `apps/api-example/src/nestapp/app.module.ts`. It covers the pagination/filter/sort contract with
a full worked example from GraphQL args to Prisma, the dataloader and `@PrimeDataLoader` conventions,
what is actually used for input validation (zod — `class-validator` is not even installed), the error
conventions, the test conventions for `nest: true` Vitest projects, how `.graphql` documents become
typed documents for the editor and websites, and how scheduled/background work is written. Every
claim is grounded in a file path with line numbers. The We.Publish Postgres database was stopped
during this research, so nothing here rests on row counts. A short **Porting notes** section at the
end draws implications for the BKa port; everything before it describes what exists today.

---

## 1. The canonical file set

A domain API library lives at `libs/<domain>/api/` and is an Nx project named `<domain>-api`.
There are 50 `libs/*/api` directories; not all are NestJS domain modules (`libs/editor/api`,
`libs/website/api` and `libs/utils/api` are client/shared libraries). Across the ones that are,
the file set is:

| File | Required? | Contains |
| --- | --- | --- |
| `project.json` | yes | Nx project name `<domain>-api`, `sourceRoot`, `test` target pointing at the local `vitest.config.ts`, optionally a `build` target (`@nx/js:tsc`) |
| `vitest.config.ts` | yes | one call to `createVitestConfig({name, dir: __dirname, environment: 'node', react: false, nest: true})` |
| `tsconfig.json` / `tsconfig.lib.json` / `tsconfig.spec.json` | yes | project references; `tsconfig.spec.json` adds `types: ["vitest/globals","node"]` |
| `eslint.config.mjs` | yes | spreads the root `eslint.config.mjs`, three empty override blocks |
| `src/index.ts` | yes | the public barrel — every model, service, dataloader and the module |
| `src/lib/<domain>.module.ts` | yes | the `@Module` wiring: imports, providers, exports |
| `src/lib/<domain>.model.ts` | yes | `@ObjectType`, `@InputType`, `@ArgsType`, enums + `registerEnumType`, `PaginatedX` |
| `src/lib/<domain>.service.ts` | yes | `@Injectable`, Prisma access, the `create<Domain>Filter` / `create<Domain>Order` free functions |
| `src/lib/<domain>.resolver.ts` | yes | `@Resolver(() => X)` with `@Query`/`@Mutation`/`@ResolveField` |
| `src/lib/<domain>-dataloader.service.ts` | when the entity is referenced from elsewhere | the request-scoped by-id loader implementing `Primeable<T>` |
| `src/lib/<relation>.dataloader.ts` | per relation | a `DataLoaderService<T>` subclass for a one-to-many relation |
| `src/lib/has-<domain>/has-<domain>.model.ts` + `.resolver.ts` | when blocks/teasers point at the entity | the four `HasX` / `HasOptionalX` / `HasXLc` / `HasOptionalXLc` interface types and the single shared field resolver |
| `src/lib/<domain>-publication.watcher.ts` / `<domain>-schedule.watcher.ts` | when dates make content go live | `@Interval(60_000)` lookahead + `PublicationTimers` |
| `src/lib/*.spec.ts` | yes (TDD is mandatory) | colocated next to the file under test |
| `src/lib/__snapshots__/*.snap` | when specs use `toMatchSnapshot()` | committed Vitest snapshots |
| `README.md` | conventional | the Nx-generated stub; most still say "via Jest" and are wrong |
| `package.json` | only some | present on `consent/api`, `changelog/api`, `audit-log/api`; `changelog/api/package.json` contains only `{"prisma": {"schema": "../../api/prisma/schema.prisma"}}` |

Naming rules observed throughout:

- Nx project name: `<domain>-<layer>` → `article-api`, `changelog-api`, `audit-log-api`.
  This is the name passed to `nx test` / `nx lint` / `nx build`.
- TS path alias: `@wepublish/<domain>/api` → `libs/<domain>/api/src/index.ts`
  (`tsconfig.base.json:26,28,44,58`).
- Specs are `*.spec.ts`, never `*.test.ts`, and are colocated
  (`.claude/docs/testing.md`, "File conventions").
- `<entity>-dataloader.service.ts` is the primary by-id loader; `<relation>.dataloader.ts` is a
  secondary relation loader. 25 files match the first pattern, 31 the second.

---

## 2. Exemplar A — `libs/article/api`

The article lib is the template for anything with revisions, block content and scheduled
publication. 5 067 lines of TypeScript across 20 `.ts` files (11 source, 8 spec, 1 barrel).

### 2.1 Scaffolding

`libs/article/api/project.json`:

```json
{
  "name": "article-api",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/article/api/src",
  "projectType": "library",
  "tags": [],
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/libs/article/api",
        "tsConfig": "libs/article/api/tsconfig.lib.json",
        "main": "libs/article/api/src/index.ts",
        "rootDir": "."
      }
    },
    "test": {
      "options": { "config": "../../../{projectRoot}/vitest.config.ts" }
    }
  }
}
```

`libs/article/api/vitest.config.ts` — the whole file:

```ts
import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'article-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
```

`libs/article/api/tsconfig.lib.json` sets `target: "es2021"`, `declaration: true`,
`types: ["node"]`, and excludes `*.spec.ts`. `tsconfig.json` turns on `strict`,
`noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`,
`noFallthroughCasesInSwitch`.

### 2.2 The barrel — `src/index.ts`

```ts
export * from './lib/article.model';
export * from './lib/article.service';
export * from './lib/article-dataloader.service';
export * from './lib/article-revision-dataloader.service';
export * from './lib/article.module';

export * from './lib/has-article/has-article.model';
export * from './lib/has-article/has-article.resolver';

export * from './lib/hot-and-trending/hot-and-trending.resolver';
export * from './lib/hot-and-trending/hot-and-trending.module';
```

Note what is **not** exported: the resolvers (`article.resolver.ts`,
`article-revision.resolver.ts`) and the watcher. Only the module needs them, and the module is
exported. The `has-article` resolvers *are* exported, because other modules register them.

### 2.3 `article.module.ts` — the complete file

```ts
import { GraphqlResponseCacheModule } from '@wepublish/kv-ttl-cache/api';
import { ArticlePublicationWatcher } from './article-publication.watcher';
import { forwardRef, Module } from '@nestjs/common';
import { ImageModule } from '@wepublish/image/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { ArticleDataloaderService } from './article-dataloader.service';
import { ArticleResolver } from './article.resolver';
import { ArticleService } from './article.service';
import { ArticleRevisionDataloaderService } from './article-revision-dataloader.service';
import { ArticleRevisionResolver } from './article-revision.resolver';
import { AuthorModule } from '@wepublish/author/api';
import {
  HasArticleLcResolver,
  HasArticleResolver,
  HasOptionalArticleLcResolver,
  HasOptionalArticleResolver,
} from './has-article/has-article.resolver';
import { BlockContentModule } from '@wepublish/block-content/api';
import { SettingModule } from '@wepublish/settings/api';
import { TagModule } from '@wepublish/tag/api';

@Module({
  imports: [
    GraphqlResponseCacheModule,
    PrismaModule,
    ImageModule,
    AuthorModule,
    SettingModule,
    TagModule,
    forwardRef(() => BlockContentModule),
  ],
  providers: [
    ArticlePublicationWatcher,
    ArticleDataloaderService,
    ArticleRevisionDataloaderService,
    ArticleService,
    ArticleResolver,
    ArticleRevisionResolver,

    HasArticleResolver,
    HasArticleLcResolver,
    HasOptionalArticleResolver,
    HasOptionalArticleLcResolver,
  ],
  exports: [
    ArticleDataloaderService,
    ArticleRevisionDataloaderService,
    ArticleService,
  ],
})
export class ArticleModule {}
```

Points of convention:

- `BlockContentModule` is imported through `forwardRef(() => …)`. This is **mandatory** for any
  module that both uses block content and is used by block content — `libs/block-content/api` is in
  `.nxignore` precisely because of that cycle. `libs/page/api/src/lib/page.module.ts:26` does the same.
- Dataloaders and the service are exported; resolvers never are.
- `PrismaModule` is imported by every domain module even though the module graph is largely global,
  because `PrismaClient` is provided by it (see §10.2).

### 2.4 `article.model.ts` — the GraphQL surface

All 352 lines matter, but the shape is:

```ts
export enum ArticleSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  PublishedAt = 'PublishedAt',
}

registerEnumType(SortOrder, { name: 'SortOrder' });
registerEnumType(ArticleSort, { name: 'ArticleSort' });
```

(`article.model.ts:25-37`. `SortOrder` is also registered in
`libs/utils/api/src/lib/graphql/sort-order.ts:8`; registering twice with the same name is idempotent
in `@nestjs/graphql`.)

The revision object type declares its interfaces in the decorator and `implements` them in TS:

```ts
@ObjectType({
  implements: () => [HasBlockContent, HasOptionalUserLc],
})
export class ArticleRevision implements HasBlockContent, HasOptionalUserLc {
  blocks!: Array<typeof BlockContent>;

  // The user who created this revision. `userId` is populated from the DB row;
  // `user` is resolved by the global HasOptionalUserLc resolver.
  userId?: string;
  user?: User;

  @Field()
  id!: string;
  @Field()
  createdAt!: Date;

  @Field({ nullable: true })
  publishedAt?: Date;

  @Field({ nullable: true })
  archivedAt?: Date;
  …
}
```

(`article.model.ts:57-119`.) Fields inherited from an interface carry **no** `@Field` decorator —
the interface already declares them, and `inheritResolversFromInterfaces: true` in the GraphQL module
config (`apps/api-example/src/nestapp/app.module.ts:125`) makes the interface's resolver apply.

The aggregate type exposes the revision triple:

```ts
@ObjectType({
  implements: () => [HasOptionalPeerLc, HasOptionalPaywall],
})
export class Article implements HasOptionalPeerLc, HasOptionalPaywall {
  @Field() id!: string;
  @Field() createdAt!: Date;
  @Field() modifiedAt!: Date;
  @Field({ nullable: true }) slug?: string;
  @Field(() => Int) likes!: number;
  @Field() url!: string;
  @Field() previewUrl!: string;
  @Field({ nullable: true }) publishedAt?: Date;
  @Field() shared!: boolean;
  @Field() hidden!: boolean;
  @Field() disableComments!: boolean;

  @Field(() => ArticleRevision, { nullable: true }) draft?: ArticleRevision;
  @Field(() => ArticleRevision, { nullable: true }) pending?: ArticleRevision;
  @Field(() => ArticleRevision, { nullable: true }) published?: ArticleRevision;
  @Field(() => ArticleRevision) latest!: ArticleRevision;

  @Field(() => [Tag]) tags!: Tag[];
  @Field(() => [TrackingPixel]) trackingPixels!: TrackingPixel[];
  @Field({ nullable: true }) peerArticleId?: string;

  peerId?: string;
  peer?: Peer;
  paywall?: Paywall;
  paywallId?: string;
}
```

(`article.model.ts:121-184`, reformatted onto single lines for brevity; the file puts each
decorator on its own line.)

Pagination wrappers are one-liners:

```ts
@ObjectType()
export class PaginatedArticles extends PaginatedType(Article) {}

@ObjectType()
export class PaginatedArticleRevisions extends PaginatedType(ArticleRevision) {}
```

(`article.model.ts:186-190`.)

Mutation inputs reuse the object type through `OmitType(..., ArgsType)`:

```ts
@ArgsType()
export class CreateArticleInput extends OmitType(
  ArticleRevision,
  [
    'id', 'createdAt', 'publishedAt', 'archivedAt', 'userId', 'user',
    'image', 'socialMediaImage', 'authors', 'socialMediaAuthors',
    'blocks', 'properties',
  ] as const,
  ArgsType
) {
  @Field() shared!: boolean;
  @Field({ nullable: true }) paywallId?: string;
  @Field() hidden!: boolean;
  @Field() disableComments!: boolean;
  @Field({ nullable: true }) slug?: string;
  @Field(() => Int, { nullable: true }) likes?: number;

  @Field(() => [BlockContentInput]) blocks!: BlockContentInput[];
  @Field(() => [String]) tagIds!: string[];
  @Field(() => [ArticleRevisionAuthorInput]) authors!: ArticleRevisionAuthorInput[];
  @Field(() => [String]) socialMediaAuthorIds!: string[];
  @Field(() => [PropertyInput]) properties!: PropertyInput[];
}

@ArgsType()
export class UpdateArticleInput extends CreateArticleInput {
  @Field() id!: string;
}
```

(`article.model.ts:222-274`.) Two conventions here: **create inputs are `@ArgsType`, not
`@InputType`** (so the mutation takes flat arguments, not a single `input:` object), and **update =
create + `id`**. `libs/banner/api` is the counter-example — `CreateBannerInput` is an `@InputType`
(`banner.model.ts:85-96`) and the mutation takes `input: CreateBannerInput!`.

### 2.5 `article.resolver.ts` — the complete contract

```ts
@Resolver(() => Article)
export class ArticleResolver {
  constructor(
    private articleDataloader: ArticleDataloaderService,
    private articleRevisionsDataloader: ArticleRevisionDataloaderService,
    private articleService: ArticleService,
    private trackingPixelService: TrackingPixelService,
    private urlAdapter: URLAdapter,
    private settings: SettingDataloaderService,
    private trackingPixelDataloader: TrackingPixelDataloader,
    private tagDataLoader: ArticleTagDataloader
  ) {}
```

Queries and mutations, with their guards (`article.resolver.ts:57-231`):

| Operation | Guard | Service call |
| --- | --- | --- |
| `article(id, slug)` query | `@Public()` | `articleDataloader.load(id)` / `articleService.getArticleBySlug(slug)` |
| `articleRevisions(args)` query | `@Permissions(CanGetArticle)` | `getArticleRevisions(args)` |
| `articleRevision(id)` query | `@Permissions(CanGetArticle)` | `getRevisionById(id)` |
| `articles(args)` query | `@Public()` + `@PreviewMode()` param | `getArticles(args)` |
| `createArticle` mutation | `@Permissions(CanCreateArticle)` + `@CurrentUser()` | `createArticle(input, user?.user?.id)` |
| `updateArticle` | `@Permissions(CanCreateArticle)` + `@CurrentUser()` | `updateArticle(...)` |
| `duplicateArticle` | `@Permissions(CanCreateArticle)` + `@CurrentUser()` | `duplicateArticle(...)` |
| `deleteArticle` | `@Permissions(CanDeleteArticle)` | `deleteArticle(id)` → returns `.id` as `String` |
| `publishArticle(id, publishedAt)` | `@Permissions(CanPublishArticle)` | `publishArticle(id, publishedAt)` |
| `unpublishArticle(id)` | `@Permissions(CanPublishArticle)` | `unpublishArticle(id)` |
| `discardArticleDraft(id)` | `@Permissions(CanCreateArticle)` | `discardArticleDraft(id)` |
| `restoreArticleRevision(id, revisionId)` | `@Permissions(CanCreateArticle)` + `@CurrentUser()` | `restoreArticleRevision(...)` |
| `likeArticle` / `dislikeArticle` | `@Public()` | `likeArticle(id)` / `dislikeArticle(id)` |

Every query and mutation carries a `description` string, which becomes the SDL doc comment:

```ts
  @Public()
  @Query(() => PaginatedArticles, {
    description: `Returns a paginated list of articles based on the filters given.`,
  })
  public articles(
    @Args() args: ArticleListArgs,
    @PreviewMode() isPreview: boolean
  ) {
    if (!isPreview) {
      args.filter = {
        ...args.filter,
        draft: undefined,
        pending: undefined,
        published: true,
      };
    }

    return this.articleService.getArticles(args);
  }
```

(`article.resolver.ts:113-131`.) **This is the canonical preview gate**: a public list query forces
`published: true` unless the caller holds `CanPreview` *and* sends a `preview` header
(`libs/permissions/api/src/lib/preview-mode.decorator.ts:6-15`).

Field resolvers (`article.resolver.ts:233-298`) show the revision triple being served from one
dataloader round-trip, and the publication-state fallbacks:

```ts
  @ResolveField(() => ArticleRevision)
  async latest(@Parent() parent: PArticle, @PreviewMode() isPreview: boolean) {
    const { id: articleId } = parent;
    const { draft, pending, published } =
      await this.articleRevisionsDataloader.load(articleId);

    if (!isPreview) {
      if (published) {
        return published;
      }

      const showPending = !!(
        await this.settings.load(SettingName.SHOW_PENDING_WHEN_NOT_PUBLISHED)
      )?.value;

      return showPending && pending;
    }

    return draft ?? pending ?? published;
  }

  @Permissions(CanGetArticle)
  @ResolveField(() => ArticleRevision, { nullable: true })
  async draft(@Parent() parent: PArticle) {
    const { id: articleId } = parent;
    const { draft } = await this.articleRevisionsDataloader.load(articleId);

    return draft;
  }
```

`url` and `previewUrl` are **never** stored; they come from the injected `URLAdapter`:

```ts
  @ResolveField(() => String, { nullable: true })
  async url(@Parent() parent: PArticle) {
    return this.urlAdapter.getArticleUrl(parent);
  }

  @ResolveField(() => String, { nullable: true })
  async previewUrl(@Parent() parent: PArticle) {
    return this.urlAdapter.getArticlePreviewUrl(parent);
  }
```

`libs/nest-modules/src/lib/urls/url-adapter.ts:48-50` already has `getEventURL(event)` returning
`${baseURL}/event/${event.id}`.

A second resolver class handles the revision type (`article-revision.resolver.ts`), because a
`@Resolver(() => X)` class can only own one type:

```ts
@Resolver(() => ArticleRevision)
export class ArticleRevisionResolver {
  constructor(
    @Inject(forwardRef(() => SlotTeasersLoader))
    private slotTeasersLoader: SlotTeasersLoader,
    private authorDataLoader: ArticleAuthorDataloader,
    private socialMediaAuthorDataLoader: ArticleSocialMediaAuthorDataloader,
    private imageDataloaderService: ImageDataloaderService
  ) {}

  @ResolveField(() => [BlockContent])
  async blocks(@Parent() parent: ArticleRevision) {
    return await this.slotTeasersLoader.loadSlotTeasersIntoBlocks(parent.blocks);
  }

  @ResolveField(() => [Property])
  public async properties(
    @Parent() revision: ArticleRevision,
    @CurrentUser() user: UserSession | undefined
  ) {
    const properties = revision.properties;

    return properties?.filter(
      prop => prop.public || hasPermission(CanGetArticle, user?.roles ?? [])
    );
  }
```

(`article-revision.resolver.ts:16-43`.) Note the **imperative** permission check inside a field
resolver: `hasPermission(Permission, user.roles)` from `@wepublish/permissions/api`, used where a
guard would be too coarse.

### 2.6 `article.service.ts` — service conventions

1 286 lines. The shape:

- `@Injectable()` class, constructor-injected `PrismaClient` plus collaborators
  (`article.service.ts:45-53`):

```ts
@Injectable()
export class ArticleService {
  constructor(
    private prisma: PrismaClient,
    private trackingPixelService: TrackingPixelService,
    private publicContentCache: PublicContentCacheInvalidator,
    private kv: KvTtlCacheService,
    private publicationWatcher: ArticlePublicationWatcher
  ) {}
```

- Read methods that return an entity or a `{nodes,…}` page are decorated with
  `@PrimeDataLoader(ArticleDataloaderService)` (see §7.3).
- Public reads go through the KV cache namespace for the content type:

```ts
  @PrimeDataLoader(ArticleDataloaderService)
  async getArticleBySlug(slug: string) {
    return this.kv.getOrLoadNs(
      contentCacheNamespace('articles'),
      `slug:${slug.toLowerCase()}`,
      () => this.loadArticleBySlug(slug),
      CONTENT_CACHE_TTL_SECONDS
    );
  }
```

(`article.service.ts:55-74`.)

- Mutations end with a cache invalidation, chosen by whether the entity is live:

```ts
    if (article.publishedAt) {
      await this.publicContentCache.invalidate('articles');
      await this.publicContentCache.invalidateArticlePages(article, result);
    } else {
      await this.publicContentCache.invalidateDraft('articles');
    }
```

(`article.service.ts:296-301`.)

- Not-found and bad-input are plain Nest HTTP exceptions:

```ts
    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }
```

(`article.service.ts:238-240`; `BadRequestException` at `:700-704` and `:716-720`.)

- The filter and order builders are **exported free functions at the bottom of the service file**,
  not methods — which is what makes them unit-testable without the Nest container
  (`article.service.ts:817-1286`). See §6.

- Revision lifecycle, which the events port will mirror. Update archives the open draft and creates a
  new one in a single Prisma call:

```ts
    const result = await this.prisma.article.update({
      where: { id },
      data: {
        …
        revisions: {
          updateMany: {
            where: { archivedAt: null, publishedAt: null },
            data: { archivedAt: new Date() },
          },
          create: {
            ...revision,
            blocks: mappedBlocks as any[],
            userId,
            properties: properties as any,
            authors: { createMany: { data: mapArticleRevisionAuthors(authors) } },
            socialMediaAuthors: {
              createMany: { data: socialMediaAuthorIds.map(authorId => ({ authorId })) },
            },
          },
        },
```

(`article.service.ts:244-279`.)

Publishing (`article.service.ts:328-395`) unpublishes any future-dated revision, computes the
article-level `publishedAt`, stamps the newest revision, invalidates caches, and **registers the
timer** so the website cache clears at the moment the content goes live:

```ts
    // Unpublish existing pending revisions
    await this.prisma.articleRevision.updateMany({
      data: { publishedAt: null, archivedAt: new Date() },
      where: { articleId: id, publishedAt: { gte: new Date() } },
    });

    const articlePublishedAtInTheFuture =
      article.publishedAt && article.publishedAt > new Date();
    const newPublishedAtEarlier =
      article.publishedAt && article.publishedAt > publishedAt;

    const articlePublishedAt =
      articlePublishedAtInTheFuture || newPublishedAtEarlier ? publishedAt : (
        (article.publishedAt ?? publishedAt)
      );
    …
    await this.publicContentCache.invalidate('articles');
    await this.publicContentCache.invalidateArticlePages(article);
    this.publicationWatcher.schedule(publishedAt);
    this.publicationWatcher.schedule(articlePublishedAt);
```

Full-text search is raw SQL, wrapped in try/catch returning `[]`:

```ts
  async performFullTextSearch(searchQuery: string): Promise<string[]> {
    try {
      const foundArticleIds = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT DISTINCT a.id
        FROM articles a
          JOIN public."articles.revisions" ar
            ON a."id" = ar."articleId"
            AND ar."publishedAt" IS NOT NULL
            AND ar."publishedAt" < NOW()
        WHERE to_tsvector('german', coalesce(ar.title, '')) ||
              to_tsvector('german', coalesce(ar."preTitle", '')) ||
              to_tsvector('german', coalesce(ar.lead, '')) ||
              jsonb_to_tsvector(
                'german',
                jsonb_path_query_array(ar.blocks, 'strict $.**.richText'),
                '["string"]'
              ) @@ websearch_to_tsquery('german', ${searchQuery});
      `;

      return foundArticleIds.map(item => item.id);
    } catch (error) {
      console.error('Error performing full-text search:', error);
      return [];
    }
  }
```

(`article.service.ts:788-814`.)

### 2.7 Revision resolution is a database view, not a query

`libs/article/api/src/lib/article-revision-dataloader.service.ts:42-77` loads the triple with one
`findMany` and three `include`s against **Postgres views**:

```ts
  private async loadRevisions(articleIds: string[]): Promise<RevisionMap[]> {
    const articles = await this.prisma.article.findMany({
      relationLoadStrategy: 'join',
      where: { id: { in: articleIds } },
      include: {
        ArticleRevisionPublished: { include: { articleRevision: true } },
        ArticleRevisionDraft: { include: { articleRevision: true } },
        ArticleRevisionPending: { include: { articleRevision: true } },
      },
    });

    return articleIds.map((articleId): RevisionMap => {
      const rev = articles.find(rev => rev.id === articleId);
      const published = rev?.ArticleRevisionPublished?.articleRevision;
      const draft = rev?.ArticleRevisionDraft?.articleRevision;
      const pending = rev?.ArticleRevisionPending?.articleRevision;

      return { draft, pending, published };
    });
  }
```

The views are declared in Prisma as `view` blocks (`libs/api/prisma/schema.prisma:51-79`) and created
in SQL (`libs/api/prisma/migrations/20260817121431_add_timezones_to_dates/migration.sql:373-407`):

```sql
CREATE VIEW "articles.revisions.published" AS
    SELECT DISTINCT ON ("articleId") id, "articleId"
        FROM "articles.revisions"
        WHERE "publishedAt" IS NOT NULL AND "publishedAt" <= CURRENT_TIMESTAMP
    ORDER BY "articleId", "createdAt" DESC, id DESC;

CREATE VIEW "articles.revisions.pending" AS
    SELECT DISTINCT ON ("articleId") id, "articleId"
    FROM "articles.revisions"
    WHERE "publishedAt" IS NOT NULL AND "publishedAt" > CURRENT_TIMESTAMP
    ORDER BY "articleId", "createdAt" DESC, id DESC;

CREATE VIEW "articles.revisions.draft" AS
    SELECT DISTINCT ON ("articleId") id, "articleId"
    FROM "articles.revisions"
    WHERE "archivedAt" IS NULL AND "publishedAt" is NULL
    ORDER BY "articleId", "createdAt" DESC, id DESC;
```

Supporting index: `@@index([articleId, createdAt(sort: Desc), id(sort: Desc)])`
(`schema.prisma:47`).

### 2.8 The `has-<domain>` interface pattern

Four interface types and **one** field resolver reused by all four
(`libs/article/api/src/lib/has-article/has-article.model.ts`,
`…/has-article.resolver.ts`):

```ts
@InterfaceType()
export abstract class HasOptionalArticle {
  @Field({ nullable: true }) articleID?: string;
  @Field(() => Article, { nullable: true }) article?: Article;
}

@InterfaceType()
export abstract class HasArticle {
  @Field() articleID!: string;
  @Field(() => Article) article!: Article;
}

// New Style

@InterfaceType()
export abstract class HasArticleLc {
  @Field() articleId!: string;
  @Field(() => Article) article!: Article;
}

@InterfaceType()
export abstract class HasOptionalArticleLc {
  @Field({ nullable: true }) articleId?: string;
  @Field(() => Article, { nullable: true }) article?: Article;
}
```

```ts
@Resolver(() => HasArticle)
export class HasArticleResolver {
  constructor(private dataloader: ArticleDataloaderService) {}

  @ResolveField(() => Article, { nullable: true })
  public article(
    @Parent()
    block: HasOptionalArticle | HasArticle | HasOptionalArticleLc | HasArticleLc
  ) {
    const id =
      'articleId' in block ? block.articleId
      : 'articleID' in block ? block.articleID
      : null;

    if (!id) {
      return null;
    }

    return this.dataloader.load(id);
  }
}

@Resolver(() => HasArticleLc)
export class HasArticleLcResolver extends HasArticleResolver {}

@Resolver(() => HasOptionalArticle)
export class HasOptionalArticleResolver extends HasArticleResolver {}

@Resolver(() => HasOptionalArticleLc)
export class HasOptionalArticleLcResolver extends HasArticleResolver {}
```

`ID` vs `Id` is the old/new split; new code uses the `…Lc` ("lowercase") variants. The identical
pattern exists for events already (`libs/event/api/src/lib/has-event/has-event.model.ts:1-40`),
pages, images, users, peers, polls, paywalls, comments, crowdfundings and memberplans.

### 2.9 The publication watcher

`libs/article/api/src/lib/article-publication.watcher.ts`, complete:

```ts
import {
  Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import {
  PublicationTimers, PublicContentCacheInvalidator,
} from '@wepublish/kv-ttl-cache/api';

const LOOKAHEAD_MS = 70_000;
const LONGEST_SCHEDULE_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ArticlePublicationWatcher
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private logger = new Logger('ArticlePublicationWatcher');
  private timers = new PublicationTimers();
  private coveredUntil?: Date;

  constructor(
    private prisma: PrismaClient,
    private publicContentCache: PublicContentCacheInvalidator
  ) {}

  onApplicationBootstrap() { return this.scheduleUpcoming(); }
  onModuleDestroy() { this.timers.clear(); }

  schedule(publishedAt: Date) {
    const wait = publishedAt.getTime() - Date.now();

    if (wait <= 0 || wait > LONGEST_SCHEDULE_MS) {
      return;
    }

    this.timers.schedule([publishedAt], () => this.publish(publishedAt));
  }

  @Interval(60_000)
  async scheduleUpcoming() {
    const now = new Date();
    const until = new Date(now.getTime() + LOOKAHEAD_MS);
    const from =
      this.coveredUntil && this.coveredUntil < now ? this.coveredUntil : now;
    const where = { publishedAt: { gt: from, lte: until } };

    try {
      const upcoming = await Promise.all([
        this.prisma.article.findMany({ where, select: { publishedAt: true } }),
        this.prisma.articleRevision.findMany({ where, select: { publishedAt: true } }),
      ]);

      for (const { publishedAt } of upcoming.flat()) {
        if (publishedAt) {
          this.timers.schedule([publishedAt], () => this.publish(publishedAt));
        }
      }

      this.coveredUntil = until;
    } catch (error) {
      this.logger.error(
        `Could not look up scheduled articles: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async publish(publishedAt: Date) {
    const [articles, revisions] = await Promise.all([
      this.prisma.article.findMany({
        where: { publishedAt }, select: { id: true, slug: true },
      }),
      this.prisma.articleRevision.findMany({
        where: { publishedAt },
        select: { article: { select: { id: true, slug: true } } },
      }),
    ]);

    await this.publicContentCache.invalidate('articles');
    await this.publicContentCache.invalidateArticlePages(
      ...articles,
      ...revisions.map(({ article }) => article)
    );
  }
}
```

See §17 for the full background-work picture.

---

## 3. Exemplar B — `libs/changelog/api`

Added 2026-09-21 in `96f32c1216 feat(editor): add user-facing changelog system (#2960)`. It is the
cleanest small example: one module, three resolver/service pairs, paginated list, one mutation, and
full spec coverage. 4 060 lines including the markdown-sync tooling, of which the domain part is
~500.

### 3.1 Module

```ts
@Module({
  imports: [PrismaModule],
  providers: [
    ChangelogResolver, ChangelogService,
    NotificationConfirmationResolver, NotificationConfirmationService,
    NotificationReadResolver, NotificationReadService,
  ],
  exports: [
    ChangelogService, NotificationConfirmationService, NotificationReadService,
  ],
})
export class ChangelogModule {}
```

(`libs/changelog/api/src/lib/changelog.module.ts:10-26`.)

### 3.2 Model — a list without a cursor

```ts
@ObjectType()
export class PaginatedChangelogEntries extends PaginatedType(ChangelogEntry) {}

@ArgsType()
export class ChangelogEntryListArgs {
  @Field(() => Int, { defaultValue: 10, description: 'Number of items to fetch' })
  take?: number;

  @Field(() => Int, { defaultValue: 0, description: 'Number of items to skip' })
  skip?: number;

  @Field(() => ChangelogEntryFilter, {
    nullable: true,
    description: 'Filter for changelog entries',
  })
  filter?: ChangelogEntryFilter;

  @Field(() => String, {
    nullable: true,
    description:
      'Locale (de, en, fr) for localized title, lead and description; falls back to the default content',
  })
  locale?: string;
}
```

(`changelog-entry.model.ts:49-75`.) Compare with `ArticleListArgs` (§6.1): this one omits `cursorId`,
`sort` and `order` because the ordering is fixed. That is a legitimate reduction of the standard
`ArgsType`, not a different convention.

### 3.3 Resolver

```ts
@Resolver(() => ChangelogEntry)
export class ChangelogResolver {
  constructor(private changelogService: ChangelogService) {}

  @Authenticated()
  @Query(returns => PaginatedChangelogEntries, {
    name: 'changelogEntries',
    description:
      'Returns the changelog entries of this instance, newest first. Requires authentication.',
  })
  changelogEntries(@Args() args: ChangelogEntryListArgs) {
    return this.changelogService.getChangelogEntries(args);
  }

  // Signing an entry off speaks for the whole instance — the notice then
  // disappears for everyone, including the people who would have had to act.
  // That is an administrator's call, not every editor's.
  @Permissions(CanUpdateSettings)
  @Mutation(returns => ChangelogEntry, {
    name: 'confirmChangelogEntry',
    description:
      'Confirms that the manual action required by a changelog entry has been completed. Requires the permission to update settings.',
  })
  confirmChangelogEntry(
    @Args('id') id: string,
    @CurrentUser() session: UserSession,
    @Args('locale', { nullable: true }) locale?: string
  ) {
    return this.changelogService.confirmChangelogEntry(id, session.user.id, locale);
  }
}
```

(`changelog.resolver.ts:16-49`.) `name:` is passed explicitly when the method name and the GraphQL
field name would otherwise differ, or just for readability. `@Authenticated()` is the
"logged-in, any role" guard; `@Permissions(X)` is the permission guard.

### 3.4 Service — minimal paginated list

```ts
@Injectable()
export class ChangelogService {
  constructor(private prisma: PrismaClient) {}

  async getChangelogEntries({ filter, skip = 0, take = 10, locale }: ChangelogEntryListArgs) {
    const where = createChangelogEntryFilter(filter);
    const localeFilter = isLocale(locale) ? [locale] : [];

    const [totalCount, entries] = await Promise.all([
      this.prisma.changelogEntry.count({ where }),
      this.prisma.changelogEntry.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy: { releasedAt: 'desc' },
        include: { translations: { where: { locale: { in: localeFilter } } } },
      }),
    ]);

    const nodes = entries
      .slice(0, getMaxTake(take))
      .map(({ translations, ...entry }) => localizeEntry(entry, translations[0]));
    const firstEntry = nodes[0];
    const lastEntry = nodes[nodes.length - 1];

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage: Boolean(skip),
        hasNextPage: entries.length > nodes.length,
        startCursor: firstEntry?.id,
        endCursor: lastEntry?.id,
      },
    };
  }
```

(`changelog.service.ts:22-72`.) The filter builder is again a free function at the bottom of the
file:

```ts
function createChangelogEntryFilter(
  filter?: ChangelogEntryFilter
): Prisma.ChangelogEntryWhereInput {
  return {
    ...(filter?.actionRequired != null ? { actionRequired: filter.actionRequired } : {}),
    ...(filter?.confirmed != null
      ? { confirmedAt: filter.confirmed ? { not: null } : null }
      : {}),
  };
}
```

(`changelog.service.ts:136-147`.)

---

## 4. Exemplar C — `libs/audit-log/api`

Added 2026-09-28 in `cd280d5980 feat(core): Add audit logging (#3059)`. Shows three things the other
two do not: a globally registered `APP_INTERCEPTOR`, a `@Cron` retention job with distributed
claiming, and a "degrade gracefully" list query.

### 4.1 Module — registering a global interceptor from a domain lib

```ts
@Module({
  imports: [PrismaModule, ConfigModule, KvTtlCacheModule],
  providers: [
    AuditLogService,
    AuditLogResolver,
    AuditLogRetentionService,
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
  exports: [AuditLogService],
})
export class AuditLogModule {}
```

(`audit-log.module.ts:11-24`.)

### 4.2 The interceptor — every permission-guarded mutation is logged automatically

`audit-log.interceptor.ts:73-132`:

```ts
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType<GqlContextType>() !== 'graphql') {
      return next.handle();
    }

    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();

    if (info?.operation?.operation !== 'mutation') {
      return next.handle();
    }

    const options = this.reflector.getAllAndOverride<AuditLogOptions>(
      AUDIT_LOG_METADATA_KEY, [context.getHandler(), context.getClass()]
    );

    if (options?.skip) {
      return next.handle();
    }

    const permissions = this.reflector.getAllAndMerge<Permission[]>(
      PERMISSIONS_METADATA_KEY, [context.getHandler(), context.getClass()]
    );

    if (!permissions?.length) {
      return next.handle();
    }
    …
```

So: **a mutation is audited exactly when it carries `@Permissions(...)`**. A `@Public()` or
`@Authenticated()` mutation is not. The entity and action names are derived from the mutation name
by prefix (`derive-audit-entry.ts:3-57`) — `create*`/`add*`/`upload*`/`import*`/`duplicate*`/
`register*` → `create`; `delete*`/`remove*`/`discard*`/`revoke*` → `delete`;
`update*`/`publish*`/`unpublish*`/`restore*`/`approve*`/`reject*`/`confirm*`/`cancel*`/… → `update`;
anything else → `other`. The remainder of the name, capitalised, becomes the entity
(`publishEvent` → action `update`, entity `Event`). `@AuditLogged({entity, action, skip})`
(`audit-log.decorator.ts:12-13`) overrides any of that.

### 4.3 The "safe" list wrapper

```ts
  async getAuditLogsSafe(args: AuditLogListArgs) {
    try {
      return { ...(await this.getAuditLogs(args)), supported: true };
    } catch (error) {
      logger('audit-log').warn(`Could not read audit logs: ${(error as Error).message}`);

      return {
        nodes: [], totalCount: 0,
        pageInfo: {
          hasPreviousPage: false, hasNextPage: false,
          startCursor: undefined, endCursor: undefined,
        },
        supported: false,
      };
    }
  }
```

(`audit-log.service.ts:128-148`.) The extra `supported` flag is added by extending the paginated
type:

```ts
@ObjectType()
export class PaginatedAuditLogs extends PaginatedType(AuditLog) {
  @Field({
    description:
      'False when this installation does not provide an audit log, in which case nodes is empty and totalCount is zero.',
  })
  supported!: boolean;
}
```

(`audit-log.model.ts:60-67`.) This is the documented way to add fields to a `PaginatedX`.

### 4.4 Filter built imperatively

`createAuditLogFilter` (`audit-log.service.ts:8-71`) builds one `Prisma.AuditLogWhereInput` with a
sequence of `if` statements rather than the array-of-small-functions style of
`createArticleFilter`. Both styles exist; the article style is the one used wherever clauses have to
be combined with `AND`/`OR`.

---

## 5. Distilled content pattern per file

| File | Decorators / exports it owns | Must not contain |
| --- | --- | --- |
| `*.model.ts` | `@ObjectType`, `@InputType`, `@ArgsType`, `@InterfaceType`, `registerEnumType`, `PaginatedX extends PaginatedType(X)` | Prisma access, business logic |
| `*.resolver.ts` | `@Resolver(() => X)`, `@Query`, `@Mutation`, `@ResolveField`, `@Args`, `@Parent`, guards (`@Public`, `@Authenticated`, `@Permissions`), param decorators (`@CurrentUser`, `@PreviewMode`) | Prisma access — it injects the service or a dataloader; a resolver that touches `PrismaClient` is an outlier |
| `*.service.ts` | `@Injectable()`, `@PrimeDataLoader(...)`, Prisma queries, cache invalidation, `NotFoundException`/`BadRequestException`, exported `create<X>Filter` / `create<X>Order` free functions | GraphQL decorators |
| `*-dataloader.service.ts` | `@Injectable({scope: Scope.REQUEST})`, one private `new DataLoader(...)`, `prime`/`load`/`loadMany` passthroughs, `implements Primeable<T>` | anything else |
| `*.dataloader.ts` | `@Injectable({scope: Scope.REQUEST})`, `extends DataLoaderService<T>`, one `protected loadByKeys` | anything else |
| `*.module.ts` | `@Module({imports, providers, exports})` | logic |
| `*.watcher.ts` | `@Injectable()`, `@Interval`, `OnApplicationBootstrap`, `OnModuleDestroy`, a `PublicationTimers` | GraphQL |

Code-style rules that apply (from `.claude/docs/code-style.md` and visible everywhere): **no code
comments, not even JSDoc** for routine code — the files above use block comments only where they
explain a non-obvious decision (e.g. `article.service.ts:534-539`, `changelog.resolver.ts:30-32`).

---

## 6. Pagination, filtering and sorting

### 6.1 The `@ArgsType` shape

The canonical list args, verbatim from `libs/article/api/src/lib/article.model.ts:327-352`:

```ts
@ArgsType()
export class ArticleListArgs {
  @Field(() => ArticleFilter, { nullable: true })
  filter?: ArticleFilter;

  @Field(() => ArticleSort, {
    nullable: true,
    defaultValue: ArticleSort.PublishedAt,
  })
  sort?: ArticleSort;

  @Field(() => SortOrder, {
    nullable: true,
    defaultValue: SortOrder.Descending,
  })
  order?: SortOrder;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  take?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  skip?: number;

  @Field({ nullable: true })
  cursorId?: string;
}
```

Five slots, always the same names: `filter`, `sort`, `order`, `take`, `skip`, `cursorId`. The
generated SDL is

```graphql
articles(cursorId: String, filter: ArticleFilter, order: SortOrder = Descending, skip: Int = 0, sort: ArticleSort = PublishedAt, take: Int = 10): PaginatedArticles!
```

(`apps/api-example/schema-v2.graphql:4290`; `sortSchema: true` alphabetises the arguments.)

Variants in the wild:

| Lib | Difference |
| --- | --- |
| `changelog/api` | no `cursorId`, no `sort`, no `order` (fixed `releasedAt desc`) — `changelog-entry.model.ts:52-75` |
| `audit-log/api` | `defaultValue` instead of `nullable` for `take`/`skip`/`sort`; `order` has both — `audit-log.model.ts:124-156` |
| `article/api` revisions | `ArticleRevisionListArgs` adds a required `articleId` and drops `sort` — `article.model.ts:198-220` |
| `banner/api` | a separate `PaginationArgs` with **required** `skip`/`take` and no filter at all — `libs/banner/api/src/lib/pagination.model.ts:3-10` |

### 6.2 The connection type

`libs/utils/api/src/lib/graphql/paginated-type.ts`, complete:

```ts
import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PageInfo {
  @Field() hasPreviousPage!: boolean;
  @Field() hasNextPage!: boolean;
  @Field({ nullable: true }) startCursor?: string;
  @Field({ nullable: true }) endCursor?: string;
}

export interface PaginatedObjectType<T> {
  nodes: T[];
  totalCount: number;
  pageInfo: PageInfo;
}

export function PaginatedType<T>(classRef: Type<T>): Type<PaginatedObjectType<T>> {
  @ObjectType()
  class PaginatedObjectTypeImpl implements PaginatedObjectType<T> {
    @Field(type => [classRef])
    nodes!: T[];

    @Field(() => Int)
    totalCount!: number;

    @Field(type => PageInfo)
    pageInfo!: PageInfo;
  }

  return PaginatedObjectTypeImpl;
}
```

This is **not** Relay: no edges, no `node`/`cursor` wrapper. `nodes` is a flat array; the cursors are
the first and last entity ids.

Generated SDL (`apps/api-example/schema-v2.graphql:3485-3490, 3566-3570`):

```graphql
type PageInfo {
  endCursor: String
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
}

type PaginatedArticles {
  nodes: [Article!]!
  pageInfo: PageInfo!
  totalCount: Int!
}
```

### 6.3 Helper functions

| Helper | File | Behaviour |
| --- | --- | --- |
| `getMaxTake(take)` | `libs/utils/api/src/lib/graphql/max-limit.ts:1-3` | `Math.min(take, 100)` — a hard cap of 100 rows per page |
| `graphQLSortOrderToPrisma(order)` | `libs/utils/api/src/lib/graphql/sort-order.ts:10-11` | `Ascending → 'asc'`, otherwise `'desc'` |
| `SortOrder` enum | same file, `:3-8` | `Ascending` / `Descending`, registered as GraphQL enum `SortOrder` |
| `DateFilter` input + `DateFilterComparison` | `libs/utils/api/src/lib/graphql/date-comparison.ts:4-22` | `{date?: Date, comparison: DateFilterComparison}`; comparisons `GreaterThan`, `GreaterThanOrEqual`, `Equal`, `LowerThan`, `LowerThanOrEqual` |
| `mapDateFilterToPrisma(comparison)` | same file, `:24-50` | maps to `gt` / `gte` / `equals` / `lt` / `lte` |
| `GraphQLSlug` scalar | `libs/utils/api/src/lib/graphql/slug.ts:4-27` | parses by `slugify()`ing the input |
| `ColorScalar` | `libs/utils/api/src/lib/graphql/color.scalar.ts:22-39` | validates `#RRGGBB` |
| `PaginatedType`, `PageInfo` | `…/paginated-type.ts` | above |

### 6.4 Worked example — `articles(...)` from GraphQL args to SQL

**Step 1 — the request.** The editor sends (`libs/editor/api/src/lib/schemas/article.graphql`, the
`ArticleList` query):

```graphql
query ArticleList($filter: ArticleFilter, $cursor: String, $take: Int, $skip: Int, $order: SortOrder, $sort: ArticleSort) {
  articles(filter: $filter, cursorId: $cursor, take: $take, skip: $skip, order: $order, sort: $sort) {
    nodes { ...ArticleWithoutBlocks }
    pageInfo { startCursor endCursor hasNextPage hasPreviousPage }
    totalCount
  }
}
```

**Step 2 — guards.** `OptionalAuthenticationGuard` (global `APP_GUARD`) attaches `req.user` if a
bearer token resolves to a session; `OneOfGuard` (the second global `APP_GUARD`) then evaluates the
guards collected by `@Public()`, and `PublicGuard` returns `true`.

**Step 3 — resolver.** `ArticleResolver.articles` binds `@Args() args: ArticleListArgs` (Nest
instantiates the `@ArgsType` class, applying the `defaultValue`s) and `@PreviewMode() isPreview`.
Without preview, the filter is rewritten to `{..., draft: undefined, pending: undefined, published:
true}` (`article.resolver.ts:117-131`).

**Step 4 — service, caching.** `ArticleService.getArticles` caches the *whole page object* under a
JSON key unless a full-text `body` filter is present (`article.service.ts:76-88`):

```ts
  @PrimeDataLoader(ArticleDataloaderService)
  async getArticles(args: ArticleListArgs) {
    if (args.filter?.body) {
      return this.loadArticles(args);
    }

    return this.kv.getOrLoadNs(
      contentCacheNamespace('articles'),
      `list:${JSON.stringify(args)}`,
      () => this.loadArticles(args),
      CONTENT_CACHE_TTL_SECONDS
    );
  }
```

**Step 5 — the query.** `loadArticles` (`article.service.ts:90-139`):

```ts
  private async loadArticles({
    filter, cursorId,
    sort = ArticleSort.PublishedAt,
    order = SortOrder.Descending,
    take = 10, skip,
  }: ArticleListArgs) {
    if (filter?.body) {
      const articleIds = await this.performFullTextSearch(filter.body);

      if (articleIds.length && !filter.ids?.length) {
        filter.ids = articleIds;
      }
    }

    const orderBy = createArticleOrder(sort, order);
    const where = createArticleFilter(filter ?? {});

    const [totalCount, articles] = await Promise.all([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = articles.slice(0, getMaxTake(take));
    const firstArticle = nodes[0];
    const lastArticle = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = articles.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstArticle?.id,
        endCursor: lastArticle?.id,
      },
    };
  }
```

The four invariants of every list method in the repo:

1. `count` and `findMany` run **in parallel** via `Promise.all`.
2. `take: getMaxTake(take) + 1` — one extra row is fetched purely to compute `hasNextPage`.
3. `nodes = rows.slice(0, getMaxTake(take))`; `hasNextPage = rows.length > nodes.length`.
4. `hasPreviousPage = Boolean(skip)`. (Cursor-only paging therefore always reports
   `hasPreviousPage: false`; nothing in the repo compensates for that.)

**Step 6 — ordering.** `createArticleOrder` (`article.service.ts:817-837`) is an exhaustive switch
returning a Prisma `orderBy`:

```ts
export const createArticleOrder = (
  field: ArticleSort,
  sortOrder: SortOrder
): Prisma.ArticleFindManyArgs['orderBy'] => {
  switch (field) {
    case ArticleSort.CreatedAt:
      return { createdAt: graphQLSortOrderToPrisma(sortOrder) };
    case ArticleSort.ModifiedAt:
      return { modifiedAt: graphQLSortOrderToPrisma(sortOrder) };
    case ArticleSort.PublishedAt:
      return { publishedAt: graphQLSortOrderToPrisma(sortOrder) };
  }
};
```

**Step 7 — filtering.** One small pure function per filter field, each returning `{}` when the field
is absent, combined at the bottom (`article.service.ts:1251-1286`):

```ts
const isEmptyWhere = (where: Prisma.ArticleWhereInput) =>
  Object.keys(where).length === 0;

export const createArticleFilter = (
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  const andClauses = [
    createIdsFilter(filter),
    createTitleFilter(filter),
    createPreTitleFilter(filter),
    createPublicationDateFromFilter(filter),
    createPublicationDateToFilter(filter),
    createLeadFilter(filter),
    createSharedFilter(filter),
    createTagsFilter(filter),
    createAllTagsInFilter(filter),
    createTagsNotInFilter(filter),
    createAuthorFilter(filter),
    createHiddenFilter(filter),
    createExcludeHideAuthorFilter(filter),
    createPeerIdFilter(filter),
    createExcludeIdsFilter(filter),
  ].filter(c => !isEmptyWhere(c));

  const orClauses = [
    createPublishedFilter(filter),
    createDraftFilter(filter),
    createPendingFilter(filter),
  ].filter(c => !isEmptyWhere(c));

  if (orClauses.length > 0) {
    andClauses.push({ OR: orClauses });
  }

  return andClauses.length > 0 ? { AND: andClauses } : {};
};
```

The three publication-state filters are **OR**-combined (an article matching *any* requested state
is returned), everything else is AND. Representative individual builders:

```ts
const createPublishedFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.published != null) {
    return {
      publishedAt:
        filter.published ? { lte: new Date() } : { not: { lte: new Date() } },
    };
  }

  return {};
};

const createDraftFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.draft != null) {
    return {
      revisions: {
        some: { publishedAt: filter.draft ? null : { not: null }, archivedAt: null },
      },
    };
  }

  return {};
};

const createPendingFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.pending != null) {
    return {
      revisions: {
        some: {
          publishedAt: filter.pending ? { gt: new Date() } : { not: { gt: new Date() } },
        },
      },
    };
  }

  return {};
};
```

(`article.service.ts:1012-1057`.)

Filters that target a *revision* field route through the revision views when a state is requested,
and fall back to `revisions: { some: … }` when no state is requested
(`article.service.ts:853-892`, the `title` filter; `preTitle`, `lead`, `authors` and
`excludeHideAuthor` repeat the pattern verbatim):

```ts
const createTitleFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.title) {
    const titleFilter: Prisma.ArticleRevisionWhereInput = {
      title: { contains: filter.title, mode: 'insensitive' },
    };

    return {
      ArticleRevisionPublished:
        filter?.published ? { articleRevision: titleFilter } : undefined,
      ArticleRevisionDraft:
        filter?.draft ? { articleRevision: titleFilter } : undefined,
      ArticleRevisionPending:
        filter?.pending ? { articleRevision: titleFilter } : undefined,
      revisions:
        !filter?.draft && !filter?.published && !filter?.pending ?
          { some: titleFilter }
        : undefined,
    };
  }
  return {};
};
```

Tag filters, three distinct semantics (`article.service.ts:1071-1127`):

| Filter field | Prisma clause | Meaning |
| --- | --- | --- |
| `tags: [String!]` | `tags: { some: { tagId: { in: … } } }` | any of |
| `allTagsIn: [String!]` | `AND: tagIds.map(tagId => ({ tags: { some: { tagId } } }))` | all of |
| `tagsNotIn: [String!]` | `tags: { none: { tagId: { in: … } } }` | none of |

Date filters use the shared `DateFilter` input (`article.service.ts:978-1010`):

```ts
const createPublicationDateFromFilter = (
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.publicationDateFrom) {
    const { comparison, date } = filter.publicationDateFrom;
    const compare = mapDateFilterToPrisma(comparison);

    return { publishedAt: { [compare]: date } };
  }

  return {};
};
```

Text search is `contains` + `mode: 'insensitive'` throughout — see also
`libs/event/api/src/lib/event.service.ts:312-348` and `libs/audit-log/api/src/lib/audit-log.service.ts:13-45`.

### 6.5 Filters that span two date columns

The current events lib shows the idiom for a range entity with `startsAt`/`endsAt`
(`libs/event/api/src/lib/event.service.ts:243-310`):

```ts
const createUpcomingOnlyFilter = (filter?: Partial<EventFilter>): Prisma.EventWhereInput => {
  if (filter?.upcomingOnly) {
    return {
      OR: [{ startsAt: { gte: new Date() } }, { endsAt: { gte: new Date() } }],
    };
  }

  return {};
};

const createFromFilter = (filter?: Partial<EventFilter>): Prisma.EventWhereInput => {
  if (filter?.from) {
    return { OR: [{ startsAt: { gte: filter.from } }, { endsAt: { gte: filter.from } }] };
  }

  return {};
};
```

and combines them unconditionally (`event.service.ts:350-361`):

```ts
const createEventFilter = (filter?: Partial<EventFilter>): Prisma.EventWhereInput => ({
  AND: [
    createUpcomingOnlyFilter(filter),
    createFromFilter(filter),
    createToFilter(filter),
    createTagFilter(filter),
    createNameFilter(filter),
    createLocationFilter(filter),
  ],
});
```

(Unlike `createArticleFilter`, this one does not strip the empty `{}` clauses — Prisma tolerates
them, but the article version is the better model.)

---

## 7. Dataloaders

### 7.1 Two shapes

**Shape A — the primary by-id loader, `<entity>-dataloader.service.ts`.** Hand-rolled
`new DataLoader(...)`, request-scoped, implements `Primeable<T>` so `@PrimeDataLoader` can push rows
into it. Complete file, `libs/article/api/src/lib/article-dataloader.service.ts`:

```ts
import {
  CONTENT_CACHE_TTL_SECONDS, KvTtlCacheService, contentCacheNamespace,
} from '@wepublish/kv-ttl-cache/api';
import { Injectable, Scope } from '@nestjs/common';
import { Article, PrismaClient } from '@prisma/client';
import { Primeable, createOptionalsArray } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

@Injectable({
  scope: Scope.REQUEST,
})
export class ArticleDataloaderService implements Primeable<Article> {
  private dataloader = new DataLoader<string, Article | null>(
    async (ids: readonly string[]) =>
      this.kv.getOrLoadManyNs(
        contentCacheNamespace('articles'),
        ids as string[],
        async missing =>
          createOptionalsArray(
            missing,
            await this.prisma.article.findMany({ where: { id: { in: missing } } }),
            'id'
          ),
        CONTENT_CACHE_TTL_SECONDS,
        'id:'
      ),
    { name: 'ArticleDataLoader' }
  );

  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  public prime(...parameters: Parameters<DataLoader<string, Article | null>['prime']>) {
    return this.dataloader.prime(...parameters);
  }

  public load(...parameters: Parameters<DataLoader<string, Article | null>['load']>) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(...parameters: Parameters<DataLoader<string, Article | null>['loadMany']>) {
    return this.dataloader.loadMany(...parameters);
  }
}
```

Three details that are easy to get wrong:

- `scope: Scope.REQUEST` — a dataloader must not outlive a request, otherwise it becomes a
  process-wide stale cache.
- `createOptionalsArray(keys, rows, 'id')` restores the DataLoader contract (one result per key, in
  key order, `null` for misses):

```ts
export const createOptionalsArray = <Data, Attribute extends keyof Data, Key extends Data[Attribute]>(
  keys: Key[],
  data: Data[],
  attribute: Attribute
): Array<Data | null> => {
  const dataMap = Object.fromEntries(data.map(entry => [entry[attribute], entry]));

  return keys.map(id => dataMap[id] ?? null);
};
```

(`libs/utils/api/src/lib/dataloader/create-optionals-array.ts:4-18`.)
- The loader body is wrapped in `kv.getOrLoadManyNs(namespace, keys, loadMissing, ttl, keyPrefix)`,
  so a second request on another replica hits Dragonfly rather than Postgres. The key prefix (`'id:'`,
  `'revisions:'`, `'tags:'`) namespaces different loaders inside one content namespace.

**Shape B — relation loaders, `<relation>.dataloader.ts`.** Subclass the abstract base and implement
one method. Complete file, `libs/tag/api/src/lib/event-tag.dataloader.ts`:

```ts
import { DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient, Tag } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class EventTagDataloader extends DataLoaderService<Tag[]> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(eventIds: string[]) {
    const tags = groupBy(
      tag => tag.eventId!,
      await this.prisma.taggedEvents.findMany({
        where: { eventId: { in: eventIds } },
        include: { tag: true },
      })
    );

    return eventIds.map(eventId => tags[eventId]?.map(tag => tag.tag) ?? []);
  }
}
```

The base class (`libs/utils/api/src/lib/dataloader/dataloader.service.ts`):

```ts
@Injectable({
  scope: Scope.REQUEST,
})
export abstract class DataLoaderService<Type> implements Primeable<Type> {
  protected abstract loadByKeys(keys: string[]): Promise<(Type | null)[]>;

  public readonly dataloader = new DataLoader<string, Type | null>(
    async (keys: readonly string[]) => this.loadByKeys(keys as string[]),
    { name: this.constructor.name }
  );

  public prime(...parameters: Parameters<DataLoader<string, Type | null>['prime']>) {
    return this.dataloader.prime(...parameters);
  }
  public load(...parameters: Parameters<DataLoader<string, Type | null>['load']>) {
    return this.dataloader.load(...parameters);
  }
  public loadMany(...parameters: Parameters<DataLoader<string, Type | null>['loadMany']>) {
    return this.dataloader.loadMany(...parameters);
  }
}
```

A cached variant of shape B exists (`libs/tag/api/src/lib/article-tag.dataloader.ts:22-30`): override
`loadByKeys` to call `kv.getOrLoadManyNs(...)` and put the Prisma query in a private
`loadFromDatabase`.

### 7.2 Inventory

25 primary loaders (`*-dataloader.service.ts`):

`article`, `article-revision`, `author`, `block-styles`, `block-template`, `comment`,
`crowdfunding`, `event`, `external-apps`, `image`, `navigation`, `page`, `page-revision`, `paywall`,
`peer`, `poll`, `setting`, plus seven `settings/api/integrations/*-settings-dataloader.service.ts`,
and `user`.

31 relation loaders (`*.dataloader.ts`), among them
`article-author`, `article-social-media-author`, `author-links`, `crowdfunding-goal`,
`crowdfunding-memberplan`, `member-plan`, `discount-code-usage`, `discountCode`, `goodie`,
`invoice-items`, `invoice`, `used-mail-template`, `subscription-deactivation`,
`subscription-periods`, `subscription`, `navigation-links`, `payment-method`, `payment-provider`,
`payment`, `paywall-member-plans`, `remote-peer-profile`, `article-tag`, `author-tag`,
`comment-tag`, **`event-tag`**, `page-tag`, `tag`, `tracking-pixel`, `user-role`,
`user-subscription-count`, `user-subscription-overview`.

Both kinds are declared in `providers` **and** `exports` of their module
(`libs/tag/api/src/lib/tag.module.ts:13-33`), because other domains inject them directly.

### 7.3 `@PrimeDataLoader`

`libs/utils/api/src/lib/dataloader/prime-dataloaders.decorator.ts`, complete:

```ts
import { Type } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import DataLoader from 'dataloader';

export interface Primeable<T> {
  prime: DataLoader<string, T | null>['prime'];
  load: DataLoader<string, T | null>['load'];
  loadMany: DataLoader<string, T | null>['loadMany'];
}

export function PrimeDataLoader<T extends Primeable<unknown>>(
  dataloader: Type<T>,
  primeKey = 'id'
) {
  const decoratorFactory = (
    target: object,
    propertyKey: unknown,
    descriptor: PropertyDescriptor
  ) => {
    const origin = descriptor.value;
    const injectProperty = `__DATALOADER__${dataloader.name}`;
    const injectDataloader = Inject(dataloader);
    injectDataloader(target, injectProperty);

    descriptor.value = async function (...args: unknown[]) {
      const resultItem = await origin.apply(this, args);

      if (!resultItem) {
        return resultItem;
      }

      const results =
        Array.isArray(resultItem) ? resultItem.flat()
        : Array.isArray(resultItem.nodes) ? resultItem.nodes
        : [resultItem];

      for (const result of results) {
        if (primeKey in result) {
          const that = this as any;
          const loader = that[injectProperty] as T;
          loader.prime(result[primeKey], result);
        }
      }

      return resultItem;
    };
  };

  decoratorFactory.KEY = `PrimeDataLoader_${dataloader.name}`;

  return decoratorFactory;
}
```

What it does, precisely:

- Declares a hidden property injection `__DATALOADER__<LoaderClassName>` on the decorated class, so
  the loader is resolved by Nest without appearing in the constructor.
- Wraps the method; after it resolves, it pushes every returned row into the loader's cache keyed by
  `primeKey` (default `'id'`).
- Understands three return shapes: a single object, an array (flattened one level), and a paginated
  `{nodes: [...]}` object. Anything else, and anything falsy, is left alone.
- Rows lacking the key are skipped.

Usage: 143 occurrences across `libs`. `@PrimeDataLoader(SettingDataloaderService, 'name')` in
`libs/settings/api/src/lib/settings.service.ts` is the only place the second argument is used.

The decorator's own spec is the cleanest documentation of the contract
(`libs/utils/api/src/lib/dataloader/prime-dataloaders.decorator.spec.ts`):

```ts
class MockDataloader {
  prime = vi.fn();
}

it('should prime a paginated result', async () => {
  const mock = new MockDataloader();
  const decoratorFactory = PrimeDataLoader(MockDataloader as any);
  const container = {};

  const descriptor = {
    [`__DATALOADER__${MockDataloader.name}`]: mock,
    value: () => ({ nodes: [{ id: '1234' }, { id: '1235' }] }),
  };
  decoratorFactory(container, 'foobar', descriptor);
  await descriptor.value();

  expect(mock.prime).toHaveBeenCalledWith('1234', { id: '1234' });
  expect(mock.prime).toHaveBeenCalledWith('1235', { id: '1235' });
  expect(mock.prime).toHaveBeenCalledTimes(2);
});
```

**Consequence for tests:** any service method carrying `@PrimeDataLoader(X)` needs `X` provided in
the testing module, even if the test never touches it —
`{ provide: ArticleDataloaderService, useValue: { prime: vi.fn() } }`
(`libs/article/api/src/lib/article.service.spec.ts:111-116`).

---

## 8. Input validation

### 8.1 `class-validator` is not used — at all

```
$ grep -rn "from 'class-validator'" libs apps --include='*.ts'   →  0 matches
$ grep -n "class-validator\|class-transformer" package.json       →  0 matches
$ ls -d node_modules/class-validator                              →  not installed
```

There is **no** `ValidationPipe` in the API app. The only `useGlobalPipes` call in the repo is in the
media service: `apps/media/src/bootstrap.ts:16` → `app.useGlobalPipes(new ZodValidationPipe())`
(from `nestjs-zod`, `package.json:342`). That pipe is **not** wired into `apps/api-example`.

### 8.2 What actually validates

| Layer | Mechanism | Example |
| --- | --- | --- |
| GraphQL type system | required vs nullable `@Field`, enums, `Int`, `Date` | every `*.model.ts` |
| Custom scalars | `parseValue`/`parseLiteral` throw | `GraphQLSlug` slugifies (`libs/utils/api/src/lib/graphql/slug.ts`), `ColorScalar` enforces `#RRGGBB`, `libs/poll/api/src/lib/poll.scalar.ts:5-22` rejects non-numbers and negatives |
| zod schemas, called explicitly in services | `Validator.<schema>.parse(...)` / `.safeParse(...)` | `libs/user/src/lib/validator.ts`, `libs/session/api/src/lib/validator.ts` |
| zod schemas for domain values | `z.object(...).refine(...)` | `libs/utils/api/src/lib/periodicity-pricing.ts:29-40` (`periodicityPriceSchema`) |
| Hand-written guards in services | `if (...) throw new BadRequestException(...)` | `libs/event/api/src/lib/event.service.ts:186` (`validateEvent`), `libs/article/api/src/lib/article.service.ts:700-720` |
| Nest guards | `@Permissions`, `@Authenticated`, `@Public`, `@Settings`, `@Feature`, `@ScopedJwt` | §11 |

The zod convention is a `Validator` **class with static schema properties**, not a module of loose
consts (`libs/session/api/src/lib/validator.ts`, complete):

```ts
import z from 'zod';

export class Validator {
  static createUser = z.object({
    email: z.string().email(),
    name: z.string().max(50),
    firstName: z.string().max(50).optional(),
    birthday: z.coerce
      .date()
      .refine(data => new Date() > data, {
        path: ['birthday'],
        message: 'Birthday can not be in the future',
      })
      .optional(),
  });

  static login = z.object({
    email: z.string().email(),
  });
}
```

and it is invoked inside the service, not as a pipe:

```
libs/user/api/src/lib/user.service.ts:153   await Validator.password.parseAsync(password);
libs/user/api/src/lib/user.service.ts:178   await Validator.createUser.parse(input);
libs/user/api/src/lib/user.service.ts:179   await Validator.createAddress.parse(address);
libs/user/api/src/lib/user.service.ts:225   await Validator.updateUser.parse(input);
libs/session/api/src/lib/session.service.ts:332  Validator.login.parse({ email });
libs/session/api/src/lib/session.service.ts:384  const validation = Validator.login.safeParse({ email });
```

zod is at `^3.23.8` (`package.json:386`). The only `zod/v4` usage in the repo is the Puck AI field
schemas on the editor side, which is a separate concern.

---

## 9. Error handling

### 9.1 The convention: Nest HTTP exceptions

Counted across `libs` + `apps`, excluding specs:

| Exception | `new X(...)` occurrences |
| --- | --- |
| `BadRequestException` | 136 |
| `NotFoundException` | 110 |
| `ForbiddenException` | 14 |
| `InternalServerErrorException` | 13 |
| `UnauthorizedException` | 10 |
| `ConflictException` | 3 |
| `UnprocessableEntityException` | 0 |

Apollo maps these onto GraphQL errors with `extensions.code` of `BAD_REQUEST`, `NOT_FOUND`,
`FORBIDDEN`, etc. Messages are plain English sentences that include the offending id:

```ts
throw new NotFoundException(`Article with id ${id} not found`);
throw new BadRequestException(`Article with id ${id} has no draft to discard`);
throw new BadRequestException(
  `Cannot discard draft: article ${id} has no published version to revert to`
);
```

(`article.service.ts:239, 701-703, 717-719`.)

Domain-named subclasses are used where a message is reused (`libs/session/api/src/lib/session.errors.ts`,
complete):

```ts
import { BadRequestException } from '@nestjs/common';

export class InvalidCredentialsError extends BadRequestException {
  constructor() { super('The provided credentials are invalid.'); }
}

export class NotActiveError extends BadRequestException {
  constructor() { super('The user account is not active.'); }
}

export class UserNotFoundError extends BadRequestException {
  constructor() { super('The user was not found.'); }
}
```

### 9.2 `libs/errors` — a shared code enum, not an exception library

`libs/errors/src/lib/error-codes.ts` is the whole library (plus a one-line barrel):

```ts
export enum ErrorCode {
  TokenExpired = 'TOKEN_EXPIRED',
  InvalidCredentials = 'INVALID_CREDENTIALS',
  UserNotFound = 'USER_NOT_FOUND',
  NotAuthenticated = 'NOT_AUTHENTICATED',
  NotAuthorised = 'NOT_AUTHORISED',
  UserNotActive = 'USER_NOT_ACTIVE',
  NotFound = 'NOT_FOUND',
  EmailAlreadyInUse = 'EMAIL_ALREADY_IN_USE',
  MonthlyAmountNotEnough = 'MONTHLY_AMOUNT_NOT_ENOUGH',
  MonthlyTargetAmountNotEnough = 'MonthlyTargetAmountNotEnough',
  PaymentConfigurationNotAllowed = 'PAYMENT_CONFIGURATION_NOT_ALLOWED',
  UserInputError = 'USER_INPUT_ERROR',
  DuplicatePageSlug = 'DUPLICATE_PAGE_SLUG',
  CommentLengthError = 'COMMENT_LENGTH_ERROR',
  PeerTokenInvalid = 'PEER_TOKEN_INVALID',
  InternalError = 'InternalError',
  DisabledPeerError = 'DISABLED_PEER_ERROR',
  UserSubscriptionAlreadyDeactivated = 'USER_SUBSCRIPTION_ALREADY_DEACTIVATED',
  ChallengeFailed = 'ChallengeFailed',
  InvalidSettingData = 'INVALID_SETTING_DATA',
  PaymentAlreadyRunning = 'PAYMENT_ALREADY_RUNNING',
}
```

It is **barely used on the API side**: exactly one producer,
`libs/payment/api/src/lib/payments.service.ts:171` →
`throw new BadRequestException(ErrorCode.PaymentAlreadyRunning)`. Its real job is on the website
side: `libs/errors/website/src/lib/api-alert.tsx:12-23` matches the error *message* against the enum
to produce a German sentence, and `withErrorSnackbar` is wired into all 21 tenant `_app.tsx` files.
`libs/errors/website` also contains `with-error-toast.tsx`.

So the pattern is: **throw a Nest exception with a human message; use an `ErrorCode` string as the
message only when the website needs to recognise it.**

### 9.3 `libs/api` — the legacy error classes

`libs/api` is now a 2-export library:

```ts
export * from './lib/media/novaMediaAdapter';

export * from './lib/error';
```

`libs/api/src/lib/error.ts` holds nine plain `Error` subclasses, all pre-dating the Nest migration:

| Class | Used by |
| --- | --- |
| `NotAuthorisedError` | `libs/comments/api/src/lib/comment.service.ts:733` |
| `CommentLengthError` | `comment.service.ts:648` |
| `CommentAuthenticationError` | — (declared only) |
| `AnonymousCommentsDisabledError` | `comment.service.ts:664` |
| `AnonymousCommentRatingDisabledError` | — (declared only) |
| `AnonymousPollVotingDisabledError` | `libs/poll/api/src/lib/poll-vote.service.ts:118` |
| `AnonymousCommentError` | — (declared only) |
| `ChallengeMissingCommentError` | `comment.service.ts:672` |
| `InvalidStarRatingValueError` | `comment.service.ts:847` |

Being plain `Error`s they surface as `INTERNAL_SERVER_ERROR`. **Do not extend this file for new
work**; the rest of `libs/api` is the Prisma schema, migrations and changelogs, not runtime code.

### 9.4 Error context helpers

`libs/utils/api/src/lib/error-context.ts` exports `ErrorWithContext`, `describeError(error)` and
`addErrorContext(error, context)` — used when an upstream HTTP/provider error has to be turned into a
readable message without losing the original. `describeError` digs through `status`/`statusCode`/
`code` and a list of text keys (`message`, `statusText`, `error_description`, `detail`, `body`, …),
caps the result at 500 characters, and falls back to `util.inspect(error, {depth: 3})`.

### 9.5 Global filter and client-side humanising

- `apps/api-example/src/nestapp/app.module.ts:376-380` registers
  `{provide: APP_FILTER, useClass: SentryGlobalFilter}`. That is the **only** exception filter in the
  API; there is no custom `formatError`.
- The editor turns whatever arrives into a translated sentence in
  `libs/ui/editor/src/lib/humanizeError.ts:44-82`: it special-cases `CombinedGraphQLErrors` with
  `extensions.code` in `['FORBIDDEN','UNAUTHENTICATED']`, `ServerError` with status 401/403, Prisma
  unique-constraint messages (`errors.uniqueEmail` / `errors.uniqueField`), foreign-key constraints
  (`errors.inUse`), anything matching `/Invalid \`…\` invocation|prisma/i` (`errors.unexpected`),
  `Forbidden resource` (`errors.forbidden`) and network failures (`errors.network`).

**Implication:** a Prisma error that reaches the client is shown as a generic "unexpected" message.
Anything the editor should explain must be thrown as a `BadRequestException` with a real sentence.

---

## 10. `libs/nest-modules`

Nx project `nest-modules`, tag `publishable`, alias `@wepublish/nest-modules`. Eleven exports:

```ts
export * from './lib/api.module';
export * from './lib/database/prisma.module';
export * from './lib/add-metadata.decorator';
export * from './lib/database/prisma.service';
export * from './lib/urls/url-adapter';
export * from './lib/urls/url-adapter-hauptstadt';
export * from './lib/urls/url-adapter-wepublish-site';
export * from './lib/urls/url-adapter.module';

export * from './lib/one-of/one-of.guard';
export * from './lib/one-of/one-of.decorator';
```

### 10.1 `ApiModule`

```ts
@Module({ imports: [PrismaModule] })
export class ApiModule {}
```

### 10.2 `PrismaModule` / `PrismaService`

```ts
@Module({
  providers: [
    { provide: PrismaClient, useExisting: PrismaService },
    PrismaService,
  ],
  exports: [PrismaClient, PrismaService],
})
export class PrismaModule {
  // https://github.com/prisma/prisma/discussions/4399#discussioncomment-3126122
  static forTest(prismaClient: PrismaClient): DynamicModule {
    return {
      module: PrismaModule,
      providers: [
        { provide: PrismaClient, useFactory: () => prismaClient as PrismaService },
      ],
      exports: [PrismaClient, PrismaService],
    };
  }
}
```

This is why services inject `PrismaClient` (the Prisma-generated class) rather than `PrismaService`,
and why unit tests provide `{ provide: PrismaClient, useValue: prismaMock }`.

`PrismaService` configures the pg adapter (`prisma.service.ts:10-30`): `DATABASE_URL`,
`options: '-c timezone=UTC'`, `max: DATABASE_POOL_SIZE ?? 20`, `connectionTimeoutMillis: 5_000`,
`idleTimeoutMillis: 300_000`, and `$connect`/`$disconnect` on module init/destroy.

### 10.3 `AddMetadata`

An additive `SetMetadata` — several decorators can contribute to the same key:

```ts
export const AddMetadata = <K = string, V extends unknown[] = []>(
  metadataKey: K,
  metadataValue: V
): CustomDecorator<K> => {
  const decoratorFactory = (target: object, key?: any, descriptor?: any) => {
    const existingValue = Reflect.getMetadata(metadataKey, descriptor?.value ?? target);
    const value = existingValue ? uniq([...existingValue, ...metadataValue]) : metadataValue;

    if (descriptor) {
      Reflect.defineMetadata(metadataKey, value, descriptor.value);
      return descriptor;
    }

    Reflect.defineMetadata(metadataKey, value, target);
    return target;
  };

  decoratorFactory.KEY = metadataKey;

  return decoratorFactory;
};
```

### 10.4 `OneOf` / `OneOfGuard` — how `@Public` and `@Permissions` coexist

```ts
export const ONE_OF_METADATA_KEY = 'one_of';

export const OneOf = (...guards: Type<CanActivate>[]) =>
  AddMetadata(ONE_OF_METADATA_KEY, guards);
```

```ts
@Injectable()
export class OneOfGuard implements CanActivate {
  constructor(private reflector: Reflector, private moduleRef: ModuleRef) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowedGuards = this.reflector.getAllAndMerge<Type<CanActivate>[]>(
      ONE_OF_METADATA_KEY, [context.getHandler(), context.getClass()]
    );

    const guards = allowedGuards.map(guardReference =>
      this.moduleRef.get<CanActivate>(guardReference, { strict: false })
    );

    if (!guards.length) {
      return false;
    }

    const checks = await Promise.all(
      guards.map(async guard => {
        try {
          const canActivate$ = guard.canActivate(context);
          const canActivate =
            isObservable(canActivate$) ? await lastValueFrom(canActivate$) : await canActivate$;
          return canActivate;
        } catch (error) {
          if (error instanceof UnauthorizedException) {
            return false;
          }
          throw error;
        }
      })
    );

    return checks.some(Boolean);
  }
}
```

**`!guards.length → false` is the important line:** an operation with no `@Public`, `@Authenticated`,
`@Permissions`, `@Settings` or `@ScopedJwt` decorator is **denied**. Every resolver method must carry
at least one.

### 10.5 `URLAdapter`

```ts
@Injectable()
export class URLAdapter {
  constructor(protected baseURL: string) { this.baseURL = baseURL.trim(); }

  async getSubscriptionURL(subscription: Subscription) { … }
  async getArticleUrl(article: Article) {
    return article.slug ? `${this.baseURL}/a/${article.slug}` : `${this.baseURL}/a/id/${article.id}`;
  }
  async getArticlePreviewUrl(article: Article) { return `${await this.getArticleUrl(article)}?preview`; }
  async getPageUrl(page: Page) { … }
  async getPagePreviewUrl(page: Page) { … }
  async getAuthorURL(author: Pick<Author, 'id' | 'slug'>) { … }
  async getEventURL(event: Event) { return `${this.baseURL}/event/${event.id}`; }
  async getCommentURL(item: Article | Page, comment: Pick<Comment, 'id' | 'itemType'>) { … }
  getLoginURL(token: string) { return `${this.baseURL}/login?jwt=${token}`; }
  async getTagURL(tag: Tag) { … }
}
```

Two subclasses exist (`HauptstadtURLAdapter`, `WepublishSiteURLAdapter`), chosen by the config file
at boot (`app.module.ts:328-350`). `URLAdapterModule` is `@Global()` and offers
`register(config)` / `registerAsync(options)`.

---

## 11. `libs/authentication/api` and `libs/permissions/api`

### 11.1 Exports

```ts
export { PEER_USER_AGENT } from './lib/session.strategy';

export * from './lib/auth-session';
export * from './lib/authentication.module';
export * from './lib/optional-authentication.guard';
export * from './lib/authentication.service';
export * from './lib/current-user.decorator';
export * from './lib/request-fingerprint.decorator';
export * from './lib/public.decorator';
export * from './lib/public.guard';
export * from './lib/authenticated.decorator';
export * from './lib/authenticated.guard';
export * from './lib/unselect-password';
export * from './lib/scoped-jwt.decorator';
export * from './lib/scoped-jwt.guard';
export * from './lib/auth-token.decorator';
export * from './lib/session-cache';
```

### 11.2 The session type a resolver sees

```ts
export enum AuthSessionType { User = 'user', Token = 'token' }

export type TokenSession = {
  type: AuthSessionType.Token;
  id: string;
  name: string;
  token: string;
  roles: UserRole[];
};

export type UserSession = {
  type: AuthSessionType.User;
  id: string;
  user: User;
  roles: UserRole[];
  createdAt: Date;
  expiresAt: Date;
  token: string;
  impersonatedBy?: string | null;
};

export type AuthSession = TokenSession | UserSession;
```

(`libs/authentication/api/src/lib/auth-session.ts`.) `@CurrentUser()` returns
`ctx.getContext().req.user`, i.e. an `AuthSession | undefined`; resolvers type it as
`UserSession | undefined` and read `user?.user?.id`.

### 11.3 The module and its two global guards

```ts
@Module({
  imports: [
    PrismaModule,
    KvTtlCacheModule,
    PassportModule.register({
      session: false, // would use a cookie if set to true
      defaultStrategy: 'session',
    }),
  ],
  providers: [
    SessionStrategy,
    AuthenticationService,
    { provide: APP_GUARD, useClass: OptionalAuthenticationGuard },
    { provide: APP_GUARD, useClass: OneOfGuard },
    PublicGuard,
    AuthenticatedGuard,
  ],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
```

`OptionalAuthenticationGuard` extends `AuthGuard('session')`, swallows `UnauthorizedException`
(returning `true` so the request continues anonymously) *except* for peer tokens, which rethrow
(`optional-authentication.guard.ts:15-35`). `SessionStrategy` is a `passport-http-bearer` strategy
that routes to `getPeerSession` when `user-agent === 'We.Publish/1.0 Peering'` and to
`getUserSession` otherwise (`session.strategy.ts:18-37`). Sessions are KV-cached for 300 s under
`auth:sessions` with a SHA-256 of the token as key (`session-cache.ts:8-12`).

### 11.4 Decorator reference

| Decorator | File | Semantics |
| --- | --- | --- |
| `@Public()` | `public.decorator.ts:11-12` | `SetMetadata('public', true)` + `OneOf(PublicGuard)` |
| `@Authenticated()` | `authenticated.decorator.ts:11-15` | `SetMetadata('authenticated', true)` + `OneOf(AuthenticatedGuard)`; passes if `req.user` exists |
| `@Permissions(...perms)` | `libs/permissions/api/src/lib/permission.decorator.ts:13-17` | `AddMetadata('permissions', perms)` + `OneOf(PermissionsGuard)`; requires **all** listed permissions |
| `@ScopedJwt(scope)` | `scoped-jwt.decorator.ts:11-15` | bearer token verified against a scope claim |
| `@Settings(...names)` | `libs/settings/api/src/lib/settings.decorator.ts:13-17` | requires a truthy setting; also `OneOf` |
| `@Feature(...keys)` | `libs/features/api/src/lib/feature.decorator.ts:13-17` | **not** `OneOf` — `UseGuards(FeatureGuard)`, required *in addition* to the others; throws `ForbiddenException` when off |
| `@CurrentUser()` | `current-user.decorator.ts:4-9` | the `AuthSession` off the GraphQL request |
| `@AuthToken()` | `auth-token.decorator.ts:4-15` | the raw bearer token string or `null` |
| `@RequestFingerprint()` | `request-fingerprint.decorator.ts:7-13` | `"<ipHash>:<uaHash>"`, 7 hex chars each |
| `@PreviewMode()` | `libs/permissions/api/src/lib/preview-mode.decorator.ts:6-15` | `hasPermission(CanPreview, roles) && !!req.headers.preview` |
| `@AuditLogged({entity, action, skip})` | `libs/audit-log/api/src/lib/audit-log.decorator.ts:12-13` | overrides the derived audit entry |

### 11.5 Permission checks

```ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);

    const permissions = this.reflector.getAllAndMerge<Permission[]>(
      PERMISSIONS_METADATA_KEY, [context.getHandler(), context.getClass()]
    );

    if (!permissions.length) { return false; }

    const request = ctx.getContext().req;
    const session = request.user;

    if (!session) { return false; }

    return hasPermission(permissions, session.roles);
  }
}
```

```ts
export function hasPermission<PermissionsUserRole extends Pick<UserRole, 'id' | 'permissionIDs'>>(
  neededPermissions: Permission | Permission[],
  userRoles: PermissionsUserRole[]
): boolean {
  const perms = Array.isArray(neededPermissions) ? neededPermissions : [neededPermissions];

  const hasPerms = perms.map(perm => {
    if (perm.deprecated) { console.warn('Permission is deprecated', perm); }

    const userPermissions = userRoles.flatMap(role => role.permissionIDs);

    return userPermissions.some(permission => permission === perm.id);
  });

  return hasPerms.every(Boolean);
}
```

Permissions themselves are plain objects in `libs/permissions/src/lib/permissions.ts`:

```ts
export type Permission = {
  id: string;
  description: string;
  deprecated: boolean;
};
```

The five existing event permissions are declared at `permissions.ts:685-713` (`CanGetEvent`,
`CanCreateEvent`, `CanUpdateEvent`, `CanDeleteEvent`, `CanGetImportedEvents`) and assigned to roles
at `:1303-1310` and `:1426-1433`. `PermissionModule` (`libs/permissions/api/src/lib/permission.module.ts`)
provides the guard and the `PermissionResolver`.

---

## 12. `libs/utils`

Three entry points:

| Alias | Root | Contents |
| --- | --- | --- |
| `@wepublish/utils` | `libs/utils/src` | `slugify`, URL helpers |
| `@wepublish/utils/api` | `libs/utils/api/src` | everything below |
| `@wepublish/utils/website` | `libs/utils/website/src` | Next.js page cache, api-url, website shell, revalidation |

`libs/utils/api/src/index.ts`, complete:

```ts
export * from './lib/app-environment';
export * from './lib/generate-jwt';
export * from './lib/logger';
export * from './lib/module-options';
export * from './lib/payment-period-to-months';
export * from './lib/periodicity-pricing';
export * from './lib/max-payload-size';
export * from './lib/constants';
export * from './lib/error-context';

export * from './lib/dataloader/create-optionals-array';
export * from './lib/dataloader/prime-dataloaders.decorator';
export * from './lib/dataloader/dataloader.service';

export * from './lib/graphql/sort-order';
export * from './lib/graphql/max-limit';
export * from './lib/graphql/paginated-type';
export * from './lib/graphql/date-comparison';
export * from './lib/graphql/slug';
export * from './lib/graphql/color.scalar';
```

Notable non-GraphQL helpers:

- `logger(moduleName)` — a pino child logger (`logger.ts:13-19`). Used alongside, not instead of,
  Nest's `Logger`; `new Logger('ArticlePublicationWatcher')` is the more common choice inside domain
  libs, `logger('audit-log')` in newer ones.
- `ModuleAsyncOptions<T>` + `createAsyncOptionsProvider(provide, options)`
  (`module-options.ts:3-36`) — the shared `registerAsync` plumbing for configurable modules.
- `constants.ts` — `ONE_HOUR_IN_MILLISECONDS`, `ONE_DAY_IN_MILLISECONDS`,
  `FIFTEEN_MINUTES_IN_MILLISECONDS`, `ONE_MINUTE_IN_MILLISECONDS`, `ONE_MONTH_IN_MILLISECONDS`,
  `USER_PROPERTY_LAST_LOGIN_LINK_SEND`.
- `addErrorContext` / `describeError` / `ErrorWithContext` (§9.4).
- `generateJWT`, `MAX_PAYLOAD_SIZE`, `AppEnvironment`.

---

## 13. `libs/api` — what the core lib still exports

```ts
export * from './lib/media/novaMediaAdapter';

export * from './lib/error';
```

That is the entire public surface of `@wepublish/api`. The directory's real content is
`libs/api/prisma/` (schema + migrations), `libs/api/changelogs/` (the user-facing changelog entries
the `changelog-api` sync tooling consumes) and `libs/api/__tests__/`. The project is tagged
`publishable` and its build copies `libs/api/prisma/**/*` as assets (`libs/api/project.json`).

Practical consequence: **a new domain adds nothing to `libs/api` except a Prisma model and a
migration.**

---

## 14. Registering a module

### 14.1 In `apps/api-example`

Five mechanical steps:

1. **TS path alias** — `tsconfig.base.json`:
   `"@wepublish/<domain>/api": ["libs/<domain>/api/src/index.ts"]` (existing event entries at
   `tsconfig.base.json:58-63`).
2. **Nx project** — `libs/<domain>/api/project.json` with `"name": "<domain>-api"`.
3. **Import the module** in `apps/api-example/src/nestapp/app.module.ts`. For a plain module, add the
   class to the `imports` array — `EventModule` sits at line 262, between `ExternalAppsModule` and
   `PageModule`; `ArticleModule` at 275; `AuditLogModule` at 255; `ChangelogModule` at 256.
4. **Regenerate the SDL.** The GraphQL module is code-first with
   `autoSchemaFile: process.env.NODE_ENV === 'production' ? true : './apps/api-example/schema-v2.graphql'`
   (`app.module.ts:112-115`), so booting the API in dev rewrites `apps/api-example/schema-v2.graphql`.
   That file is in `.nxignore`.
5. **Regenerate the client types** — `npm run generate-api` (`package.json:31`):
   `graphql-codegen -r dotenv/config --config codegen.yml && nx run-many -t build -p editor-api,website-api`.

The full GraphQL module configuration, for reference (`app.module.ts:101-129`):

```ts
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const configFile = await readConfig(config.getOrThrow('CONFIG_FILE_PATH'));

        return {
          resolvers: { RichText: GraphQLRichText },
          autoSchemaFile:
            process.env.NODE_ENV === 'production' ? true
            : './apps/api-example/schema-v2.graphql',
          sortSchema: true,
          path: 'v1',
          cache: 'bounded',
          persistedQueries: false,
          introspection:
            process.env.NODE_ENV !== 'production' && configFile.general.apolloIntrospection,
          graphiql: configFile.general.apolloPlayground,
          allowBatchedHttpRequests: true,
          inheritResolversFromInterfaces: true,
          csrfPrevention: false,
        } as ApolloDriverConfig & GqlModuleOptions;
      },
    }),
```

The GraphQL endpoint is `POST /v1`.

### 14.2 Configurable modules

When a module needs runtime configuration it exposes a static `register` / `registerAsync` and is
called with a factory. Examples from the same file:

```ts
    EventsImportModule.registerAsync({
      useFactory: (agendaBasel: AgendaBaselService, kulturZueri: KulturZueriService) =>
        [agendaBasel, kulturZueri],
      inject: [AgendaBaselService, KulturZueriService],
    }),
```

```ts
    PeerModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        hostURL: config.get('HOST_URL') || 'http://localhost:4000',
        websiteURL: config.get('WEBSITE_URL') || 'http://localhost:3000',
      }),
    }),
```

`createAsyncOptionsProvider` from `@wepublish/utils/api` implements the `useFactory` /
`useExisting` / `useClass` dispatch; `URLAdapterModule` (`libs/nest-modules/src/lib/urls/url-adapter.module.ts:39-71`)
is the compact reference implementation.

Other wiring facts in `app.module.ts`:

- The whole `AppModule` is `@Global()` (line 97).
- `ScheduleModule.forRoot()` at line 301 — **without it, no `@Cron` / `@Interval` runs**.
- `ConfigModule.forRoot()` at line 302.
- `SentryModule.forRoot()` at line 100 and `APP_FILTER: SentryGlobalFilter` at 376-380.
- The comment at 207-208: "Register SessionModule after AuthenticationModule to ensure proper order
  of dependencies". Ordering inside `imports` is load-bearing in at least that one case.

### 14.3 "Other apps"

There are exactly two Nest apps: `apps/api-example` and `apps/media`
(`find apps -name app.module.ts`). `apps/media/src/app/app.module.ts` imports only the three
`@wepublish/media/api` modules and shares no domain modules. `apps/bka` contains only a
`deployment.config.json` and a tsbuildinfo — it is not a Next.js site yet.

The 21+ Next.js tenant apps and `apps/editor` do **not** import Nest modules at all; they consume the
API over GraphQL via `@wepublish/website/api` / `@wepublish/editor/api` (§16).

---

## 15. Testing conventions for API libs

Rule zero, from `CLAUDE.md` and `.claude/docs/testing.md`: **write the test first, run it, watch it
fail for the right reason, then implement.**

### 15.1 Runner configuration

`libs/<domain>/api/vitest.config.ts` is five lines and must pass `nest: true`:

```ts
import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: '<domain>-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
```

What `nest: true` does (`vitest.shared.ts:154-179`): swaps esbuild for `unplugin-swc` with

```ts
          swc.vite({
            jsc: {
              // es2021 so class fields are downleveled into the constructor
              // (after parameter property assignments), matching the tsc
              // output the production build uses. With native es2022 fields,
              // `field = this.injectedParam.x` initializers run before the
              // constructor body and crash.
              target: 'es2021',
              parser: { syntax: 'typescript', decorators: true },
              transform: {
                legacyDecorator: true,
                decoratorMetadata: true,
                // Match tsc semantics: field initializers may reference
                // constructor parameter properties (`= this.config.x`).
                useDefineForClassFields: false,
              },
              keepClassNames: true,
            },
            module: { type: 'es6' },
            sourceMaps: true,
          }),
```

and adds `vitest.setup-nest.ts` to `setupFiles` (`vitest.shared.ts:222`), which is:

```ts
import 'reflect-metadata';

// Anything reading a stored provider credential constructs SecretCrypto,
// which refuses to boot without a master key.
process.env['APP_SECRET_KEY'] ??= 'test-app-secret-key-0123456789';

// nx loads .env into every task; tests must not share the dev Dragonfly.
delete process.env['REDIS_URL'];
delete process.env['REDIS_KEY_PREFIX'];
```

Without `nest: true`, `design:paramtypes` is dropped and constructor injection silently resolves to
`undefined`.

Other globals from `vitest.shared.ts`: `globals: true` (so `describe`/`it`/`expect`/`vi` need no
import), `clearMocks: true`, `passWithNoTests: true`, `testTimeout`/`hookTimeout` 15 s, include glob
`**/*.{spec,test}.*`, `TZ=UTC` (`vitest.setup-tests.ts:3`).

Commands: `npx nx test <domain>-api`, `npx nx test <domain>-api --watch`,
`npx nx test <domain>-api --configuration=update` for snapshots,
`npx nx affected -t lint test --uncommitted` as the gate
(`.claude/docs/verification.md:14-30`).

### 15.2 A service spec

`libs/article/api/src/lib/article.service.spec.ts:1-121` is the reference:

```ts
import { KvTtlCacheModule } from '@wepublish/kv-ttl-cache/api';
import { Test, TestingModule } from '@nestjs/testing';
import { ArticleService, createArticleFilter } from './article.service';
import { Article, PrismaClient, TaggedArticles } from '@prisma/client';
import { ArticleDataloaderService } from './article-dataloader.service';
import { DateFilterComparison, SortOrder } from '@wepublish/utils/api';
import { ArticleSort } from './article.model';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TrackingPixelService } from '@wepublish/tracking-pixel/api';
import { mapBlockUnionMap } from '@wepublish/block-content/api';
import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';
import { ArticlePublicationWatcher } from './article-publication.watcher';
import type { Mock } from 'vitest';

vi.mock('@wepublish/block-content/api');

describe('ArticleService', () => {
  let service: ArticleService;
  let prismaMock: {
    $queryRaw: Mock;
    articleTrackingPixels: {
      [method in keyof PrismaClient['articleTrackingPixels']]?: Mock;
    };
    article: { [method in keyof PrismaClient['article']]?: Mock };
    articleRevision: { [method in keyof PrismaClient['articleRevision']]?: Mock };
    taggedArticles: { [method in keyof PrismaClient['taggedArticles']]?: Mock };
  };
  …

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    prismaMock = {
      $queryRaw: vi.fn(),
      article: {
        count: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(),
        findUnique: vi.fn(), delete: vi.fn(), create: vi.fn(), update: vi.fn(),
      },
      articleRevision: {
        updateMany: vi.fn(), update: vi.fn(), findUnique: vi.fn(),
        findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn(),
      },
      articleTrackingPixels: { createMany: vi.fn(), findMany: vi.fn() },
      taggedArticles: { findMany: vi.fn() },
    };
    …
    const module: TestingModule = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
      providers: [
        ArticleService,
        { provide: PrismaClient, useValue: prismaMock },
        { provide: TrackingPixelService, useValue: trackingPixelMock },
        { provide: PublicContentCacheInvalidator, useValue: publicContentCache },
        { provide: ArticlePublicationWatcher, useValue: publicationWatcher },
        { provide: ArticleDataloaderService, useValue: { prime: vi.fn() } },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
  });
```

Conventions visible here:

- **Prisma is mocked by hand**, as a plain object typed against the real client:
  `{ [method in keyof PrismaClient['article']]?: Mock }`. No `prisma-mock`, no `jest-mock-extended`.
- Only the methods the test needs exist on the mock; everything else is a `TypeError` if called,
  which is deliberate.
- `KvTtlCacheModule` is imported for real — it falls back to an in-memory store because the setup
  files delete `REDIS_URL`.
- Fake timers are set in `beforeAll` whenever the code under test stamps `new Date()`.
- Dataloaders are stubbed with just the methods used (`{prime: vi.fn()}`), because of
  `@PrimeDataLoader`.
- Assertions go against the **arguments Prisma was called with**, snapshotted:

```ts
  it('should query articles based on filter', async () => {
    prismaMock.article.findMany?.mockResolvedValue([]);
    prismaMock.$queryRaw.mockResolvedValue([{ id: '1234' }, { id: '1235' }]);

    await service.getArticles({
      filter: {
        authors: ['1234'], tags: ['1234'], excludeIds: ['1234'], ids: ['12345'],
        peerId: '1234', includeHidden: false, excludeHideAuthor: true,
        preTitle: 'preTitle', title: 'title', lead: 'lead',
        publicationDateFrom: { date: new Date('2025z-01-01'), comparison: DateFilterComparison.LowerThan },
        publicationDateTo: { date: new Date('2030-01-01'), comparison: DateFilterComparison.LowerThan },
        shared: true, draft: true, pending: true, published: true,
      },
      sort: ArticleSort.PublishedAt,
      order: SortOrder.Ascending,
      skip: 5,
      take: 5,
    });

    expect(prismaMock.$queryRaw.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.article.findMany?.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.article.count?.mock.calls[0]).toMatchSnapshot();
  });
```

The snapshot file is committed: `libs/article/api/src/lib/__snapshots__/article.service.spec.ts.snap`
(1 774 lines).

The changelog service spec shows the explicit-assertion alternative, which is preferable for new
behaviour (`libs/changelog/api/src/lib/changelog.service.spec.ts:54-101`):

```ts
    it('returns entries newest first with pagination info', async () => {
      mockPrisma.changelogEntry.count.mockResolvedValue(1);
      mockPrisma.changelogEntry.findMany.mockResolvedValue([{ ...mockEntry, translations: [] }]);

      const result = await service.getChangelogEntries({});

      expect(mockPrisma.changelogEntry.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 11,
        orderBy: { releasedAt: 'desc' },
        include: { translations: { where: { locale: { in: [] } } } },
      });
      expect(result).toEqual({
        nodes: [mockEntry],
        totalCount: 1,
        pageInfo: {
          hasPreviousPage: false, hasNextPage: false,
          startCursor: 'entry-1', endCursor: 'entry-1',
        },
      });
    });

    it('slices the extra row used to detect a next page', async () => {
      const entries = Array.from({ length: 3 }, (_, index) => ({
        ...mockEntry, id: `entry-${index + 1}`, translations: [],
      }));
      mockPrisma.changelogEntry.count.mockResolvedValue(10);
      mockPrisma.changelogEntry.findMany.mockResolvedValue(entries);

      const result = await service.getChangelogEntries({ take: 2, skip: 2 });

      expect(result.nodes).toHaveLength(2);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(true);
    });
```

Note `take: 11` — the `getMaxTake(10) + 1` convention asserted directly.

### 15.3 A resolver spec — a real GraphQL round trip

Resolver specs boot a Nest app with an in-memory Apollo server and drive it with `supertest`
(`libs/changelog/api/src/lib/changelog.resolver.spec.ts:62-104`):

```ts
describe('ChangelogResolver', () => {
  let app: INestApplication;

  const changelogService = {
    getChangelogEntries: vi.fn(),
    confirmChangelogEntry: vi.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
          context: ({ req }: { req: { user?: unknown } }) => {
            req.user = mockSession;
            return { req };
          },
        }),
      ],
      providers: [
        ChangelogResolver,
        { provide: ChangelogService, useValue: changelogService },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(() => { vi.clearAllMocks(); });
  afterAll(async () => { await app.close(); });
```

The operation is a plain template string at the top of the file, and the test asserts both the
response body and the service call:

```ts
  test('confirmChangelogEntry mutation passes the current user', async () => {
    const confirmedAt = new Date('2026-08-25T14:00:00Z');
    changelogService.confirmChangelogEntry.mockResolvedValue({
      ...mockEntry, confirmedAt, confirmedByUserId: 'user-1',
    });

    const response = await request(app.getHttpServer())
      .post('')
      .send({ query: confirmChangelogEntryMutation, variables: { id: 'entry-1' } })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.confirmChangelogEntry).toEqual({
      id: 'entry-1',
      confirmedAt: confirmedAt.toISOString(),
      confirmedByUserId: 'user-1',
    });
    expect(changelogService.confirmChangelogEntry).toHaveBeenCalledWith(
      'entry-1', 'user-1', undefined
    );
  });
```

Three things to know:

- **`autoSchemaFile: true`** (boolean, not a path) so the spec builds the schema in memory.
- Injecting a session is done through the GraphQL `context` option, as above. Specs that don't need
  one omit it (`libs/event/api/src/lib/event.resolver.spec.ts:205-210`).
- **Guards do not run.** `OneOfGuard` is an `APP_GUARD` registered by `AuthenticationModule`, which
  these specs do not import, so `@Permissions`/`@Authenticated` are inert metadata. Asserting a deny
  path at this level proves nothing — `.claude/docs/testing.md` says so explicitly. Deny paths belong
  in guard specs (`libs/permissions/api/src/lib/permission.guard.spec.ts`,
  `libs/authentication/api/src/lib/public.guard.spec.ts`).

`libs/consent/api/src/lib/consent/consent.resolver.spec.ts` uses `createMock(ConsentService)` from
`@wepublish/testing` instead of a literal object; `libs/event/api/src/lib/event.resolver.spec.ts`
mixes both and snapshots `res.body.data`.

### 15.4 A dataloader spec

`libs/article/api/src/lib/article-dataloader.service.spec.ts` mocks the `dataloader` package itself:

```ts
vi.mock('dataloader', () => ({
  default: vi.fn(function (this: any) {
    this.prime = vi.fn();
    this.load = vi.fn();
    this.loadMany = vi.fn();
    this.clear = vi.fn();
    this.clearAll = vi.fn();
  }),
}));
```

then, for the load tests, replaces the implementation with one that calls the batch function
synchronously:

```ts
      // @ts-expect-error mocked so typing doesn't work
      DataLoader.mockImplementation(function (impl: any, opt: any) {
        return {
          load: (id: string) => impl([id]),
          loadMany: (ids: readonly string[]) => impl(ids),
        };
      });
```

Because the loader is `Scope.REQUEST`, it must be obtained with `module.resolve(...)`, not
`module.get(...)`:

```ts
      service = await module.resolve<ArticleDataloaderService>(ArticleDataloaderService);
```

### 15.5 A watcher spec

`libs/article/api/src/lib/article-publication.watcher.spec.ts` constructs the class directly (no Nest
container) and drives fake timers:

```ts
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    prisma = {
      article: { findMany: vi.fn().mockResolvedValue([]) },
      articleRevision: { findMany: vi.fn().mockResolvedValue([]) },
    };
    publicContentCache = {
      invalidate: vi.fn().mockResolvedValue(undefined),
      invalidateArticlePages: vi.fn().mockResolvedValue(undefined),
    };
    watcher = new ArticlePublicationWatcher(prisma as any, publicContentCache as any);
  });

  afterEach(() => {
    watcher.onModuleDestroy();
    vi.useRealTimers();
  });

  it('clears cached articles and answers when a scheduled article goes live', async () => {
    prisma.article.findMany.mockResolvedValue([
      { publishedAt: new Date('2026-10-01T10:00:30.000Z') },
    ]);

    await watcher.scheduleUpcoming();
    await vi.advanceTimersByTimeAsync(20_000);
    expect(publicContentCache.invalidate).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(15_000);
    expect(publicContentCache.invalidate).toHaveBeenCalledWith('articles');
  });

  it('only asks for publications in the next 70 seconds', async () => {
    await watcher.scheduleUpcoming();

    const where = {
      publishedAt: { gt: now, lte: new Date('2026-10-01T10:01:10.000Z') },
    };
    expect(prisma.article.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }));
    expect(prisma.articleRevision.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }));
  });
```

`vi.advanceTimersByTimeAsync` is the right tool; note the 2 000 ms `CLOCK_DRIFT_MS` added by
`PublicationTimers` (so a 30 s publication fires at 32 s, hence the 20 s / +15 s split above).

### 15.6 `@wepublish/testing`

```ts
export * from './lib/act-wait';
export * from './lib/mock-date';
export * from './lib/create-mock';
export * from './graphql';

// Prisma utilities (createPrismaClient, clearDatabase, clearFullDatabase)
// are NOT re-exported here to avoid pulling @prisma/client into frontend tests.
// Import directly: import { ... } from '@wepublish/testing/prisma';
```

`createMock(SomeClass)` walks the prototype and returns a mock whose every method throws
`Method <x> not implemented. You need to mock this method before using it.` until stubbed
(`libs/testing/src/lib/create-mock.ts:26-43`). Types: `Mocked<T>`, `PartialMocked<T>`,
`DeepMocked<T>`.

`libs/testing` is in `.nxignore`, so `nx test` never runs its own specs.

### 15.7 Projects excluded from `nx test`

`.nxignore`:

```
libs/testing
libs/storybook
apps/api-example/schema-v2.graphql
libs/**/*/seed.ts
// Block content requires pages & articles which require block-content
// Without this, the build fails with maximum stack call
libs/block-content/api
// Image requires peers which require Image
// Without this, the build fails with maximum stack call
libs/image/api
```

Specs in `libs/block-content/api` and `libs/image/api` must be run by hand:
`npx vitest run --config libs/block-content/api/vitest.config.ts`.

---

## 16. GraphQL documents and codegen

### 16.1 Where documents live

| Consumer | Documents | Generated into | Alias |
| --- | --- | --- | --- |
| Editor | `libs/editor/api/src/lib/schemas/*.graphql` (62 files) | `libs/editor/api/src/lib/gql/`, `schema-types.ts`, `possible-types.ts` | `@wepublish/editor/api` |
| Websites | `libs/website/api/src/lib/schemas/*.graphql` (28 files) | `libs/website/api/src/lib/gql/`, `schema-types.ts`, `possible-types.ts` | `@wepublish/website/api` |
| API integration tests | `libs/testing/src/graphql/public/*.graphql` | `libs/testing/src/graphql/{schema-public,graphql-public}.ts` | `@wepublish/testing` |
| Peering (server→server) | `libs/peering/api/src/lib/remote/*.graphql` | `libs/peering/api/src/lib/remote/{schema,graphql}.ts` | internal |

One `.graphql` file per domain. The events ones today are
`libs/editor/api/src/lib/schemas/events.graphql` (116 lines) and
`libs/website/api/src/lib/schemas/event.graphql` (54 lines).

### 16.2 The document style

A `Full<Entity>` fragment, then operations that spread it
(`libs/editor/api/src/lib/schemas/events.graphql:1-58`):

```graphql
fragment FullEvent on Event {
  id
  name
  lead
  description
  status
  location
  image { ...FullImage }
  tags { ...FullTag }
  startsAt
  endsAt
  createdAt
  modifiedAt
  url
  externalSourceName
  externalSourceId
}

query EventList(
  $filter: EventFilter
  $cursorId: String
  $take: Int
  $skip: Int
  $order: SortOrder
  $sort: EventSort
) {
  events(filter: $filter, cursorId: $cursorId, take: $take, skip: $skip, order: $order, sort: $sort) {
    nodes { ...FullEvent }

    pageInfo { startCursor endCursor hasNextPage hasPreviousPage }

    totalCount
  }
}

query Event($id: String!) {
  event(id: $id) { ...FullEvent }
}
```

Fragments are **global across the lib** — `...FullImage` and `...FullTag` come from
`image.graphql` and `tag.graphql` and need no import. Larger domains split the fragment in two
(`article-without-blocks.graphql` + `article.graphql`) so list views don't pay for block content.

### 16.3 What codegen produces — documents, **not hooks**

`codegen.yml:15-43` for the editor:

```yaml
  ./libs/editor/api/src/lib/gql/:
    schema:
      - ./apps/api-example/schema-v2.graphql
    documents:
      - ./libs/editor/api/src/lib/schemas/*.graphql
    preset: client
    presetConfig:
      # Components consume plain fragment types, not masked references.
      fragmentMasking: false
    plugins:
      - add:
          content: "import {RichtextJSONDocument} from '@wepublish/richtext';"
    config:
      # Keeps the huge block-union fragments within TypeScript's instantiation
      # limits, as the previous setup did.
      inlineFragmentTypes: combine
      # Enum members are used as runtime values throughout the apps.
      enumType: native
      # Restores the `__typename` discriminants the apps switch on.
      skipTypename: false
      nonOptionalTypename: true
      scalars:
        VoteValue: number
        Date: string
        DateTime: string
        Color: string
        Slug: string
        RichText: RichtextJSONDocument
        Upload: File
```

The website target (`codegen.yml:83-111`) is identical except for the paths. Each lib also gets:

- `schema-types.ts` — the `typescript` plugin over the whole schema, because client-preset only emits
  types that an operation selects, while app code imports schema object types (`Event`, `Tag`, …)
  directly (`codegen.yml:45-69`, `113-137`).
- `possible-types.ts` — the `fragment-matcher` plugin, fed to the Apollo `InMemoryCache`
  (`codegen.yml:71-77`, `139-145`).

`graphql-codegen` runs the hook `node tools/generateApiIndex.js` afterwards (`codegen.yml:5-7`),
which writes `libs/{editor,website}/api/src/index.ts`. That barrel re-exports `gql/graphql`
wholesale and then re-exports, **by name**, only those schema types the operations file does not
already export — recomputed every run to avoid TS2308 ambiguity
(`tools/generateApiIndex.js:1-77`).

The output for an operation is a `TypedDocumentNode` const, not a hook:

```ts
export const EventListDocument = {"kind":"Document","definitions":[…]}
  as unknown as DocumentNode<EventListQuery, EventListQueryVariables>;
```

(`libs/editor/api/src/lib/gql/graphql.ts:7059`.) `grep -c "export function use"` over that file
returns **0**. Apollo Client 4 infers result and variable types from the document.

### 16.4 Consuming a document

`apps/editor/src/app/routes/events/eventListView.tsx:1-96`:

```tsx
import { useQuery } from '@apollo/client/react';
import {
  EventFilter,
  EventListDocument,
  FullEventFragment,
  TagType,
} from '@wepublish/editor/api';
…
  const {
    data,
    loading: isLoading,
    refetch,
  } = useQuery(EventListDocument, {
    variables: {
      filter: filter || undefined,
      take: limit,
      skip: (page - 1) * limit,
    },
  });
```

So the three names a `.graphql` file produces are `<Operation>Document`, `<Operation>Query` /
`<Operation>QueryVariables`, and `<Fragment>Fragment` — all from `@wepublish/editor/api`.

### 16.5 Client setup

`libs/editor/api/src/lib/setup.tsx` builds the Apollo client: an `authLink` that reads
`localStorage[sessionToken]` and **always sends `preview: 'preview'`**
(`setup.tsx:44-59`), `RemoveTypenameFromVariablesLink`, `UploadHttpLink` for file uploads, the
`possibleTypes` fragment matcher, and `queryErrorLink` — an `ErrorLink` that routes query (not
mutation) errors to a globally registered handler (`libs/editor/api/src/lib/query-errors.ts:13-23`).

---

## 17. Scheduled and background work

`ScheduleModule.forRoot()` (`app.module.ts:301`) enables `@nestjs/schedule`. Four patterns exist.

### 17.1 `@Interval` lookahead watchers (content going live)

Three watchers, all structurally identical:

| Watcher | File | Interval | What it watches | On fire |
| --- | --- | --- | --- | --- |
| `ArticlePublicationWatcher` | `libs/article/api/src/lib/article-publication.watcher.ts` | 60 s, 70 s lookahead | `article.publishedAt`, `articleRevision.publishedAt` | `invalidate('articles')` + `invalidateArticlePages(...)` |
| `PagePublicationWatcher` | `libs/page/api/src/lib/page-publication.watcher.ts` | 60 s, 70 s lookahead | `page.publishedAt`, `pageRevision.publishedAt` | `invalidate('pages')` |
| `EventScheduleWatcher` | `libs/event/api/src/lib/event-schedule.watcher.ts` | 60 s, 70 s lookahead | `event.startsAt`, `event.endsAt` | `invalidate()` — **no arguments**, because `'events'` is not a `PublicContent` value |

The events one, complete, is the closest precedent for date-driven invalidation of an event:

```ts
const LOOKAHEAD_MS = 70_000;

@Injectable()
export class EventScheduleWatcher implements OnApplicationBootstrap, OnModuleDestroy {
  private logger = new Logger('EventScheduleWatcher');
  private timers = new PublicationTimers();
  private coveredUntil?: Date;

  constructor(
    private prisma: PrismaClient,
    private publicContentCache: PublicContentCacheInvalidator
  ) {}

  onApplicationBootstrap() { return this.scheduleUpcoming(); }
  onModuleDestroy() { this.timers.clear(); }

  @Interval(60_000)
  async scheduleUpcoming() {
    const now = new Date();
    const until = new Date(now.getTime() + LOOKAHEAD_MS);
    const from = this.coveredUntil && this.coveredUntil < now ? this.coveredUntil : now;
    const window = { gt: from, lte: until };
    const inWindow = (date: Date | null): date is Date =>
      !!date && date > from && date <= until;

    try {
      const events = await this.prisma.event.findMany({
        where: { OR: [{ startsAt: window }, { endsAt: window }] },
        select: { startsAt: true, endsAt: true },
      });

      this.timers.schedule(
        events.flatMap(({ startsAt, endsAt }) => [startsAt, endsAt].filter(inWindow)),
        () => this.publicContentCache.invalidate()
      );

      this.coveredUntil = until;
    } catch (error) {
      this.logger.error(
        `Could not look up starting or ending events: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
```

`PublicationTimers` (`libs/kv-ttl-cache/api/src/lib/publication-timers.ts`), complete:

```ts
const CLOCK_DRIFT_MS = 2000;

const logger = new Logger('PublicationTimers');

export class PublicationTimers {
  private timers = new Map<number, ReturnType<typeof setTimeout>>();

  schedule(publications: Date[], run: () => Promise<void>) {
    for (const publication of publications) {
      const at = publication.getTime();

      if (this.timers.has(at)) { continue; }

      const timer = setTimeout(
        () => {
          this.timers.delete(at);
          run().catch(error =>
            logger.error(
              `Could not clear caches for a scheduled publication: ${
                error instanceof Error ? error.message : String(error)
              }`
            )
          );
        },
        Math.max(0, at - Date.now()) + CLOCK_DRIFT_MS
      );
      timer.unref?.();
      this.timers.set(at, timer);
    }
  }

  clear() {
    for (const timer of this.timers.values()) { clearTimeout(timer); }

    this.timers.clear();
  }
}
```

Deduplicates by timestamp, adds 2 s of clock drift, `unref()`s so a pending timer never holds the
process open.

There is also `PublicContentCacheInvalidator.invalidateAt(at, ...contents)`
(`libs/kv-ttl-cache/api/src/lib/graphql-response-cache.plugin.ts:248-259`), which is the same
mechanism available directly from a service without writing a watcher — it refuses anything further
out than `LONGEST_SCHEDULE_MS` (24 h).

### 17.2 `@Interval` drain jobs

```ts
/**
 * Safety net for the fire-and-forget drain triggered when a job is created:
 * re-drains queued jobs and continues jobs whose worker went away (e.g. an API
 * restart mid-send), picking up at the first recipient that was never mailed.
 */
@Injectable()
export class MailSendJobExecutor {
  private readonly logger = new Logger('MailSendJobExecutor');

  constructor(private mailSendJobService: MailSendJobService) {}

  @Interval(60_000)
  async handleInterval(): Promise<void> {
    try {
      await this.mailSendJobService.drain();
    } catch (error) {
      this.logger.error(`Mail send drain failed: ${(error as Error).message}`);
    }
  }
}
```

(`libs/membership/api/src/lib/mail-send/mail-send-job.executor.ts`, complete.) Pattern: work is
triggered eagerly when created, and the interval is a catch-up for crashed workers.

### 17.3 `@Cron` with distributed claiming

Two real cron jobs (plus the `slate-to-pm-migrator` which uses `@Cron` only inside its own spec
fixtures):

`libs/audit-log/api/src/lib/audit-log-retention.service.ts:36-51`:

```ts
  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'auditLogRetention' })
  async pruneNightly() {
    const claimed = await this.kv.claim('audit-log-retention', NIGHT_CLAIM_MS, {
      retryForMs: CLAIM_RETRY_FOR_MS,
    });

    if (claimed === undefined) {
      logger('audit-log').info(
        'Audit log retention runs on every replica: without Dragonfly (REDIS_URL unset or Dragonfly unreachable) nothing keeps it to one, and deleting old entries twice is harmless'
      );

      return this.pruneExpiredEntries();
    }

    return claimed ? this.pruneExpiredEntries() : 0;
  }
```

`libs/membership/api/src/lib/periodic-job/periodic-job.executor.ts:23-60`:

```ts
const SCHEDULE = process.env['PERIODIC_JOB_EXECUTION_SCHEDULE'] || '0 0 3 * * *';
const CLAIM_RETRY_FOR_MS = 60_000;

  @Cron(
    SCHEDULE,
    // Allow only chron that run once a day example: [number] [number] [number] [star] [star] [star]
    { disabled: !/[1-5]?[0-9] [1-5]?[0-9] [1-2]?[0-9] \* \* \*/.test(SCHEDULE) }
  )
  async handleCron() {
    const claimed = await this.kv.claim('nightly-job', NIGHT_CLAIM_MS, {
      retryForMs: CLAIM_RETRY_FOR_MS,
    });

    if (claimed === undefined) {
      if ((await this.kv.dragonflyStatus()) === 'not-configured') {
        this.logger.log(
          'No Dragonfly configured (REDIS_URL unset), the database makes sure only one replica runs the nightly job'
        );

        return this.runNight(() => this.periodicJobController.concurrentExecute());
      }

      this.logger.error(
        'Nightly job not run: Dragonfly is configured but unreachable, so nothing makes sure only one replica runs it. The next run catches up.'
      );

      return;
    }

    if (!claimed) {
      this.logger.log('Nightly job was claimed by another replica, skipping');

      return;
    }

    return this.runNight(() => this.periodicJobController.execute());
  }
```

`KvTtlCacheService.claim(name, ttlMs, {retryForMs})`
(`libs/kv-ttl-cache/api/src/lib/kv-ttl-cache.service.ts:835-855`) is **tri-state**: `true` = this
replica won, `false` = someone else holds it, `undefined` = no shared store, decide for yourself.
There is also `lock(name, ttlMs)` returning a `KvLock`, `isLocked(name)` and `increment(name, ttlMs)`.

### 17.4 DB-backed job records

`libs/membership/api/src/lib/periodic-job/` is the heavyweight pattern: a `PeriodicJob` Prisma model
records `executionTime`, `successfullyFinished`, `finishedWithError`; `isPeriodicJobRunning(job)`
decides whether a run is still in flight (`periodic-job.service.ts:61-79`); a KV lock (`RUN_LOCK`,
2 min TTL) protects the run itself; and a resolver (`periodic-job.resolver.ts`) exposes the state to
the editor so failed jobs can be retried. Use this when a job must be *observable* and *retryable*,
rather than merely periodic.

---

## 18. The caching contract every domain participates in

Not strictly module structure, but unavoidable: every list query, every entity read and every
mutation in the libs above touches `@wepublish/kv-ttl-cache/api`.

```ts
export type PublicContent =
  | 'articles' | 'pages' | 'authors' | 'images' | 'paywalls' | 'polls';

export const contentCacheNamespace = (content: PublicContent) => `content:${content}`;

export const CONTENT_CACHE_TTL_SECONDS = 300;
```

(`libs/kv-ttl-cache/api/src/lib/graphql-response-cache.plugin.ts:29-40`.) **`'events'` is not a
member.** The existing event code therefore calls `publicContentCache.invalidate()` with no
arguments, which flushes the whole public GraphQL response namespace.

`PublicContentCacheInvalidator` (`…plugin.ts:237-326`) offers:

| Method | Effect |
| --- | --- |
| `invalidate(...contents)` | `invalidateDraft(...)` then reset the public response namespace (twice, 3 s apart, to catch replicas) |
| `invalidateDraft(...contents)` | reset only `content:<x>` namespaces |
| `invalidateAt(at, ...contents)` | schedule an `invalidate` at a future date (≤ 24 h) |
| `invalidateArticlePages(...articles)` | reset the Next.js page cache for those article paths |
| `invalidateArticleAnswers(...)`, `invalidateArticleLayout()`, `invalidateNavigations()`, `invalidateComments(...)`, `invalidateReaderComments(...)` | narrower resets |

Whether a GraphQL query is cached at all is decided by a hard-coded allowlist
(`…plugin.ts:86-113`), which already contains `event` and `events`:

```ts
export const CACHEABLE_QUERIES = new Set([
  '__typename', 'article', 'articles', 'author', 'authors', 'commentsForItem',
  'event', 'events', 'getImagesByTag', 'hotAndTrending', 'memberPlans',
  'navigations', 'newSubscribers', 'page', 'pages', 'peer', 'peerProfile',
  'primaryBanner', 'ratingSystem', 'revenue', 'setting', 'settings', 'stats',
  'tag', 'tags', 'websiteSettings',
]);
```

A query selecting `draft` or `pending` is versioned by the drafts namespaces
(`…plugin.ts:127-131`), so preview responses are not served to the public.

---

## 19. Porting notes

Implications for the new events domain. These are inferences, not descriptions of existing code.

1. **Shape of the lib.** `libs/event/api` already exists with the right skeleton
   (`event.module.ts`, `event.model.ts`, `event.service.ts`, `event.resolver.ts`,
   `event-dataloader.service.ts`, `has-event/`, `event-schedule.watcher.ts`). The port is largely a
   rewrite of those files plus new ones (`event-revision-dataloader.service.ts`,
   `event-revision.resolver.ts`, `event-publication.watcher.ts`, an occurrence service), keeping the
   project name `event-api` and the alias `@wepublish/event/api`.

2. **Revisions.** Copy the article mechanism wholesale: an `EventRevision` table with
   `publishedAt` / `archivedAt`, three Postgres views
   (`events.revisions.published` / `.pending` / `.draft`, `SELECT DISTINCT ON ("eventId")` with
   `ORDER BY "eventId", "createdAt" DESC, id DESC`), a matching
   `@@index([eventId, createdAt(sort: Desc), id(sort: Desc)])`, and an
   `EventRevisionDataloaderService` returning `{draft, pending, published}` in one `findMany` with
   `relationLoadStrategy: 'join'`. The `draft`/`pending`/`published`/`latest` field resolvers and the
   `SHOW_PENDING_WHEN_NOT_PUBLISHED` fallback transfer unchanged.

3. **D5's `reviewRequestedAt`.** Placing it on the event entity (not the revision) is consistent with
   how `Article.publishedAt` lives on the entity while `ArticleRevision.publishedAt` lives on the
   revision, and it keeps the validation queue a single-table query — which is exactly the argument
   D5 makes. A `createEventFilter` clause `reviewRequested?: boolean →
   { reviewRequestedAt: filter.reviewRequested ? { not: null } : null }` matches
   `createChangelogEntryFilter`'s `confirmed` handling verbatim.

4. **Permissions.** The eight permissions in D4 go in `libs/permissions/src/lib/permissions.ts` as
   `Permission` objects, and are enforced with `@Permissions(CanX)` on resolver methods. The
   cross-organisation checks (`CanUpdateOtherOrganizationEvents`) cannot be expressed by the guard
   alone, because the guard sees no entity — they need an imperative
   `hasPermission(CanUpdateOtherOrganizationEvents, user.roles)` inside the service after loading the
   event's organisation, in the style of `ArticleRevisionResolver.properties`
   (`article-revision.resolver.ts:33-43`).

5. **Audit logging is free.** Because `AuditLogInterceptor` logs every mutation carrying
   `@Permissions`, `publishEvent` / `updateEvent` / `deleteEvent` / `requestEventReview` are recorded
   automatically — `requestEventReview` would derive action `other`, entity `EventReview`, so it wants
   an explicit `@AuditLogged({entity: 'Event', action: AuditLogAction.update})`.

6. **Caching.** `'events'` should be added to the `PublicContent` union so event mutations can call
   `invalidateDraft('events')` instead of flushing everything, and so an `EventDataloaderService`
   can use `contentCacheNamespace('events')`. Today it cannot.

7. **Occurrence recalculation.** Nothing in the repo recomputes derived rows on a schedule. The
   nearest precedents are (a) the `@Interval(60_000)` lookahead watchers, for "something becomes
   visible at time T", and (b) `PeriodicJobExecutor` + `kv.claim(name, ttlMs)`, for "one replica does
   the heavy work nightly". A recurrence expansion that must be idempotent and observable fits (b);
   invalidating caches when an occurrence starts fits (a). Both already exist — nothing new needs
   inventing. Note `kv.claim` returning `undefined` means "no Dragonfly", and both existing jobs
   choose to run anyway in that case.

8. **Scheduled publication.** `publishEvent(id, publishedAt)` should mirror `publishArticle`:
   unpublish future-dated revisions, compute the entity-level `publishedAt`, stamp the revision, then
   `publicationWatcher.schedule(publishedAt)`. The `EventScheduleWatcher` that exists today watches
   `startsAt`/`endsAt`, which is an orthogonal concern — the port needs **both**, probably as two
   `@Interval` methods on one watcher class.

9. **Validation.** Do not reach for `class-validator`; it is not installed. Anything beyond "required
   vs nullable" belongs either in a zod `Validator` class invoked from the service, or in explicit
   `BadRequestException` guards — e.g. `endsAt < startsAt`, an empty recurrence rule, or an
   occurrence count above a cap.

10. **Errors the editor must explain** (venue belongs to another organisation; event already
    published; no draft to discard) must be `BadRequestException`/`ForbiddenException` with real
    sentences, because `humanizeError` collapses anything Prisma-shaped into a generic
    "unexpected" message (`libs/ui/editor/src/lib/humanizeError.ts:29-31`).

11. **Tests first, three files minimum**: `event.service.spec.ts` (hand-rolled Prisma mock, fake
    timers, assert the `where`/`orderBy`/`take: n+1` passed to Prisma),
    `event.resolver.spec.ts` (`GraphQLModule.forRoot({autoSchemaFile: true})` + `supertest`,
    remembering guards do not run), and a spec per dataloader/watcher. `nx test event-api` is the
    command; `createVitestConfig({..., nest: true})` is non-negotiable.

12. **Editor and website documents.** Rewriting `libs/editor/api/src/lib/schemas/events.graphql` and
    `libs/website/api/src/lib/schemas/event.graphql` is part of the port, followed by
    `npm run generate-api`. Expect `FullEvent` to split into `EventWithoutBlocks` + `FullEvent`, as
    articles and pages did, so list views do not fetch block content.
