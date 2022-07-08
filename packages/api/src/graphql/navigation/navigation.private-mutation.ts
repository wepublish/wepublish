import {Context} from '../../context'
import {authorise, CanDeleteNavigation} from '../permissions'
import {PrismaClient} from '@prisma/client'

export const deleteNavigationById = (
  id: string,
  authenticate: Context['authenticate'],
  navigation: PrismaClient['navigation']
) => {
  const {roles} = authenticate()
  authorise(CanDeleteNavigation, roles)

  return navigation.delete({
    where: {
      id
    }
  })
}
