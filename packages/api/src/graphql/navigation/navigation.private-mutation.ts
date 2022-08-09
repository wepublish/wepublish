import {Context} from '../../context'
import {authorise, CanCreateNavigation, CanDeleteNavigation} from '../permissions'
import {PrismaClient, Prisma} from '@prisma/client'

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

export const createNavigation = (
  input: Omit<Prisma.NavigationUncheckedCreateInput, 'modifiedAt'>,
  authenticate: Context['authenticate'],
  navigation: PrismaClient['navigation']
) => {
  const {roles} = authenticate()
  authorise(CanCreateNavigation, roles)

  return navigation.create({
    data: {...input, modifiedAt: new Date()}
  })
}

export const updateNavigation = (
  id: string,
  input: Omit<Prisma.NavigationUncheckedUpdateInput, 'modifiedAt' | 'createdAt'>,
  authenticate: Context['authenticate'],
  navigation: PrismaClient['navigation']
) => {
  const {roles} = authenticate()
  authorise(CanCreateNavigation, roles)

  return navigation.update({
    where: {id},
    data: input
  })
}
