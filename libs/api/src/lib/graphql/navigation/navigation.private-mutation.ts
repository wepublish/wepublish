import {Context} from '../../context'
import {authorise} from '../permissions'
import {CanCreateNavigation, CanDeleteNavigation} from '@wepublish/permissions/api'
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
    },
    include: {
      links: true
    }
  })
}

type CreateNavigationInput = Omit<Prisma.NavigationUncheckedCreateInput, 'links' | 'modifiedAt'> & {
  links: Prisma.NavigationLinkUncheckedCreateWithoutNavigationInput[]
}

export const createNavigation = (
  {links, ...input}: CreateNavigationInput,
  authenticate: Context['authenticate'],
  navigation: PrismaClient['navigation']
) => {
  const {roles} = authenticate()
  authorise(CanCreateNavigation, roles)

  return navigation.create({
    data: {
      ...input,
      links: {
        createMany: {
          data: links
        }
      }
    },
    include: {
      links: true
    }
  })
}

type UpdateNavigationInput = Omit<
  Prisma.NavigationUncheckedUpdateInput,
  'links' | 'modifiedAt' | 'createdAt'
> & {
  links: Prisma.NavigationLinkUncheckedCreateWithoutNavigationInput[]
}

export const updateNavigation = async (
  id: string,
  {links, ...input}: UpdateNavigationInput,
  authenticate: Context['authenticate'],
  navigation: PrismaClient['navigation']
) => {
  const {roles} = authenticate()
  authorise(CanCreateNavigation, roles)

  return navigation.update({
    where: {id},
    data: {
      ...input,
      links: {
        deleteMany: {
          navigationId: {
            equals: id
          }
        },
        createMany: {
          data: links
        }
      }
    },
    include: {
      links: true
    }
  })
}
