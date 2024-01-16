import {Injectable, NotFoundException} from '@nestjs/common'
import {Prisma, PrismaClient, Setting} from '@prisma/client'
import {UpdateSettingInput, SettingFilter, SettingRestriction} from './settings.model'
import {checkSettingRestrictions} from './settings-utils'

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaClient) {}

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

  async updateSetting(input: UpdateSettingInput) {
    const {name, value} = input
    const fullSetting = await this.prisma.setting.findUnique({
      where: {name}
    })

    if (!fullSetting) {
      throw new NotFoundException('setting', name)
    }

    const currentVal = fullSetting.value
    const restriction = fullSetting.settingRestriction
    checkSettingRestrictions(value, currentVal, restriction as SettingRestriction)

    return this.prisma.setting.update({
      where: {
        name
      },
      data: {
        value: value as unknown as Prisma.InputJsonValue
      }
    })
  }
}
