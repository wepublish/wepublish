import {Context} from '../../context'
import {CanDeleteAuthor, CanCreateAuthor} from '@wepublish/permissions/api'
import {authorise} from '../permissions'
import {PrismaClient, Prisma} from '@prisma/client'

export const deleteAuthorById = (
  id: string,
  authenticate: Context['authenticate'],
  author: PrismaClient['author']
) => {
  const {roles} = authenticate()
  authorise(CanDeleteAuthor, roles)

  return author.delete({
    where: {
      id
    }
  })
}

type CreateAuthorInput = Omit<Prisma.AuthorUncheckedCreateInput, 'links' | 'modifiedAt'> & {
  links: Prisma.AuthorsLinksUncheckedCreateWithoutAuthorInput[]
  tagIds: string[]
}

export const createAuthor = (
  {id: authorId, links, tagIds, ...input}: CreateAuthorInput,
  authenticate: Context['authenticate'],
  author: PrismaClient['author']
) => {
  const {roles} = authenticate()
  authorise(CanCreateAuthor, roles)

  return author.create({
    data: {
      ...input,
      tags: {
        create: tagIds?.map(tagId => ({
          tagId
        }))
      },
      links: {
        create: links
      }
    },
    include: {
      links: true
    }
  })
}

type UpdateAuthorInput = Omit<
  Prisma.AuthorUncheckedUpdateInput,
  'links' | 'modifiedAt' | 'createdAt'
> & {
  links: Prisma.AuthorsLinksUncheckedCreateWithoutAuthorInput[]
  tagIds: string[]
}

export const updateAuthor = (
  id: string,
  {links, tagIds, ...input}: UpdateAuthorInput,
  authenticate: Context['authenticate'],
  author: PrismaClient['author']
) => {
  const {roles} = authenticate()
  authorise(CanCreateAuthor, roles)

  return author.update({
    where: {id},
    data: {
      ...input,
      tags: tagIds
        ? {
            connectOrCreate: tagIds.map(tagId => ({
              where: {
                authorId_tagId: {
                  authorId: id,
                  tagId
                }
              },
              create: {
                tagId
              }
            })),
            deleteMany: {
              authorId: id,
              tagId: {
                notIn: tagIds
              }
            }
          }
        : undefined,
      links: {
        deleteMany: {
          authorId: {
            equals: id
          }
        },
        create: links
      }
    },
    include: {
      links: true
    }
  })
}
