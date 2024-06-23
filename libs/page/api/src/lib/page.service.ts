import {Injectable} from '@nestjs/common'
import {Prisma, PrismaClient} from '@prisma/client'
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  mapDateFilterToPrisma,
  SortOrder
} from '@wepublish/utils/api'
import {PageDataloader} from './page.dataloader'
import {
  GetPagesArgs,
  GetPublishedPagesArgs,
  PageFilter,
  PageInput,
  PageSort,
  PublishPageInput
} from './page.model'
import {mapBlockInputToPrisma} from '@wepublish/block-content/api'
import {UserInputError} from '@nestjs/apollo'

export const createPageOrder = (
  field: PageSort,
  sortOrder: SortOrder = SortOrder.Ascending
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
        published: {
          publishedAt: graphQLSortOrderToPrisma(sortOrder)
        }
      }

    case PageSort.UpdatedAt:
      return {
        published: {
          updatedAt: graphQLSortOrderToPrisma(sortOrder)
        }
      }

    case PageSort.PublishAt:
      return {
        pending: {
          publishAt: graphQLSortOrderToPrisma(sortOrder)
        }
      }
  }
}

const createTitleFilter = (filter: Partial<PageFilter>): Prisma.PageWhereInput => {
  if (filter?.title) {
    const containsTitle: Prisma.PageRevisionWhereInput = {
      title: {
        contains: filter.title,
        mode: 'insensitive'
      }
    }

    return {
      OR: [{draft: containsTitle}, {pending: containsTitle}, {published: containsTitle}]
    }
  }

  return {}
}

const createDescriptionFilter = (filter: Partial<PageFilter>): Prisma.PageWhereInput => {
  if (filter?.description) {
    const containsDescription: Prisma.PageRevisionWhereInput = {
      description: {
        contains: filter.description,
        mode: 'insensitive'
      }
    }

    return {
      OR: [
        {draft: containsDescription},
        {pending: containsDescription},
        {published: containsDescription}
      ]
    }
  }

  return {}
}

const createPublicationDateFromFilter = (filter: Partial<PageFilter>): Prisma.PageWhereInput => {
  if (filter?.publicationDateFrom) {
    const {comparison, date} = filter.publicationDateFrom
    const compare = mapDateFilterToPrisma(comparison)

    const filterBy: Prisma.PageRevisionWhereInput = {
      publishedAt: {
        [compare]: date
      }
    }
    return {
      AND: [{published: filterBy}]
    }
  }

  return {}
}

const createPublicationDateToFilter = (filter: Partial<PageFilter>): Prisma.PageWhereInput => {
  if (filter?.publicationDateTo) {
    const {comparison, date} = filter.publicationDateTo
    const compare = mapDateFilterToPrisma(comparison)

    const filterBy: Prisma.PageRevisionWhereInput = {
      publishedAt: {
        [compare]: date
      }
    }
    return {
      AND: [{published: filterBy}]
    }
  }

  return {}
}

const createPublishedFilter = (filter: Partial<PageFilter>): Prisma.PageWhereInput => {
  if (filter?.published != null) {
    return {
      published: filter.published
        ? {
            isNot: null
          }
        : null
    }
  }

  return {}
}

const createDraftFilter = (filter: Partial<PageFilter>): Prisma.PageWhereInput => {
  if (filter?.draft != null) {
    return {
      draft: filter.draft
        ? {
            isNot: null
          }
        : null
    }
  }

  return {}
}

const createPendingFilter = (filter: Partial<PageFilter>): Prisma.PageWhereInput => {
  if (filter?.pending != null) {
    return {
      pending: filter.pending
        ? {
            isNot: null
          }
        : null
    }
  }

  return {}
}

const createTagsFilter = (filter: Partial<PageFilter>): Prisma.PageWhereInput => {
  if (filter?.tags?.length) {
    const hasTags = {
      is: {
        tags: {hasSome: filter.tags}
      }
    }

    return {
      OR: [{draft: hasTags}, {pending: hasTags}, {published: hasTags}]
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
    createPublishedFilter(filter),
    createDraftFilter(filter),
    createPendingFilter(filter),
    createTagsFilter(filter)
  ]
})

@Injectable()
export class PageService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly pageDataloader: PageDataloader
  ) {}

  async getPublishedPages({filter, ...args}: GetPublishedPagesArgs) {
    const {nodes, ...result} = await this.getPages({filter: {...filter, published: true}, ...args})
    return {
      ...result,
      nodes: nodes.map(({draft, pending, published, ...page}) => ({...page, ...published}))
    }
  }

  async getPages({filter, sortedField, order, ...pagination}: GetPagesArgs) {
    const {skip, take, cursorId} = pagination
    const orderBy = sortedField ? createPageOrder(sortedField, order) : {}
    const where = filter ? createPageFilter(filter) : {}

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
        cursor: cursorId ? {id: cursorId} : undefined,
        include: {
          draft: {
            include: {
              properties: true
            }
          },
          pending: {
            include: {
              properties: true
            }
          },
          published: {
            include: {
              properties: true
            }
          }
        }
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

  async createPage(input: PageInput) {
    const {blocks, properties, ...data} = input
    return this.prisma.page.create({
      data: {
        draft: {
          create: {
            blocks: blocks.map(mapBlockInputToPrisma),
            ...data,
            properties: {
              createMany: {
                data: properties
              }
            },
            revision: 0
          }
        }
      },
      include: {
        draft: {
          include: {
            properties: true
          }
        },
        pending: {
          include: {
            properties: true
          }
        },
        published: {
          include: {
            properties: true
          }
        }
      }
    })
  }

  async duplicatePage(id: string) {
    const page = await this.pageDataloader.load(id)
    if (!page) {
      throw new UserInputError(`Page with id "${id}" not found`)
    }

    const {
      id: _id,
      updatedAt: _updatedAt,
      createdAt: _createdAt,
      publishedAt: _publishedAt,
      slug: _slug,
      properties,
      ...pageRevision
    } = (page.draft ?? page.pending ?? page.published)!

    const duplicatedProperties = properties.map(property => ({
      key: property.key,
      value: property.value,
      public: property.public
    }))

    const input: Prisma.PageRevisionCreateInput = {
      ...pageRevision,
      blocks: pageRevision.blocks || Prisma.JsonNull,
      properties: {
        createMany: {
          data: duplicatedProperties
        }
      }
    }

    return this.prisma.page.create({
      data: {
        draft: {
          create: input
        }
      },
      include: {
        draft: {
          include: {
            properties: true
          }
        },
        pending: {
          include: {
            properties: true
          }
        },
        published: {
          include: {
            properties: true
          }
        }
      }
    })
  }

  async updatePage(id: string, input: PageInput) {
    const {blocks, properties, ...data} = input
    const page = await this.prisma.page.findUnique({
      where: {id},
      include: {
        draft: {
          include: {
            properties: true
          }
        },
        pending: {
          include: {
            properties: true
          }
        },
        published: {
          include: {
            properties: true
          }
        }
      }
    })

    if (!page) {
      throw new UserInputError(`Page with id "${id}" not found`)
    }
    return this.prisma.page.update({
      where: {id},
      data: {
        draft: {
          upsert: {
            update: {
              blocks: blocks.map(mapBlockInputToPrisma),
              ...data,
              revision: page.pending
                ? page.pending.revision + 1
                : page.published
                ? page.published.revision + 1
                : 0,
              updatedAt: null,
              createdAt: page.draft?.createdAt ?? new Date(),
              properties: {
                deleteMany: {
                  pageRevisionId: page.draft?.id ?? ''
                },
                createMany: {
                  data: properties.map(property => ({
                    key: property.key,
                    value: property.value,
                    public: property.public
                  }))
                }
              }
            },
            create: {
              blocks: blocks.map(mapBlockInputToPrisma),
              ...data,
              revision: page.pending
                ? page.pending.revision + 1
                : page.published
                ? page.published.revision + 1
                : 0,
              updatedAt: null,
              createdAt: page.draft?.createdAt ?? new Date(),
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
      },
      include: {
        draft: {
          include: {
            properties: true
          }
        },
        pending: {
          include: {
            properties: true
          }
        },
        published: {
          include: {
            properties: true
          }
        }
      }
    })
  }

  async unpublishPage(id: string) {
    const page = await this.prisma.page.findUnique({
      where: {id},
      include: {
        draft: {
          include: {
            properties: {
              select: {
                key: true,
                value: true,
                public: true
              }
            }
          }
        },
        pending: {
          include: {
            properties: {
              select: {
                key: true,
                value: true,
                public: true
              }
            }
          }
        },
        published: {
          include: {
            properties: {
              select: {
                key: true,
                value: true,
                public: true
              }
            }
          }
        }
      }
    })

    if (!page || !(page.pending || page.published)) {
      throw new UserInputError(`Page with id "${id}" not found`)
    }

    const {
      id: revisionId,
      properties,
      ...revision
    } = (page.draft ?? page.pending ?? page.published)!

    return this.prisma.page.update({
      where: {id},
      data: {
        draft: {
          upsert: {
            create: {
              ...revision,
              blocks: revision.blocks || Prisma.JsonNull,
              publishAt: null,
              publishedAt: null,
              updatedAt: null,
              properties: {
                createMany: {
                  data: properties
                }
              }
            },
            update: {
              ...revision,
              blocks: revision.blocks || Prisma.JsonNull,
              publishAt: null,
              publishedAt: null,
              updatedAt: null,
              properties: {
                deleteMany: {
                  pageRevisionId: revisionId
                },
                createMany: {
                  data: properties
                }
              }
            }
          }
        },
        pending: {
          delete: Boolean(page.pendingId)
        },
        published: {
          delete: Boolean(page.publishedId)
        }
      },
      include: {
        draft: {
          include: {
            properties: true
          }
        },
        pending: {
          include: {
            properties: true
          }
        },
        published: {
          include: {
            properties: true
          }
        }
      }
    })
  }

  async publishPage(id: string, input: PublishPageInput) {
    const publishAt = input.publishAt ?? new Date()
    const publishedAt = input.publishedAt
    const updatedAt = input.updatedAt

    const page = await this.prisma.page.findUnique({
      where: {id},
      include: {
        draft: {
          include: {
            properties: {
              select: {
                key: true,
                value: true,
                public: true
              }
            }
          }
        },
        pending: {
          include: {
            properties: {
              select: {
                key: true,
                value: true,
                public: true
              }
            }
          }
        },
        published: {
          include: {
            properties: {
              select: {
                key: true,
                value: true,
                public: true
              }
            }
          }
        }
      }
    })

    if (!page) throw new UserInputError(`Page with id "${id}" not found`)
    if (!page.draft) return null

    const {id: revisionId, properties, ...revision} = page.draft

    const publishedPage = await this.prisma.page.findFirst({
      where: {
        OR: [
          {
            published: {
              is: {
                slug: revision.slug
              }
            }
          },
          {
            pending: {
              is: {
                slug: revision.slug
              }
            }
          }
        ]
      },
      include: {
        draft: true,
        pending: true,
        published: true
      }
    })

    if (publishedPage && publishedPage.id !== id) {
      throw new UserInputError(
        `Page with ID ${publishedPage.id} already uses the slug "${(publishedPage.published ||
          publishedPage.pending)!.slug!}"`
      )
    }

    if (publishAt > new Date()) {
      return this.prisma.page.update({
        where: {id},
        data: {
          pending: {
            upsert: {
              create: {
                ...revision,
                blocks: revision.blocks || Prisma.JsonNull,
                publishAt,
                publishedAt: publishedAt ?? page?.published?.publishedAt ?? publishAt,
                updatedAt: updatedAt ?? publishAt,
                properties: {
                  createMany: {
                    data: properties
                  }
                }
              },
              update: {
                ...revision,
                blocks: revision.blocks || Prisma.JsonNull,
                publishAt,
                publishedAt: publishedAt ?? page?.published?.publishedAt ?? publishAt,
                updatedAt: updatedAt ?? publishAt,
                properties: {
                  deleteMany: {
                    pageRevisionId: revisionId
                  },
                  createMany: {
                    data: properties
                  }
                }
              }
            }
          },
          draft: {
            delete: true
          }
        },
        include: {
          draft: {
            include: {
              properties: true
            }
          },
          pending: {
            include: {
              properties: true
            }
          },
          published: {
            include: {
              properties: true
            }
          }
        }
      })
    }

    return this.prisma.page.update({
      where: {id},
      data: {
        published: {
          upsert: {
            create: {
              ...revision,
              blocks: revision.blocks || Prisma.JsonNull,
              publishedAt: publishedAt ?? page.published?.publishAt ?? publishAt,
              updatedAt: updatedAt ?? publishAt,
              publishAt: null,
              properties: {
                createMany: {
                  data: properties
                }
              }
            },
            update: {
              ...revision,
              blocks: revision.blocks || Prisma.JsonNull,
              publishedAt: publishedAt ?? page.published?.publishAt ?? publishAt,
              updatedAt: updatedAt ?? publishAt,
              publishAt: null,
              properties: {
                deleteMany: {
                  pageRevisionId: publishedPage?.published?.id || page?.draft?.id || ''
                },
                createMany: {
                  data: properties
                }
              }
            }
          }
        },
        pending: {
          delete: Boolean(page.pendingId)
        },
        draft: {
          delete: true
        }
      },
      include: {
        draft: {
          include: {
            properties: true
          }
        },
        pending: {
          include: {
            properties: true
          }
        },
        published: {
          include: {
            properties: true
          }
        }
      }
    })
  }

  async deletePage(id: string) {
    const page = await this.prisma.page.findUnique({
      where: {
        id
      },
      include: {
        draft: {
          include: {
            properties: true
          }
        },
        pending: {
          include: {
            properties: true
          }
        },
        published: {
          include: {
            properties: true
          }
        }
      }
    })

    if (!page) {
      throw new UserInputError(`Page with id "${id}" not found`)
    }

    await this.prisma.$transaction([
      this.prisma.page.delete({
        where: {
          id
        }
      }),
      this.prisma.pageRevision.deleteMany({
        where: {
          id: {
            in: [page.draftId, page.pendingId, page.publishedId].filter(Boolean) as string[]
          }
        }
      })
    ])

    return page
  }
}
