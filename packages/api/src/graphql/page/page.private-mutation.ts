import {Context} from '../../context'
import {authorise, CanDeletePage} from '../permissions'
import {PrismaClient} from '@prisma/client'

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
