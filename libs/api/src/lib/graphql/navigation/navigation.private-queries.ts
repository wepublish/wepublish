import {Context} from '../../context'
import {UserInputError} from '../../error'
import {authorise} from '../permissions'
import {CanGetNavigation, CanGetNavigations} from '@wepublish/permissions/api'
import {PrismaClient} from '@prisma/client'

export const getNavigationByIdOrKey = (
  id: string | null,
  key: string | null,
  authenticate: Context['authenticate'],
  navigationByID: Context['loaders']['navigationByID'],
  navigationByKey: Context['loaders']['navigationByKey']
) => {
  const {roles} = authenticate()
  authorise(CanGetNavigation, roles)

  if ((!id && !key) || (id && key)) {
    throw new UserInputError('You must provide either `id` or `key`.')
  }

  return id ? navigationByID.load(id) : navigationByKey.load(key!)
}

export const getNavigations = (
  authenticate: Context['authenticate'],
  navigation: PrismaClient['navigation']
) => {
  const {roles} = authenticate()
  authorise(CanGetNavigations, roles)

  return navigation.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      links: true
    }
  })
}
