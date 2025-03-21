import {Test, TestingModule} from '@nestjs/testing'
import {LoginStatus, PrismaClient} from '@prisma/client'
import {BannerService} from './banner.service'
import {BannerDocumentType} from './banner.model'

describe('BannerService', () => {
  let service: BannerService
  let prisma: PrismaClient

  const pages = [
    {id: '1', title: 'Page 1'},
    {id: '2', title: 'Page 2'}
  ]

  const banner = {
    id: '1',
    createdAt: new Date(),
    modifiedAt: new Date(),
    title: 'Test Banner',
    text: 'Test Banner Text',
    cta: null,
    imageId: null,
    active: true,
    tags: [],
    showOnArticles: true,
    showOnPages: pages,
    showForLoginStatus: LoginStatus.ALL
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannerService,
        {
          provide: PrismaClient,
          useValue: {
            banner: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn()
            }
          }
        }
      ]
    }).compile()

    service = module.get<BannerService>(BannerService)
    prisma = module.get<PrismaClient>(PrismaClient)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('findOne', () => {
    it('should return a banner', async () => {
      jest.spyOn(prisma.banner, 'findUnique').mockResolvedValue(banner)
      expect(await service.findOne('1')).toEqual(banner)
    })

    it('should return null if banner not found', async () => {
      jest.spyOn(prisma.banner, 'findUnique').mockResolvedValue(null)
      expect(await service.findOne('1')).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return an array of banners', async () => {
      const banners = [banner]
      jest.spyOn(prisma.banner, 'findMany').mockResolvedValue(banners)
      expect(await service.findAll({skip: 0, take: 10})).toEqual(banners)
    })
  })

  describe('findFirst', () => {
    it('should return the first active banner for articles', async () => {
      jest.spyOn(prisma.banner, 'findFirst').mockResolvedValue(banner)
      expect(
        await service.findFirst({
          documentType: BannerDocumentType.ARTICLE,
          documentId: '1',
          loggedIn: true
        })
      ).toEqual(banner)
    })

    it('should return the first active banner for pages', async () => {
      jest.spyOn(prisma.banner, 'findFirst').mockResolvedValue(banner)
      expect(
        await service.findFirst({
          documentType: BannerDocumentType.PAGE,
          documentId: '1',
          loggedIn: true
        })
      ).toEqual(banner)
    })

    it('should return null if no banner found', async () => {
      jest.spyOn(prisma.banner, 'findFirst').mockResolvedValue(null)
      expect(
        await service.findFirst({
          documentType: BannerDocumentType.ARTICLE,
          documentId: '1',
          loggedIn: true
        })
      ).toBeNull()
    })

    it('should return null if document type is neither ARTICLE nor PAGE', async () => {
      expect(
        await service.findFirst({
          documentType: 'INVALID' as unknown as BannerDocumentType,
          documentId: '1',
          loggedIn: true
        })
      ).toBeNull()
      expect(prisma.banner.findFirst).not.toHaveBeenCalled()
    })
  })

  describe('findPages', () => {
    it('should return an array of pages associated with the banner', async () => {
      jest.spyOn(prisma.banner, 'findUnique').mockResolvedValue(banner)
      expect(await service.findPages('1')).toEqual(pages)
    })

    it('should return an empty array if banner not found', async () => {
      jest.spyOn(prisma.banner, 'findUnique').mockResolvedValue(null)
      expect(await service.findPages('1')).toEqual([])
    })
  })

  describe('create', () => {
    it('should create a new banner', async () => {
      const createBannerInput = {
        name: 'Test Banner',
        title: 'Test Banner Title',
        text: 'Test Banner Text',
        active: true,
        showOnArticles: true,
        actions: [],
        showOnPages: [],
        showForLoginStatus: LoginStatus.ALL
      }
      jest.spyOn(prisma.banner, 'create').mockResolvedValue(banner)
      expect(await service.create(createBannerInput)).toEqual(banner)
    })
  })

  describe('update', () => {
    it('should update a banner', async () => {
      const updatedBanner = {...banner, name: 'Updated Banner'}
      const updateBannerInput = {
        id: '1',
        name: 'Updated Banner',
        title: 'Updated Banner Title',
        text: 'Updated Banner Text',
        active: true,
        showOnArticles: true,
        actions: [],
        showOnPages: [],
        showForLoginStatus: LoginStatus.ALL
      }
      jest.spyOn(prisma.banner, 'update').mockResolvedValue(updatedBanner)
      expect(await service.update(updateBannerInput)).toEqual(updatedBanner)
    })
  })

  describe('delete', () => {
    it('should delete a banner', async () => {
      jest.spyOn(prisma.banner, 'delete').mockResolvedValue(banner)
      expect(await service.delete('1')).toBeUndefined()
    })
  })
})
