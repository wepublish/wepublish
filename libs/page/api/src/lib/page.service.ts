import {Injectable, NotFoundException} from '@nestjs/common'
import {Prisma, PrismaClient} from '@prisma/client'
import {PageFilter, PageListArgs, PageSort, CreatePageInput, UpdatePageInput} from './page.model'
import {PageDataloaderService} from './page-dataloader.service'
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  mapDateFilterToPrisma,
  PrimeDataLoader,
  SortOrder
} from '@wepublish/utils/api'
import {mapBlockUnionMap} from '@wepublish/block-content/api'

@Injectable()
export class PageService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(PageDataloaderService)
  async getPages({
    filter,
    cursorId,
    sort = PageSort.PublishedAt,
    order = SortOrder.Descending,
    take = 10,
    skip
  }: PageListArgs) {
    const orderBy = createPageOrder(sort, order)
    const where = createPageFilter(filter ?? {})

    const [totalCount, pages] = await Promise.all([
      this.prisma.page.count({
        where,
        orderBy
      }),
      this.prisma.page.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? {id: cursorId} : undefined
      })
    ])

    const nodes = pages.slice(0, take)
    const firstPage = nodes[0]
    const lastPage = nodes[nodes.length - 1]

    const hasPreviousPage = Boolean(skip)
    const hasNextPage = pages.length > nodes.length

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstPage?.id,
        endCursor: lastPage?.id
      }
    }
  }

  @PrimeDataLoader(PageDataloaderService)
  async createPage({slug, tagIds, properties, blocks, ...revision}: CreatePageInput) {
    return this.prisma.page.create({
      data: {
        slug,
        tags: {
          createMany: {
            data: tagIds.map(tagId => ({
              tagId
            })),
            skipDuplicates: true
          }
        },
        revisions: {
          create: {
            ...revision,
            blocks: blocks.map(mapBlockUnionMap) as any[],
            properties: {
              createMany: {
                data: properties
              }
            }
          }
        }
      }
    })
  }

  @PrimeDataLoader(PageDataloaderService)
  async updatePage({id, slug, tagIds, properties, blocks, ...revision}: UpdatePageInput) {
    const page = await this.prisma.page.findUnique({
      where: {id},
      include: {
        tags: true
      }
    })

    if (!page) {
      throw new NotFoundException(`Page with id ${id} not found`)
    }

    return this.prisma.page.update({
      where: {id},
      data: {
        slug,
        revisions: {
          create: {
            ...revision,
            blocks: blocks.map(mapBlockUnionMap) as any[],
            properties: {
              createMany: {
                data: properties.map(property => ({
                  key: property.key,
                  value: property.value,
                  public: property.public
                }))
              }
            }
          }
        },
        tags: {
          deleteMany: {
            tagId: {
              notIn: tagIds
            }
          },
          createMany: {
            data: tagIds
              .filter(tagId => !page.tags.some(tag => tag.tagId === tagId))
              .map(tagId => ({
                tagId
              }))
          }
        }
      }
    })
  }

  async deletePage(id: string) {
    const page = await this.prisma.page.findUnique({
      where: {id}
    })

    if (!page) {
      throw new NotFoundException(`Page with id ${id} not found`)
    }

    return this.prisma.page.delete({
      where: {
        id
      }
    })
  }

  @PrimeDataLoader(PageDataloaderService)
  async publishPage(id: string, publishedAt: Date) {
    const page = await this.prisma.page.findUnique({
      where: {id},
      include: {
        revisions: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!page?.revisions?.[0]) {
      throw new NotFoundException(`Page with id ${id} not found`)
    }

    // @TODO: Unpublish future (based on input publishedAt) revisions
    return this.prisma.page.update({
      where: {
        id
      },
      data: {
        publishedAt: page.publishedAt ?? publishedAt,
        modifiedAt: new Date(),
        revisions: {
          update: {
            where: {
              id: page.revisions[0].id
            },
            data: {
              publishedAt
            }
          }
        }
      }
    })
  }

  @PrimeDataLoader(PageDataloaderService)
  async unpublishPage(id: string) {
    const page = await this.prisma.page.findUnique({
      where: {id}
    })

    if (!page) {
      throw new NotFoundException(`Page with id ${id} not found`)
    }

    return this.prisma.page.update({
      where: {
        id
      },
      data: {
        publishedAt: null,
        revisions: {
          updateMany: {
            where: {
              publishedAt: {
                not: null
              }
            },
            data: {
              publishedAt: null
            }
          }
        }
      }
    })
  }

  @PrimeDataLoader(PageDataloaderService)
  async duplicatePage(id: string) {
    const page = await this.prisma.page.findUnique({
      where: {
        id
      },
      include: {
        tags: true,
        revisions: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            properties: true
          }
        }
      }
    })

    if (!page?.revisions?.[0]) {
      throw new NotFoundException(`Page with id ${id} not found`)
    }

    const [{id: _id, createdAt: _createdAt, publishedAt: _publishedAt, properties, ...revision}] =
      page.revisions

    return this.prisma.page.create({
      data: {
        tags: {
          createMany: {
            data: page.tags.map(({tagId}) => ({
              tagId
            })),
            skipDuplicates: true
          }
        },
        revisions: {
          create: {
            ...revision,
            blocks: revision.blocks || Prisma.JsonNull,
            properties: {
              createMany: {
                data: properties.map(property => ({
                  key: property.key,
                  value: property.value,
                  public: property.public
                }))
              }
            }
          }
        }
      }
    })
  }

  async getTagIds(pageId: string) {
    return this.prisma.tag.findMany({
      select: {
        id: true
      },
      where: {
        pages: {
          some: {
            pageId
          }
        }
      }
    })
  }
}

export const createPageOrder = (
  field: PageSort,
  sortOrder: SortOrder
): Prisma.PageFindManyArgs['orderBy'] => {
  switch (field) {
    case PageSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder)
      }

    case PageSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder)
      }

    case PageSort.PublishedAt:
      return {
        publishedAt: graphQLSortOrderToPrisma(sortOrder)
      }
  }
}

const createTitleFilter = (filter: Partial<PageFilter>): Prisma.PageWhereInput => {
  if (filter?.title) {
    return {
      revisions: {
        some: {
          title: {
            contains: filter.title,
            mode: 'insensitive'
          }
        }
      }
    }
  }

  return {}
}

const createDescriptionFilter = (filter: Partial<PageFilter>): Prisma.PageWhereInput => {
  if (filter?.description) {
    return {
      revisions: {
        some: {
          description: {
            contains: filter.description,
            mode: 'insensitive'
          }
        }
      }
    }
  }

  return {}
}

const createPublicationDateFromFilter = (filter: Partial<PageFilter>): Prisma.PageWhereInput => {
  if (filter?.publicationDateFrom) {
    const {comparison, date} = filter.publicationDateFrom
    const compare = mapDateFilterToPrisma(comparison)

    return {
      publishedAt: {
        [compare]: date
      }
    }
  }

  return {}
}

const createPublicationDateToFilter = (filter: Partial<PageFilter>): Prisma.PageWhereInput => {
  if (filter?.publicationDateTo) {
    const {comparison, date} = filter.publicationDateTo
    const compare = mapDateFilterToPrisma(comparison)

    return {
      publishedAt: {
        [compare]: date
      }
    }
  }

  return {}
}

const createPublishedFilter = (filter: Partial<PageFilter>): Prisma.PageWhereInput => {
  if (filter?.published != null) {
    return {
      revisions: {
        some: {
          publishedAt: filter.published ? {lte: new Date()} : {not: {lte: new Date()}}
        }
      }
    }
  }

  return {}
}

const createDraftFilter = (filter: Partial<PageFilter>): Prisma.PageWhereInput => {
  if (filter?.draft != null) {
    return {
      revisions: {
        some: {
          publishedAt: filter.draft ? null : {not: null}
        }
      }
    }
  }

  return {}
}

const createPendingFilter = (filter: Partial<PageFilter>): Prisma.PageWhereInput => {
  if (filter?.pending != null) {
    return {
      revisions: {
        some: {
          publishedAt: filter.pending ? {gt: new Date()} : {not: {gt: new Date()}}
        }
      }
    }
  }

  return {}
}

const createTagsFilter = (filter: Partial<PageFilter>): Prisma.PageWhereInput => {
  if (filter?.tags?.length) {
    const hasTags = {
      some: {
        tag: {
          id: {
            in: filter.tags
          }
        }
      }
    } satisfies Prisma.TaggedPagesListRelationFilter

    return {
      tags: hasTags
    }
  }

  return {}
}

export const createPageFilter = (filter: Partial<PageFilter>): Prisma.PageWhereInput => ({
  AND: [
    createTitleFilter(filter),
    createPublicationDateFromFilter(filter),
    createPublicationDateToFilter(filter),
    createDescriptionFilter(filter),
    createTagsFilter(filter),
    {
      OR: [createPublishedFilter(filter), createDraftFilter(filter), createPendingFilter(filter)]
    }
  ]
})
