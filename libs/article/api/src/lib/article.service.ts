import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  ArticleFilter,
  ArticleListArgs,
  ArticleSort,
  CreateArticleInput,
  UpdateArticleInput,
} from './article.model';
import { ArticleDataloaderService } from './article-dataloader.service';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  mapDateFilterToPrisma,
  PrimeDataLoader,
  SortOrder,
} from '@wepublish/utils/api';
import { mapBlockUnionMap } from '@wepublish/block-content/api';
import { TrackingPixelService } from '@wepublish/tracking-pixel/api';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';

export type ArticleListOptions = {
  skipTotalCount?: boolean;
  skipCache?: boolean;
  cacheTtlSeconds?: number;
};

@Injectable()
export class ArticleService {
  constructor(
    private prisma: PrismaClient,
    private trackingPixelService: TrackingPixelService,
    @Optional()
    private kv?: KvTtlCacheService
  ) {}

  @PrimeDataLoader(ArticleDataloaderService)
  async getArticleBySlug(slug: string) {
    return this.prisma.article.findFirst({
      where: {
        slug: {
          equals: slug,
          mode: 'insensitive',
        },
      },
      orderBy: {
        publishedAt: 'asc', // there might be an unpublished article with the same slug
      },
    });
  }

  @PrimeDataLoader(ArticleDataloaderService)
  async getArticles(
    {
      filter,
      cursorId,
      sort = ArticleSort.PublishedAt,
      order = SortOrder.Descending,
      take = 10,
      skip,
    }: ArticleListArgs,
    options: ArticleListOptions = {}
  ) {
    const effectiveFilter = { ...filter };

    if (effectiveFilter.body) {
      const articleIds = await this.performFullTextSearch(effectiveFilter.body);

      if (effectiveFilter.ids?.length) {
        effectiveFilter.ids = effectiveFilter.ids.filter(id =>
          articleIds.includes(id)
        );
      } else {
        effectiveFilter.ids = articleIds;
      }
    }

    const orderBy = createArticleOrder(sort, order);
    const now = createFilterClock(options);
    const where = createArticleFilter(effectiveFilter, now);
    const maxTake = getMaxTake(take);
    const articlesArgs = {
      where,
      skip,
      take: maxTake + 1,
      orderBy,
      cursor: cursorId ? { id: cursorId } : undefined,
    } satisfies Prisma.ArticleFindManyArgs;
    const cacheKey = createArticleListCacheKey({
      where,
      skip,
      take: maxTake,
      orderBy,
      cursorId,
    });

    const [totalCount, articles] = await Promise.all([
      options.skipTotalCount ?
        Promise.resolve(0)
      : this.getCachedOrLoad(`${cacheKey}:count`, options, () =>
          this.prisma.article.count({
            where,
            orderBy,
          })
        ),
      this.getCachedOrLoad(`${cacheKey}:nodes`, options, () =>
        this.prisma.article.findMany(articlesArgs)
      ),
    ]);

    const nodes = articles.slice(0, maxTake);
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

  private getCachedOrLoad<T>(
    key: string,
    options: ArticleListOptions,
    loader: () => Promise<T>
  ) {
    if (!options.cacheTtlSeconds || options.skipCache || !this.kv) {
      return loader();
    }

    return this.kv.getOrLoadNs<T>(
      'article-list',
      key,
      loader,
      options.cacheTtlSeconds
    );
  }

  @PrimeDataLoader(ArticleDataloaderService)
  async createArticle(
    {
      slug,
      shared,
      hidden,
      likes,
      disableComments,
      authorIds,
      socialMediaAuthorIds,
      tagIds,
      properties,
      blocks,
      paywallId,
      ...revision
    }: CreateArticleInput,
    userId: string | null | undefined
  ) {
    const mappedBlocks = blocks.map(mapBlockUnionMap);

    const article = await this.prisma.article.create({
      data: {
        paywallId,
        likes,
        slug,
        shared,
        hidden,
        disableComments,
        tags: {
          createMany: {
            data: tagIds.map(tagId => ({
              tagId,
            })),
            skipDuplicates: true,
          },
        },
        revisions: {
          create: {
            ...revision,
            userId,
            blocks: mappedBlocks as any[],
            properties: properties as any,
            authors: {
              createMany: {
                data: authorIds.map(authorId => ({ authorId })),
              },
            },
            socialMediaAuthors: {
              createMany: {
                data: socialMediaAuthorIds.map(authorId => ({ authorId })),
              },
            },
          },
        },
      },
    });

    if (!article.peerId) {
      const trackingPixels = await this.trackingPixelService.getArticlePixels(
        article.id
      );
      await this.prisma.articleTrackingPixels.createMany({
        data: trackingPixels,
      });
    }

    return article;
  }

  @PrimeDataLoader(ArticleDataloaderService)
  async updateArticle(
    {
      id,
      likes,
      slug,
      shared,
      paywallId,
      hidden,
      disableComments,
      authorIds,
      socialMediaAuthorIds,
      tagIds,
      properties,
      blocks,
      ...revision
    }: UpdateArticleInput,
    userId: string | null | undefined
  ) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        tags: true,
      },
    });

    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    const mappedBlocks = blocks.map(mapBlockUnionMap);

    return this.prisma.article.update({
      where: { id },
      data: {
        likes,
        slug,
        paywallId,
        shared,
        hidden,
        disableComments,
        revisions: {
          updateMany: {
            where: {
              archivedAt: null,
              publishedAt: null,
            },
            data: {
              archivedAt: new Date(),
            },
          },
          create: {
            ...revision,
            blocks: mappedBlocks as any[],
            userId,
            properties: properties as any,
            authors: {
              createMany: {
                data: authorIds.map(authorId => ({ authorId })),
              },
            },
            socialMediaAuthors: {
              createMany: {
                data: socialMediaAuthorIds.map(authorId => ({ authorId })),
              },
            },
          },
        },
        tags: {
          deleteMany: {
            tagId: {
              notIn: tagIds,
            },
          },
          createMany: {
            data: tagIds
              .filter(tagId => !article.tags.some(tag => tag.tagId === tagId))
              .map(tagId => ({
                tagId,
              })),
          },
        },
      },
    });
  }

  async deleteArticle(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    return this.prisma.article.delete({
      where: {
        id,
      },
    });
  }

  @PrimeDataLoader(ArticleDataloaderService)
  async publishArticle(id: string, publishedAt: Date) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        revisions: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!article?.revisions?.[0]) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    // Unpublish existing pending revisions
    await this.prisma.articleRevision.updateMany({
      data: {
        publishedAt: null,
        archivedAt: new Date(),
      },
      where: {
        articleId: id,
        publishedAt: {
          gte: new Date(),
        },
      },
    });

    const articlePublishedAtInTheFuture =
      article.publishedAt && article.publishedAt > new Date();
    const newPublishedAtEarlier =
      article.publishedAt && article.publishedAt > publishedAt;

    const articlePublishedAt =
      articlePublishedAtInTheFuture || newPublishedAtEarlier ? publishedAt : (
        (article.publishedAt ?? publishedAt)
      );

    return this.prisma.article.update({
      where: {
        id,
      },
      data: {
        publishedAt: articlePublishedAt,
        modifiedAt: new Date(),
        revisions: {
          update: {
            where: {
              id: article.revisions[0].id,
            },
            data: {
              publishedAt,
            },
          },
        },
      },
    });
  }

  @PrimeDataLoader(ArticleDataloaderService)
  async unpublishArticle(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    const updatedArticle = await this.prisma.article.update({
      where: {
        id,
      },
      data: {
        publishedAt: null,
        revisions: {
          updateMany: {
            where: {
              publishedAt: {
                not: null,
              },
            },
            data: {
              publishedAt: null,
              archivedAt: new Date(),
            },
          },
        },
      },
      include: {
        revisions: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (updatedArticle.revisions[0]) {
      // Latest revision should not be archived
      await this.prisma.articleRevision.update({
        where: {
          id: updatedArticle.revisions[0].id,
        },
        data: {
          archivedAt: null,
        },
      });
    }

    return updatedArticle;
  }

  @PrimeDataLoader(ArticleDataloaderService)
  async duplicateArticle(id: string, userId: string | null | undefined) {
    const article = await this.prisma.article.findUnique({
      where: {
        id,
      },
      include: {
        tags: true,
        revisions: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            authors: true,
            socialMediaAuthors: true,
          },
        },
      },
    });

    if (!article?.revisions?.[0]) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    const [
      {
        id: _id,
        createdAt: _createdAt,
        publishedAt: _publishedAt,
        userId: _userId,
        articleId: _articleId,
        properties,
        authors,
        socialMediaAuthors,
        ...revision
      },
    ] = article.revisions;

    return this.prisma.article.create({
      data: {
        paywallId: article.paywallId,
        shared: article.shared,
        hidden: article.hidden,
        disableComments: article.disableComments,
        tags: {
          createMany: {
            data: article.tags.map(({ tagId }) => ({
              tagId,
            })),
            skipDuplicates: true,
          },
        },
        revisions: {
          create: {
            ...revision,
            userId,
            blocks: revision.blocks || [],
            properties: properties as any,
            authors: {
              createMany: {
                data: authors.map(({ authorId }) => ({ authorId })),
              },
            },
            socialMediaAuthors: {
              createMany: {
                data: socialMediaAuthors.map(({ authorId }) => ({ authorId })),
              },
            },
          },
        },
      },
    });
  }

  /**
   * Returns the complete editor-facing revision history, including archived
   * drafts, so a past version can be inspected or restored without mutating it.
   */
  async getRevisions(articleId: string) {
    return this.prisma.articleRevision.findMany({
      where: {
        articleId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Restores a historical revision by cloning its content into a new draft.
   * Existing open drafts are archived first to preserve the one-draft invariant.
   */
  @PrimeDataLoader(ArticleDataloaderService)
  async restoreArticleRevision(
    articleId: string,
    revisionId: string,
    userId: string | null | undefined
  ) {
    const revision = await this.prisma.articleRevision.findUnique({
      where: { id: revisionId },
      include: {
        authors: true,
        socialMediaAuthors: true,
      },
    });

    if (!revision || revision.articleId !== articleId) {
      throw new NotFoundException(
        `Revision with id ${revisionId} not found for article ${articleId}`
      );
    }

    const restoredRevision: Prisma.ArticleRevisionUncheckedCreateWithoutArticleInput =
      {
        preTitle: revision.preTitle,
        title: revision.title,
        lead: revision.lead,
        seoTitle: revision.seoTitle,
        canonicalUrl: revision.canonicalUrl,
        properties: revision.properties as Prisma.InputJsonValue,
        breaking: revision.breaking,
        blocks: revision.blocks as Prisma.InputJsonValue,
        hideAuthor: revision.hideAuthor,
        socialMediaTitle: revision.socialMediaTitle,
        socialMediaDescription: revision.socialMediaDescription,
        imageID: revision.imageID,
        socialMediaImageID: revision.socialMediaImageID,
        userId,
        authors: {
          createMany: {
            data: revision.authors.map(({ authorId }) => ({ authorId })),
          },
        },
        socialMediaAuthors: {
          createMany: {
            data: revision.socialMediaAuthors.map(({ authorId }) => ({
              authorId,
            })),
          },
        },
      };

    return this.prisma.article.update({
      where: { id: articleId },
      data: {
        modifiedAt: new Date(),
        revisions: {
          updateMany: {
            where: {
              archivedAt: null,
              publishedAt: null,
            },
            data: {
              archivedAt: new Date(),
            },
          },
          create: restoredRevision,
        },
      },
    });
  }

  /**
   * Archives the current draft only when a non-draft revision remains available
   * for preview/latest resolution. Historic content is never deleted.
   */
  @PrimeDataLoader(ArticleDataloaderService)
  async discardArticleDraft(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    const draft = await this.prisma.articleRevision.findFirst({
      where: {
        articleId: id,
        publishedAt: null,
        archivedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!draft) {
      throw new BadRequestException(
        `Article with id ${id} has no draft to discard`
      );
    }

    const fallback = await this.prisma.articleRevision.findFirst({
      where: {
        articleId: id,
        archivedAt: null,
        publishedAt: {
          not: null,
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    if (!fallback) {
      throw new BadRequestException(
        `Cannot discard draft: article ${id} has no published version to revert to`
      );
    }

    await this.prisma.articleRevision.update({
      where: { id: draft.id },
      data: { archivedAt: new Date() },
    });

    return article;
  }

  @PrimeDataLoader(ArticleDataloaderService)
  async likeArticle(id: string) {
    return this.prisma.article.update({
      where: {
        id,
      },
      data: {
        likes: {
          increment: 1,
        },
      },
    });
  }

  @PrimeDataLoader(ArticleDataloaderService)
  async dislikeArticle(id: string) {
    const article = await this.prisma.article.findUnique({
      where: {
        id,
      },
    });

    if (!article?.likes) {
      return article;
    }

    return this.prisma.article.update({
      where: {
        id,
      },
      data: {
        likes: {
          decrement: 1,
        },
      },
    });
  }

  async performFullTextSearch(searchQuery: string): Promise<string[]> {
    try {
      const foundArticleIds = await this.prisma.$queryRaw<
        Array<{ id: string }>
      >`
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
}

export const createArticleOrder = (
  field: ArticleSort,
  sortOrder: SortOrder
): Prisma.ArticleFindManyArgs['orderBy'] => {
  switch (field) {
    case ArticleSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case ArticleSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case ArticleSort.PublishedAt:
      return {
        publishedAt: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createArticleListCacheKey = (value: unknown) =>
  JSON.stringify(value, (_, item) => {
    if (item instanceof Date) {
      return item.toISOString();
    }

    return item;
  });

const createFilterClock = (options: ArticleListOptions) => {
  const now = new Date();

  if (!options.cacheTtlSeconds || options.skipCache) {
    return now;
  }

  const ttlMs = Math.max(1, options.cacheTtlSeconds) * 1000;

  return new Date(Math.floor(now.getTime() / ttlMs) * ttlMs);
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && value.constructor === Object;

const isEmptyPrismaFilter = (value: unknown): boolean =>
  isPlainObject(value) && Object.keys(value).length === 0;

const cleanPrismaFilter = (value: unknown, parentKey?: string): unknown => {
  if (Array.isArray(value)) {
    const cleanedItems = value
      .map(item => cleanPrismaFilter(item, parentKey))
      .filter(item => !isEmptyPrismaFilter(item));

    return parentKey === 'AND' || parentKey === 'OR' || parentKey === 'NOT' ?
        cleanedItems
      : value;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [key, cleanPrismaFilter(item, key)] as const)
      .filter(([key, item]) => {
        if (item === undefined) {
          return false;
        }

        if (isEmptyPrismaFilter(item)) {
          return false;
        }

        if (
          Array.isArray(item) &&
          item.length === 0 &&
          (key === 'AND' || key === 'OR' || key === 'NOT')
        ) {
          return false;
        }

        return true;
      })
  );
};

const cleanArticleWhereInput = (
  value: Prisma.ArticleWhereInput
): Prisma.ArticleWhereInput =>
  cleanPrismaFilter(value) as Prisma.ArticleWhereInput;

const createIdsFilter = (
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.ids) {
    return {
      id: {
        in: filter.ids,
      },
    };
  }

  return {};
};

const createTitleFilter = (
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.title) {
    const titleFilter: Prisma.ArticleRevisionWhereInput = {
      title: {
        contains: filter.title,
        mode: 'insensitive',
      },
    };

    return {
      ArticleRevisionPublished:
        filter?.published ?
          {
            articleRevision: titleFilter,
          }
        : undefined,
      ArticleRevisionDraft:
        filter?.draft ?
          {
            articleRevision: titleFilter,
          }
        : undefined,
      ArticleRevisionPending:
        filter?.pending ?
          {
            articleRevision: titleFilter,
          }
        : undefined,
      revisions:
        !filter?.draft && !filter?.published && !filter?.pending ?
          {
            some: titleFilter,
          }
        : undefined,
    };
  }
  return {};
};

const createPreTitleFilter = (
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.preTitle) {
    const preTitleFilter: Prisma.ArticleRevisionWhereInput = {
      preTitle: {
        contains: filter.preTitle,
        mode: 'insensitive',
      },
    };

    return {
      ArticleRevisionPublished:
        filter?.published ?
          {
            articleRevision: preTitleFilter,
          }
        : undefined,
      ArticleRevisionDraft:
        filter?.draft ?
          {
            articleRevision: preTitleFilter,
          }
        : undefined,
      ArticleRevisionPending:
        filter?.pending ?
          {
            articleRevision: preTitleFilter,
          }
        : undefined,
      revisions:
        !filter?.draft && !filter?.published && !filter?.pending ?
          {
            some: preTitleFilter,
          }
        : undefined,
    };
  }

  return {};
};

const createLeadFilter = (
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.lead) {
    const leadFilter: Prisma.ArticleRevisionWhereInput = {
      lead: {
        contains: filter.lead,
        mode: 'insensitive',
      },
    };

    return {
      ArticleRevisionPublished:
        filter?.published ?
          {
            articleRevision: leadFilter,
          }
        : undefined,
      ArticleRevisionDraft:
        filter?.draft ?
          {
            articleRevision: leadFilter,
          }
        : undefined,
      ArticleRevisionPending:
        filter?.pending ?
          {
            articleRevision: leadFilter,
          }
        : undefined,
      revisions:
        !filter?.draft && !filter?.published && !filter?.pending ?
          {
            some: leadFilter,
          }
        : undefined,
    };
  }

  return {};
};

const createPublicationDateFromFilter = (
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.publicationDateFrom) {
    const { comparison, date } = filter.publicationDateFrom;
    const compare = mapDateFilterToPrisma(comparison);

    return {
      publishedAt: {
        [compare]: date,
      },
    };
  }

  return {};
};

const createPublicationDateToFilter = (
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.publicationDateTo) {
    const { comparison, date } = filter.publicationDateTo;
    const compare = mapDateFilterToPrisma(comparison);

    return {
      publishedAt: {
        [compare]: date,
      },
    };
  }

  return {};
};

const createPublishedFilter = (
  filter: Partial<ArticleFilter>,
  now: Date
): Prisma.ArticleWhereInput => {
  if (filter?.published != null) {
    return {
      publishedAt: filter.published ? { lte: now } : { not: { lte: now } },
    };
  }

  return {};
};

const createDraftFilter = (
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.draft != null) {
    return {
      revisions: {
        some: {
          publishedAt: filter.draft ? null : { not: null },
          archivedAt: null,
        },
      },
    };
  }

  return {};
};

const createPendingFilter = (
  filter: Partial<ArticleFilter>,
  now: Date
): Prisma.ArticleWhereInput => {
  if (filter?.pending != null) {
    return {
      revisions: {
        some: {
          publishedAt: filter.pending ? { gt: now } : { not: { gt: now } },
        },
      },
    };
  }

  return {};
};

const createSharedFilter = (
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.shared != null) {
    return {
      shared: filter.shared,
    };
  }

  return {};
};

const createTagsFilter = (
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.tags?.length) {
    const hasTags = {
      some: {
        tag: {
          id: {
            in: filter.tags,
          },
        },
      },
    } satisfies Prisma.TaggedArticlesListRelationFilter;

    return {
      tags: hasTags,
    };
  }

  return {};
};

const createTagsNotInFilter = (
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.tagsNotIn?.length) {
    const hasNotTags = {
      some: {
        tag: {
          id: {
            notIn: filter.tagsNotIn,
          },
        },
      },
    } satisfies Prisma.TaggedArticlesListRelationFilter;

    return {
      tags: hasNotTags,
    };
  }

  return {};
};

const createAuthorFilter = (
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.authors) {
    const authorFilter: Prisma.ArticleRevisionWhereInput = {
      authors: {
        some: {
          authorId: {
            in: filter.authors,
          },
        },
      },
    };

    return {
      ArticleRevisionPublished:
        filter?.published ?
          {
            articleRevision: authorFilter,
          }
        : undefined,
      ArticleRevisionDraft:
        filter?.draft ?
          {
            articleRevision: authorFilter,
          }
        : undefined,
      ArticleRevisionPending:
        filter?.pending ?
          {
            articleRevision: authorFilter,
          }
        : undefined,
      revisions:
        !filter?.draft && !filter?.published && !filter?.pending ?
          {
            some: authorFilter,
          }
        : undefined,
    };
  }

  return {};
};

const createHiddenFilter = (
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.includeHidden) {
    return {};
  }

  return {
    hidden: false,
  };
};

const createPeerIdFilter = (
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.peerId) {
    return {
      peerId: filter.peerId,
    };
  }

  return {};
};

const createExcludeIdsFilter = (
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.excludeIds) {
    return {
      id: {
        notIn: filter.excludeIds,
      },
    };
  }

  return {};
};

export const createArticleFilter = (
  filter: Partial<ArticleFilter>,
  now = new Date()
): Prisma.ArticleWhereInput => {
  const statusFilters = [
    createPublishedFilter(filter, now),
    createDraftFilter(filter),
    createPendingFilter(filter, now),
  ]
    .map(cleanArticleWhereInput)
    .filter(item => !isEmptyPrismaFilter(item));

  const filters = [
    createIdsFilter(filter),
    createTitleFilter(filter),
    createPreTitleFilter(filter),
    createPublicationDateFromFilter(filter),
    createPublicationDateToFilter(filter),
    createLeadFilter(filter),
    createSharedFilter(filter),
    createTagsFilter(filter),
    createTagsNotInFilter(filter),
    createAuthorFilter(filter),
    createHiddenFilter(filter),
    createPeerIdFilter(filter),
    createExcludeIdsFilter(filter),
    statusFilters.length ? { OR: statusFilters } : {},
  ]
    .map(cleanArticleWhereInput)
    .filter(item => !isEmptyPrismaFilter(item));

  return filters.length ? { AND: filters } : {};
};
