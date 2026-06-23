import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  ArticleFilter,
  ArticleListArgs,
  ArticleRevisionListArgs,
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

@Injectable()
export class ArticleService {
  constructor(
    private prisma: PrismaClient,
    private trackingPixelService: TrackingPixelService
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
  async getArticles({
    filter,
    cursorId,
    sort = ArticleSort.PublishedAt,
    order = SortOrder.Descending,
    take = 10,
    skip,
  }: ArticleListArgs) {
    if (filter?.body) {
      const articleIds = await this.performFullTextSearch(filter.body);

      if (articleIds.length && !filter.ids?.length) {
        filter.ids = articleIds;
      }
    }

    if (filter?.tags?.length) {
      const taggedArticles = await this.prisma.taggedArticles.findMany({
        where: { tagId: { in: filter.tags } },
        select: { articleId: true },
        distinct: ['articleId'],
      });

      const tagArticleIds = taggedArticles.map(ta => ta.articleId);
      filter.ids =
        filter.ids?.length ?
          filter.ids.filter(id => tagArticleIds.includes(id))
        : tagArticleIds;
      filter.tags = undefined;
    }

    const orderBy = createArticleOrder(sort, order);
    const where = createArticleFilter(filter ?? {});

    const [totalCount, articles] = await Promise.all([
      this.prisma.article.count({
        where,
        orderBy,
      }),
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
   * Returns a paginated, lightweight slice of an article's revisions for the
   * version history. Loading happens directly against the revisions table (not
   * through the article) so that articles with a long history (e.g. a start
   * page) can be paged through without fetching everything at once.
   */
  async getArticleRevisions({
    articleId,
    filter,
    order = SortOrder.Descending,
    take = 10,
    skip,
    cursorId,
  }: ArticleRevisionListArgs) {
    const where: Prisma.ArticleRevisionWhereInput = {
      articleId,
      ...(filter?.userId ? { userId: filter.userId } : {}),
    };

    const orderBy = {
      createdAt: graphQLSortOrderToPrisma(order),
    } satisfies Prisma.ArticleRevisionOrderByWithRelationInput;

    const [totalCount, revisions] = await Promise.all([
      this.prisma.articleRevision.count({ where }),
      this.prisma.articleRevision.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = revisions.slice(0, getMaxTake(take));
    const firstRevision = nodes[0];
    const lastRevision = nodes[nodes.length - 1];

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage: Boolean(skip),
        hasNextPage: revisions.length > nodes.length,
        startCursor: firstRevision?.id,
        endCursor: lastRevision?.id,
      },
    };
  }

  /**
   * Returns a single revision with all of its content. Used to lazily load the
   * full data of a past version (e.g. for the read-only preview), so the
   * version history list itself can stay lightweight.
   */
  async getRevisionById(id: string) {
    return this.prisma.articleRevision.findUnique({
      where: { id },
    });
  }

  /**
   * Restores an older revision by cloning its content into a brand new draft.
   *
   * This is non-destructive: no historic revision is mutated or deleted. Any
   * currently open (unpublished, non-archived) draft is archived first, exactly
   * like `updateArticle` does, so there is at most one draft at a time.
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

    const {
      id: _id,
      createdAt: _createdAt,
      publishedAt: _publishedAt,
      archivedAt: _archivedAt,
      userId: _userId,
      articleId: _articleId,
      properties,
      authors,
      socialMediaAuthors,
      ...content
    } = revision;

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
          create: {
            ...content,
            userId,
            blocks: (content.blocks ?? []) as any[],
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
   * Discards the current draft and reverts the article to its latest published
   * (or pending) revision. The draft is archived rather than deleted, so it
   * stays available in the version history. Requires a non-draft revision to
   * fall back to, otherwise the article would be left without a `latest`.
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
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.published != null) {
    return {
      publishedAt:
        filter.published ? { lte: new Date() } : { not: { lte: new Date() } },
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
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.pending != null) {
    return {
      revisions: {
        some: {
          publishedAt:
            filter.pending ? { gt: new Date() } : { not: { gt: new Date() } },
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
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => ({
  AND: [
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
    {
      OR: [
        createPublishedFilter(filter),
        createDraftFilter(filter),
        createPendingFilter(filter),
      ],
    },
  ],
});
