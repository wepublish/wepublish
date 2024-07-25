import {Test, TestingModule} from '@nestjs/testing'
import {ScriptsController} from './scripts.controller'
import {PrismaClient} from '@prisma/client'
import {Response} from 'express'
import {SettingName} from '@wepublish/settings/api'

const mockPrismaService = {
  setting: {
    findFirst: jest.fn()
  }
}

describe('ScriptsController', () => {
  let controller: ScriptsController
  let prismaService: PrismaClient
  let res: Response

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScriptsController],
      providers: [{provide: PrismaClient, useValue: mockPrismaService}]
    }).compile()

    controller = module.get<ScriptsController>(ScriptsController)
    prismaService = module.get<PrismaClient>(PrismaClient)

    // Mocking the response object
    res = {
      setHeader: jest.fn(),
      send: jest.fn()
    } as unknown as Response
  })

  it('should return an empty script if no settings are defined', async () => {
    mockPrismaService.setting.findFirst.mockResolvedValue(null)

    await controller.headScript(res)

    expect(prismaService.setting.findFirst).toHaveBeenCalledWith({
      where: {name: SettingName.HEAD_SCRIPT}
    })
    expect(res.send).toHaveBeenCalledWith('')
  })

  it('should return the head script if a "head"-setting is defined', async () => {
    const scriptValue = 'console.log("head script")'
    mockPrismaService.setting.findFirst.mockResolvedValue({value: scriptValue})

    await controller.headScript(res)

    expect(prismaService.setting.findFirst).toHaveBeenCalledWith({
      where: {name: SettingName.HEAD_SCRIPT}
    })
    expect(res.send).toHaveBeenCalledWith(scriptValue)
  })

  it('should return the body script if a body setting is defined', async () => {
    const scriptValue = 'console.log("body script")'
    mockPrismaService.setting.findFirst.mockResolvedValue({value: scriptValue})

    await controller.bodyScript(res)

    expect(prismaService.setting.findFirst).toHaveBeenCalledWith({
      where: {name: SettingName.BODY_SCRIPT}
    })
    expect(res.send).toHaveBeenCalledWith(scriptValue)
  })

  it('should set the appropriate headers', async () => {
    const scriptValue = 'console.log("script")'
    mockPrismaService.setting.findFirst.mockResolvedValue({value: scriptValue})

    await controller.headScript(res)

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/javascript')
    expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'no-referrer')
    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff')
    expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY')
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400')
  })
})
