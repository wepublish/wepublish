import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {authorise, CanCreateNewsroom, CanDeleteNewsroom} from '../permissions'

export const deleteNewsroomById = (
  id: string,
  authenticate: Context['authenticate'],
  newsroom: PrismaClient['newsroom']
) => {
  const {roles} = authenticate()
  authorise(CanDeleteNewsroom, roles)

  return newsroom.delete({
    where: {
      id
    }
  })
}

export const createNewsroom = (
  input: Omit<Prisma.NewsroomUncheckedCreateInput, 'modifiedAt'>,
  authenticate: Context['authenticate'],
  newsroom: PrismaClient['newsroom']
) => {
  const {roles} = authenticate()
  authorise(CanCreateNewsroom, roles)

  return newsroom.create({
    data: input
  })
}

export const updateNewsroom = (
  id: string,
  input: Omit<Prisma.NewsroomUncheckedUpdateInput, 'modifiedAt' | 'createdAt'>,
  authenticate: Context['authenticate'],
  newsroom: PrismaClient['newsroom']
) => {
  const {roles} = authenticate()
  authorise(CanCreateNewsroom, roles)

  const nonEmptyInputs = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value || value === false)
  )

  return newsroom.update({
    where: {id},
    data: nonEmptyInputs
  })
}
