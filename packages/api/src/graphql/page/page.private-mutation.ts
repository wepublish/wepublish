import {Context} from '../../context'
import {authorise, CanCreatePage, CanDeletePage} from '../permissions'
import {Prisma, PrismaClient} from '@prisma/client'
import {NotFound} from '../../error'
import {PageRevision} from '../../db/page'

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

  const pageRevision = Object.assign(
    {},
    (page.draft ?? page.pending ?? page.published) as PageRevision,
    {
      slug: '',
      publishedAt: undefined,
      updatedAt: undefined
    }
  )

  const input: Prisma.PageRevisionCreateInput = {
    ...pageRevision,
    blocks: pageRevision.blocks as Prisma.JsonValue[],
    revision: 0,
    updatedAt: new Date()
  }

  return pageClient.create({
    data: {
      draft: input,
      modifiedAt: new Date()
    }
  })
}
