import {Context} from '../../context'
import {authorise, CanGetSettings} from '../permissions'
import {PrismaClient} from '@prisma/client'
import {UserInputError} from '../../error'

export const getSetting = (
  name: string,
  authenticate: Context['authenticate'],
  setting: PrismaClient['setting']
) => {
  const {roles} = authenticate()
  authorise(CanGetSettings, roles)

  if (!name) {
    throw new UserInputError('You must provide setting `name`.')
  }

  return setting.findUnique({
    where: {name}
  })
}

export const getSettings = (
  authenticate: Context['authenticate'],
  setting: PrismaClient['setting']
) => {
  const {roles} = authenticate()
  authorise(CanGetSettings, roles)

  return setting.findMany({})
}
