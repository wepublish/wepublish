import {PageFilter, PageSort} from '../../db/page'
import {getPages} from './page.queries'
import {PrismaClient} from '@prisma/client'
import {SortOrder} from '@wepublish/utils/api'

export const getPublishedPages = async (
  filter: Partial<PageFilter>,
  sortedField: PageSort,
  order: SortOrder,
  cursorId: string | null,
  skip: number,
  take: number,
  page: PrismaClient['page']
) => {
  const data = await getPages(
    {...filter, published: true},
    sortedField,
    order,
    cursorId,
    skip,
    take,
    page
  )

  return {
    ...data,
    nodes: data.nodes.map(({id, published}) => ({...published, id}))
  }
}
