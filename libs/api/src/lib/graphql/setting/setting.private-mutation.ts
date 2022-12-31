import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {SettingRestriction, UpdateSettingArgs} from '../../db/setting'
import {NotFound} from '../../error'
import {checkSettingRestrictions} from '../../utility'
import {authorise, CanUpdateSettings} from '../permissions'

export const updateSettings = async (
  value: UpdateSettingArgs[],
  authenticate: Context['authenticate'],
  prisma: PrismaClient
) => {
  const {roles} = authenticate()
  authorise(CanUpdateSettings, roles)

  for (const {name, value: newVal} of value) {
    const fullSetting = await prisma.setting.findUnique({
      where: {name}
    })

    if (!fullSetting) {
      throw new NotFound('setting', name)
    }

    const currentVal = fullSetting.value
    const restriction = fullSetting.settingRestriction
    checkSettingRestrictions(newVal, currentVal, restriction as SettingRestriction)
  }

  return prisma.$transaction(
    (value as UpdateSettingArgs[]).map(({name, value: val}) =>
      prisma.setting.update({
        where: {
          name
        },
        data: {
          value: val as Prisma.InputJsonValue
        }
      })
    )
  )
}
