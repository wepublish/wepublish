import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {NotFound} from '../../error'
import {authorise, CanCreatePage, CanDeletePage} from '../permissions'

export const deletePageById = (
  id: string,
  authenticate: Context['authenticate'],
  page: PrismaClient['page']
) => {
  const {roles} = authenticate()
  authorise(CanDeletePage, roles)

  return page.delete({
    where: {
      id
    }
  })
}

export const createPage = (
  input: Omit<Prisma.PageRevisionCreateInput, 'updatedAt' | 'revision'>,
  authenticate: Context['authenticate'],
  page: PrismaClient['page']
) => {
  const {roles} = authenticate()
  authorise(CanCreatePage, roles)

  return page.create({
    data: {
      draft: {
        ...input,
        revision: 0,
        updatedAt: new Date()
      },
      modifiedAt: new Date()
    }
  })
}

export const duplicatePage = async (
  id: string,
  authenticate: Context['authenticate'],
  pages: Context['loaders']['pages'],
  pageClient: PrismaClient['page']
) => {
  const {roles} = authenticate()
  authorise(CanCreatePage, roles)

  const page = await pages.load(id)
  if (!page) {
    throw new NotFound('page', id)
  }

  const pageRevision = (page.draft ?? page.pending ?? page.published)!

  const input: Prisma.PageRevisionCreateInput = {
    ...pageRevision,
    blocks: pageRevision.blocks as Prisma.JsonValue[],
    slug: '',
    revision: 0,
    publishedAt: null,
    updatedAt: new Date(),
    createdAt: new Date()
  }

  return pageClient.create({
    data: {
      draft: input,
      modifiedAt: new Date()
    }
  })
}
