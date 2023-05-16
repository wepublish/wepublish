import {PrismaClient} from '@prisma/client'
import {UserInputError} from 'apollo-server-express'
import {Context} from '../../context'
import {PageFilter, PageSort} from '../../db/page'
import {NotFound} from '../../error'
import {authorise} from '../permissions'
import {CanGetPage, CanGetPagePreviewLink, CanGetPages} from '@wepublish/permissions/api'
import {getPages} from './page.queries'

export const getPageById = (
  id: string,
  authenticate: Context['authenticate'],
  pages: Context['loaders']['pages']
) => {
  const {roles} = authenticate()
  authorise(CanGetPage, roles)

  return pages.load(id)
}

export const getPagePreviewLink = async (
  id: string,
  hours: number,
  authenticate: Context['authenticate'],
  generateJWT: Context['generateJWT'],
  urlAdapter: Context['urlAdapter'],
  pagesLoader: Context['loaders']['pages']
) => {
  const {roles} = authenticate()
  authorise(CanGetPagePreviewLink, roles)

  const page = await pagesLoader.load(id)

  if (!page) throw new NotFound('page', id)

  if (!page.draft) throw new UserInputError('Page needs to have a draft')

  const token = generateJWT({
    id: page.id,
    expiresInMinutes: hours * 60
  })

  return urlAdapter.getPagePreviewURL(token)
}

export const getAdminPages = (
  filter: Partial<PageFilter>,
  sortedField: PageSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  authenticate: Context['authenticate'],
  page: PrismaClient['page']
) => {
  const {roles} = authenticate()
  authorise(CanGetPages, roles)

  return getPages(filter, sortedField, order, cursorId, skip, take, page)
}
