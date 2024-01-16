import {PrismaClient} from '@prisma/client'
import {CanGetSettings} from '@wepublish/permissions/api'
import {Context} from '../../context'
import {authorise} from '../permissions'

export const getSetting = (
  name: string,
  authenticate: Context['authenticate'],
  setting: PrismaClient['setting']
) => {
  const {roles} = authenticate()
  authorise(CanGetSettings, roles)

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
