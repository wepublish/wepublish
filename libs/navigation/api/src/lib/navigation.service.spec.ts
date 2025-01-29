import {Test, TestingModule} from '@nestjs/testing'
import {PrismaClient} from '@prisma/client'
import {NavigationService} from './navigation.service'
import {NavigationDataloader} from './navigation-dataloader.service'

describe('NavigationService', () => {
  let service: NavigationService
  let navigationDataloader: {[method in keyof NavigationDataloader]?: jest.Mock}
  let prismaMock: any

  beforeEach(async () => {
    navigationDataloader = {
      load: jest.fn()
    }

    prismaMock = {
      navigation: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        update: jest.fn()
      },
      navigationLink: {
        deleteMany: jest.fn()
      }
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NavigationService,
        {provide: NavigationDataloader, useValue: navigationDataloader},
        {provide: PrismaClient, useValue: prismaMock}
      ]
    }).compile()

    service = module.get<NavigationService>(NavigationService)
  })

  it('should get a navigation by id', async () => {
    prismaMock.navigation.findUnique.mockResolvedValueOnce({})
    await service.getNavigationById('123')
    expect(prismaMock.navigation.findUnique).toHaveBeenCalled()
    expect(prismaMock.navigation.findUnique.mock.calls[0]).toMatchSnapshot()
  })

  it('should get a navigation by key', async () => {
    prismaMock.navigation.findUnique.mockResolvedValueOnce({})
    await service.getNavigationByKey('key123')
    expect(prismaMock.navigation.findUnique).toHaveBeenCalled()
    expect(prismaMock.navigation.findUnique.mock.calls[0]).toMatchSnapshot()
  })

  it('should get all navigations', async () => {
    prismaMock.navigation.findMany.mockResolvedValueOnce([])
    await service.getNavigations()
    expect(prismaMock.navigation.findMany).toHaveBeenCalled()
    expect(prismaMock.navigation.findMany.mock.calls[0]).toMatchSnapshot()
  })

  it('should create a navigation', async () => {
    const input = {key: 'testKey', name: 'testName', links: []}
    prismaMock.navigation.create.mockResolvedValueOnce({})
    await service.createNavigation(input)
    expect(prismaMock.navigation.create).toHaveBeenCalled()
    expect(prismaMock.navigation.create.mock.calls[0]).toMatchSnapshot()
  })

  it('should delete a navigation by id', async () => {
    prismaMock.navigation.delete.mockResolvedValueOnce({})
    await service.deleteNavigationById('123')
    expect(prismaMock.navigation.delete).toHaveBeenCalled()
    expect(prismaMock.navigation.delete.mock.calls[0]).toMatchSnapshot()
  })

  it('should update a navigation', async () => {
    const input = {id: '123', key: 'testKey', name: 'testName', links: []}
    prismaMock.navigation.update.mockResolvedValueOnce({})
    prismaMock.navigationLink.deleteMany.mockResolvedValueOnce({})
    await service.updateNavigation(input)
    expect(prismaMock.navigationLink.deleteMany).toHaveBeenCalled()
    expect(prismaMock.navigation.update).toHaveBeenCalled()
    expect(prismaMock.navigation.update.mock.calls[0]).toMatchSnapshot()
  })
})
