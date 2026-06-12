import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  CreatePageInput,
  PageFilter,
  PageListArgs,
  PageSort,
  UpdatePageInput,
} from './page.model';
import { PageDataloaderService } from './page-dataloader.service';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  mapDateFilterToPrisma,
  PrimeDataLoader,
  SortOrder,
} from '@wepublish/utils/api';
import { mapBlockUnionMap } from '@wepublish/block-content/api';

@Injectable()
export class PageService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(PageDataloaderService)
  async getPageBySlug(slug: string) {
    return this.prisma.page.findFirst({
      where: {
        slug: {
          equals: slug,
          mode: 'insensitive',
        },
      },
      orderBy: {
        publishedAt: 'asc', // there might be an unpublished page with the same slug
      },
    });
  }

  @PrimeDataLoader(PageDataloaderService)
  async getPages({
    filter,
    cursorId,
    sort = PageSort.PublishedAt,
    order = SortOrder.Descending,
    take = 10,
    skip,
  }: PageListArgs) {
    const orderBy = createPageOrder(sort, order);
    const where = createPageFilter(filter ?? {});

    const [totalCount, pages] = await Promise.all([
      this.prisma.page.count({
        where,
        orderBy,
      }),
      this.prisma.page.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = pages.slice(0, getMaxTake(take));
    const firstPage = nodes[0];
    const lastPage = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = pages.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstPage?.id,
        endCursor: lastPage?.id,
      },
    };
  }

  @PrimeDataLoader(PageDataloaderService)
  async createPage(
    { slug, hidden, tagIds, properties, blocks, ...revision }: CreatePageInput,
    userId: string | null | undefined
  ) {
    return this.prisma.page.create({
      data: {
        slug,
        hidden,
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
            blocks: blocks.map(mapBlockUnionMap) as any[],
            properties: properties as any,
          },
        },
      },
    });
  }

  @PrimeDataLoader(PageDataloaderService)
  async updatePage(
    {
      id,
      hidden,
      slug,
      tagIds,
      properties,
      blocks,
      ...revision
    }: UpdatePageInput,
    userId: string | null | undefined
  ) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: {
        tags: true,
      },
    });

    if (!page) {
      throw new NotFoundException(`Page with id ${id} not found`);
    }

    return this.prisma.page.update({
      where: { id },
      data: {
        slug,
        hidden,
        revisions: {
          updateMany: {
            where: {
              publishedAt: null,
              archivedAt: null,
            },
            data: {
              archivedAt: new Date(),
            },
          },
          create: {
            ...revision,
            userId,
            blocks: blocks.map(mapBlockUnionMap) as any[],
            properties: properties as any,
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
              .filter(tagId => !page.tags.some(tag => tag.tagId === tagId))
              .map(tagId => ({
                tagId,
              })),
          },
        },
      },
    });
  }

  async deletePage(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException(`Page with id ${id} not found`);
    }

    return this.prisma.page.delete({
      where: {
        id,
      },
    });
  }

  @PrimeDataLoader(PageDataloaderService)
  async publishPage(id: string, publishedAt: Date) {
    const page = await this.prisma.page.findUnique({
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

    if (!page?.revisions?.[0]) {
      throw new NotFoundException(`Page with id ${id} not found`);
    }

    // Unpublish existing pending revisions
    await this.prisma.pageRevision.updateMany({
      data: {
        publishedAt: null,
        archivedAt: new Date(),
      },
      where: {
        pageId: id,
        publishedAt: {
          gte: new Date(),
        },
      },
    });

    const pagePublishedAtInTheFuture =
      page.publishedAt && page.publishedAt > new Date();
    const newPublishedAtEarlier =
      page.publishedAt && page.publishedAt > publishedAt;

    const pagePublishedAt =
      pagePublishedAtInTheFuture || newPublishedAtEarlier ? publishedAt : (
        (page.publishedAt ?? publishedAt)
      );

    return this.prisma.page.update({
      where: {
        id,
      },
      data: {
        publishedAt: pagePublishedAt,
        modifiedAt: new Date(),
        revisions: {
          update: {
            where: {
              id: page.revisions[0].id,
            },
            data: {
              publishedAt,
            },
          },
        },
      },
    });
  }

  @PrimeDataLoader(PageDataloaderService)
  async unpublishPage(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException(`Page with id ${id} not found`);
    }

    const updatedPage = await this.prisma.page.update({
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

    if (updatedPage.revisions[0]) {
      // Latest revision should not be archived
      await this.prisma.pageRevision.update({
        where: {
          id: updatedPage.revisions[0].id,
        },
        data: {
          archivedAt: null,
        },
      });
    }

    return updatedPage;
  }

  @PrimeDataLoader(PageDataloaderService)
  async duplicatePage(id: string, userId: string | null | undefined) {
    const page = await this.prisma.page.findUnique({
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
        },
      },
    });

    if (!page?.revisions?.[0]) {
      throw new NotFoundException(`Page with id ${id} not found`);
    }

    const [
      {
        id: _id,
        createdAt: _createdAt,
        publishedAt: _publishedAt,
        pageId: _pageId,
        properties,
        ...revision
      },
    ] = page.revisions;

    return this.prisma.page.create({
      data: {
        hidden: page.hidden,
        tags: {
          createMany: {
            data: page.tags.map(({ tagId }) => ({
              tagId,
            })),
            skipDuplicates: true,
          },
        },
        revisions: {
          create: {
            ...revision,
            userId,
            blocks: revision.blocks ?? [],
            properties: properties as any,
          },
        },
      },
    });
  }

  /**
   * Returns the complete editor-facing revision history, including archived
   * drafts, so a past version can be inspected or restored without mutating it.
   */
  async getRevisions(pageId: string) {
    return this.prisma.pageRevision.findMany({
      where: {
        pageId,
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
  @PrimeDataLoader(PageDataloaderService)
  async restorePageRevision(
    pageId: string,
    revisionId: string,
    userId: string | null | undefined
  ) {
    const revision = await this.prisma.pageRevision.findUnique({
      where: { id: revisionId },
    });

    if (!revision || revision.pageId !== pageId) {
      throw new NotFoundException(
        `Revision with id ${revisionId} not found for page ${pageId}`
      );
    }

    const restoredRevision: Prisma.PageRevisionUncheckedCreateWithoutPageInput =
      {
        title: revision.title,
        description: revision.description,
        properties: revision.properties as Prisma.InputJsonValue,
        socialMediaTitle: revision.socialMediaTitle,
        socialMediaDescription: revision.socialMediaDescription,
        blocks: revision.blocks as Prisma.InputJsonValue,
        imageID: revision.imageID,
        socialMediaImageID: revision.socialMediaImageID,
        userId,
      };

    return this.prisma.page.update({
      where: { id: pageId },
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
  @PrimeDataLoader(PageDataloaderService)
  async discardPageDraft(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException(`Page with id ${id} not found`);
    }

    const draft = await this.prisma.pageRevision.findFirst({
      where: {
        pageId: id,
        publishedAt: null,
        archivedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!draft) {
      throw new BadRequestException(
        `Page with id ${id} has no draft to discard`
      );
    }

    const fallback = await this.prisma.pageRevision.findFirst({
      where: {
        pageId: id,
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
        `Cannot discard draft: page ${id} has no published version to revert to`
      );
    }

    await this.prisma.pageRevision.update({
      where: { id: draft.id },
      data: { archivedAt: new Date() },
    });

    return page;
  }

  async performPageFullTextSearch(searchQuery: string): Promise<string[]> {
    try {
      const foundPageIds = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT DISTINCT p.id
        FROM pages p
          JOIN public."pages.revisions" pr
            ON p."id" = pr."pageId"
            AND pr."publishedAt" IS NOT NULL
            AND pr."publishedAt" < NOW()
        WHERE to_tsvector('german', coalesce(pr.title, '')) ||
              to_tsvector('german', coalesce(pr.description, '')) ||
              jsonb_to_tsvector(
                'german',
                jsonb_path_query_array(pr.blocks, 'strict $.**.text'),
                '["string"]'
              ) @@ websearch_to_tsquery('german', ${searchQuery});
      `;

      return foundPageIds.map(item => item.id);
    } catch (error) {
      console.error('Error performing full-text search on pages:', error);
      return [];
    }
  }
}

export const createPageOrder = (
  field: PageSort,
  sortOrder: SortOrder
): Prisma.PageFindManyArgs['orderBy'] => {
  switch (field) {
    case PageSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case PageSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case PageSort.PublishedAt:
      return {
        publishedAt: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createTitleFilter = (
  filter: Partial<PageFilter>
): Prisma.PageWhereInput => {
  if (filter?.title) {
    const titleFilter: Prisma.PageRevisionWhereInput = {
      title: {
        contains: filter.title,
        mode: 'insensitive',
      },
    };

    return {
      PagesRevisionPublished:
        filter?.published ?
          {
            pageRevision: titleFilter,
          }
        : undefined,
      PagesRevisionDraft:
        filter?.draft ?
          {
            pageRevision: titleFilter,
          }
        : undefined,
      PagesRevisionPending:
        filter?.pending ?
          {
            pageRevision: titleFilter,
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

const createDescriptionFilter = (
  filter: Partial<PageFilter>
): Prisma.PageWhereInput => {
  if (filter?.description) {
    const descriptionFilter: Prisma.PageRevisionWhereInput = {
      description: {
        contains: filter.description,
        mode: 'insensitive',
      },
    };

    return {
      PagesRevisionPublished:
        filter?.published ?
          {
            pageRevision: descriptionFilter,
          }
        : undefined,
      PagesRevisionDraft:
        filter?.draft ?
          {
            pageRevision: descriptionFilter,
          }
        : undefined,
      PagesRevisionPending:
        filter?.pending ?
          {
            pageRevision: descriptionFilter,
          }
        : undefined,
      revisions:
        !filter?.draft && !filter?.published && !filter?.pending ?
          {
            some: descriptionFilter,
          }
        : undefined,
    };
  }

  return {};
};

const createPublicationDateFromFilter = (
  filter: Partial<PageFilter>
): Prisma.PageWhereInput => {
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
  filter: Partial<PageFilter>
): Prisma.PageWhereInput => {
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
  filter: Partial<PageFilter>
): Prisma.PageWhereInput => {
  if (filter?.published != null) {
    return {
      publishedAt:
        filter.published ? { lte: new Date() } : { not: { lte: new Date() } },
    };
  }

  return {};
};

const createDraftFilter = (
  filter: Partial<PageFilter>
): Prisma.PageWhereInput => {
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
  filter: Partial<PageFilter>
): Prisma.PageWhereInput => {
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

const createTagsFilter = (
  filter: Partial<PageFilter>
): Prisma.PageWhereInput => {
  if (filter?.tags?.length) {
    const hasTags = {
      some: {
        tag: {
          id: {
            in: filter.tags,
          },
        },
      },
    } satisfies Prisma.TaggedPagesListRelationFilter;

    return {
      tags: hasTags,
    };
  }

  return {};
};

const createHiddenFilter = (
  filter: Partial<PageFilter>
): Prisma.PageWhereInput => {
  if (filter?.includeHidden) {
    return {};
  }

  return {
    hidden: false,
  };
};

export const createPageFilter = (
  filter: Partial<PageFilter>
): Prisma.PageWhereInput => ({
  AND: [
    createTitleFilter(filter),
    createPublicationDateFromFilter(filter),
    createPublicationDateToFilter(filter),
    createDescriptionFilter(filter),
    createTagsFilter(filter),
    createHiddenFilter(filter),
    {
      OR: [
        createPublishedFilter(filter),
        createDraftFilter(filter),
        createPendingFilter(filter),
      ],
    },
  ],
});
