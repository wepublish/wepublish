import {Test, TestingModule} from '@nestjs/testing'
import {SettingsService} from './settings.service'
import {PrismaModule} from '@wepublish/nest-modules'
import {PrismaClient, Setting} from '@prisma/client'
import {SettingName} from './setting'

describe('SettingsService', () => {
  let service: SettingsService
  let prisma: PrismaClient

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [SettingsService]
    }).compile()

    prisma = module.get<PrismaClient>(PrismaClient)
    service = module.get<SettingsService>(SettingsService)
  })

  test('should be defined', () => {
    expect(service).toBeDefined()
  })

  test('should list settings', async () => {
    const mockSettings: Setting[] = [
      {
        id: '1',
        name: 'setting1',
        value: 'value1',
        createdAt: new Date(),
        modifiedAt: new Date(),
        settingRestriction: null
      },
      {
        id: '2',
        name: 'setting2',
        value: 'value2',
        createdAt: new Date(),
        modifiedAt: new Date(),
        settingRestriction: null
      }
    ]

    const mockFunction = jest.spyOn(prisma.setting, 'findMany').mockResolvedValue(mockSettings)

    const result = await service.settingsList()
    expect(result).toMatchSnapshot()
    expect(mockFunction.mock.calls[0][0]).toMatchSnapshot()
  })

  test('should fetch a single setting by ID', async () => {
    const mockSetting: Setting = {
      id: '1',
      name: 'setting1',
      value: 'value1',
      createdAt: new Date(),
      modifiedAt: new Date(),
      settingRestriction: null
    }

    const mockFunction = jest.spyOn(prisma.setting, 'findUnique').mockResolvedValue(mockSetting)

    const id = '1'
    const result = await service.setting(id)
    expect(result).toMatchSnapshot()
    expect(mockFunction.mock.calls[0][0]).toMatchSnapshot()
  })

  test('should update settings', async () => {
    const updateInput = [
      {name: SettingName.ALLOW_COMMENT_EDITING, value: 'updatedValue1'},
      {name: SettingName.ALLOW_COMMENT_EDITING, value: 'updatedValue2'}
    ]

    const updatedSettings: Setting[] = [
      {
        id: '1',
        name: 'setting1',
        value: SettingName.ALLOW_COMMENT_EDITING,
        createdAt: new Date(),
        modifiedAt: new Date(),
        settingRestriction: null
      },
      {
        id: '2',
        name: SettingName.ALLOW_COMMENT_EDITING,
        value: 'updatedValue2',
        createdAt: new Date(),
        modifiedAt: new Date(),
        settingRestriction: null
      }
    ]

    jest.spyOn(prisma.setting, 'findUnique').mockResolvedValue(updatedSettings[0])
    const mockFunction = jest.spyOn(prisma.setting, 'update').mockResolvedValue(updatedSettings[1])

    const result = await service.updateSettings({value: updateInput})
    expect(result).toMatchSnapshot()
    expect(mockFunction.mock.calls[0][0]).toMatchSnapshot()
  })
})
