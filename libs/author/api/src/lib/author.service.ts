import {Injectable} from '@nestjs/common'
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  PrimeDataLoader,
  SortOrder
} from '@wepublish/utils/api'
import {Prisma, PrismaClient} from '@prisma/client'
import {
  CreateAuthorInput,
  GetAuthorsArgs,
  UpdateAuthorInput,
  AuthorFilter,
  AuthorSort
} from './author.model'
import {AuthorDataloader} from './author.dataloader'

const createAuthorOrder = (
  field: AuthorSort,
  sortOrder: SortOrder = SortOrder.Ascending
): Prisma.AuthorFindManyArgs['orderBy'] => {
  switch (field) {
    case AuthorSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder)
      }

    case AuthorSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder)
      }

    case AuthorSort.Name:
      return {
        name: graphQLSortOrderToPrisma(sortOrder)
      }
  }
}

const createNameFilter = (filter: Partial<AuthorFilter>): Prisma.AuthorWhereInput => {
  if (filter?.name) {
    return {
      name: {
        contains: filter.name,
        mode: 'insensitive'
      }
    }
  }

  return {}
}

const createTagIdsFilter = (filter?: Partial<AuthorFilter>): Prisma.AuthorWhereInput => {
  if (filter?.tagIds?.length) {
    return {
      tags: {
        some: {
          tagId: {
            in: filter?.tagIds
          }
        }
      }
    }
  }

  return {}
}

export const createAuthorFilter = (filter: Partial<AuthorFilter>): Prisma.AuthorWhereInput => ({
  AND: [createNameFilter(filter), createTagIdsFilter(filter)]
})

@Injectable()
export class AuthorService {
  constructor(private readonly prisma: PrismaClient) {}

  @PrimeDataLoader(AuthorDataloader)
  async getAuthorById(id: string) {
    return this.prisma.author.findUnique({
      where: {
        id
      },
      include: {
        links: true
      }
    })
  }

  @PrimeDataLoader(AuthorDataloader)
  async getAuthorBySlug(slug: string) {
    return this.prisma.author.findUnique({
      where: {
        slug
      },
      include: {
        links: true
      }
    })
  }

  @PrimeDataLoader(AuthorDataloader)
  async getAuthors({filter, sortedField, order, cursorId, skip, take}: GetAuthorsArgs) {
    {
      const orderBy = sortedField ? createAuthorOrder(sortedField, order) : {}
      const where = filter ? createAuthorFilter(filter) : {}

      const [totalCount, authors] = await Promise.all([
        this.prisma.author.count({
          where,
          orderBy
        }),
        this.prisma.author.findMany({
          where,
          skip,
          take: getMaxTake(take) + 1,
          orderBy,
          cursor: cursorId ? {id: cursorId} : undefined,
          include: {
            links: true
          }
        })
      ])

      const nodes = authors.slice(0, take)

      const firstAuthor = nodes[0]
      const lastAuthor = nodes[nodes.length - 1]

      const hasPreviousPage = Boolean(skip)
      const hasNextPage = authors.length > nodes.length

      return {
        nodes,
        totalCount,
        pageInfo: {
          hasPreviousPage,
          hasNextPage,
          startCursor: firstAuthor?.id,
          endCursor: lastAuthor?.id
        }
      }
    }
  }

  @PrimeDataLoader(AuthorDataloader)
  async createAuthor(data: CreateAuthorInput) {
    const {links, tagIds, ...input} = data

    return this.prisma.author.create({
      data: {
        ...(input as Prisma.AuthorCreateInput),
        tags: {
          create: tagIds.map(tagId => ({tagId}))
        },
        links: {
          create: links
        }
      },
      include: {links: true}
    })
  }

  @PrimeDataLoader(AuthorDataloader)
  async updateAuthor(data: UpdateAuthorInput) {
    const {id, links, tagIds, ...input} = data

    return this.prisma.author.update({
      where: {id},
      data: {
        ...(input as Prisma.AuthorUpdateInput),
        ...(tagIds && {
          tags: {
            connectOrCreate: tagIds.map(tagId => ({
              where: {authorId_tagId: {authorId: id, tagId}},
              create: {tagId}
            })),
            deleteMany: {authorId: id, tagId: {notIn: tagIds}}
          }
        }),
        ...(links && {
          links: {
            deleteMany: {authorId: id},
            create: links
          }
        })
      },
      include: {links: true, tags: true}
    })
  }

  async deleteAuthorById(id: string) {
    return this.prisma.author.delete({
      where: {id},
      include: {
        links: true
      }
    })
  }
}
