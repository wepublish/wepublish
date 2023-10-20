import {Injectable, NotFoundException} from '@nestjs/common'
import {Prisma, PrismaClient, Setting} from '@prisma/client'
import {UpdateSettingInput, SettingFilter, SettingRestriction} from './settings.model'
import {checkSettingRestrictions} from './settings-utils'

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaClient) {}

  /*
  Queries
 */
  async settingsList(filter?: SettingFilter): Promise<Setting[]> {
    const data = await this.prisma.setting.findMany({
      where: {
        ...filter
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return data
  }

  async setting(id: string): Promise<Setting> {
    const data = await this.prisma.setting.findUnique({
      where: {
        id
      }
    })

    if (!data) {
      throw Error(`Setting with id ${id} not found`)
    }

    return data
  }

  /*
  Mutations
 */
  async updateSettings({value}: {value: UpdateSettingInput[]}): Promise<Setting[]> {
    for (const {name, value: newVal} of value) {
      const fullSetting = await this.prisma.setting.findUnique({
        where: {name}
      })

      if (!fullSetting) {
        throw new NotFoundException('setting', name)
      }

      const currentVal = fullSetting.value
      const restriction = fullSetting.settingRestriction
      checkSettingRestrictions(newVal, currentVal, restriction as SettingRestriction)
    }

    return this.prisma.$transaction(
      value.map(({name, value: val}) => {
        return this.prisma.setting.update({
          where: {
            name
          },
          data: {
            value: val as Prisma.InputJsonValue
          }
        })
      })
    )
  }
}
