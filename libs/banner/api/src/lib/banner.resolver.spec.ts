import {Test, TestingModule} from '@nestjs/testing'
import {BannerResolver} from './banner.resolver'
import {BannerService} from './banner.service'
import {BannerActionService} from './banner-action.service'
import {NotFoundException} from '@nestjs/common'
import {Banner, BannerDocumentType} from './banner.model'

describe('BannerResolver', () => {
  let resolver: BannerResolver

  const mockBanner: Banner = {
    id: '1',
    imageId: '123',
    active: true,
    title: '',
    text: '',
    showOnArticles: false
  }

  const mockBannerService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findFirst: jest.fn(),
    findPages: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }

  const mockBannerActionService = {
    findAll: jest.fn()
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannerResolver,
        {
          provide: BannerService,
          useValue: mockBannerService
        },
        {
          provide: BannerActionService,
          useValue: mockBannerActionService
        }
      ]
    }).compile()

    resolver = module.get<BannerResolver>(BannerResolver)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })

  describe('banners', () => {
    it('should return array of banners', async () => {
      mockBannerService.findAll.mockResolvedValue([mockBanner])
      const result = await resolver.banners({skip: 0, take: 10})
      expect(result).toEqual([mockBanner])
    })
  })

  describe('banner', () => {
    it('should return a single banner', async () => {
      mockBannerService.findOne.mockResolvedValue(mockBanner)
      const result = await resolver.banner('1')
      expect(result).toEqual(mockBanner)
    })

    it('should throw NotFoundException when banner not found', async () => {
      mockBannerService.findOne.mockResolvedValue(null)
      await expect(resolver.banner('1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('primaryBanner', () => {
    it('should return the primary banner', async () => {
      mockBannerService.findFirst.mockResolvedValue(mockBanner)
      const result = await resolver.primaryBanner({
        documentType: BannerDocumentType.ARTICLE,
        documentId: '1'
      })
      expect(result).toEqual(mockBanner)
    })

    it('should throw NotFoundException when no primary banner found', async () => {
      mockBannerService.findFirst.mockResolvedValue(null)
      await expect(
        resolver.primaryBanner({documentType: BannerDocumentType.ARTICLE, documentId: '1'})
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('actions', () => {
    it('should return banner actions', async () => {
      const mockActions = [{id: '1', bannerId: '1', type: 'CLICK'}]
      mockBannerActionService.findAll.mockResolvedValue(mockActions)
      const result = await resolver.actions(mockBanner)
      expect(result).toEqual(mockActions)
    })
  })

  describe('image', () => {
    it('should return image when imageId exists', () => {
      const result = resolver.image(mockBanner)
      expect(result).toEqual({__typename: 'Image', id: '123'})
    })

    it('should return null when no imageId', () => {
      const bannerWithoutImage = {...mockBanner, imageId: null}
      const result = resolver.image(bannerWithoutImage)
      expect(result).toBeNull()
    })
  })

  describe('showOnPages', () => {
    it('should return pages for banner', async () => {
      const mockPages = [{id: '1', name: 'Test Page'}]
      mockBannerService.findPages.mockResolvedValue(mockPages)
      const result = await resolver.showOnPages(mockBanner)
      expect(result).toEqual(mockPages)
    })
  })

  describe('mutations', () => {
    it('should create banner', async () => {
      const createInput = {
        name: 'New Banner',
        active: true,
        title: 'New Banner Title',
        text: 'New Banner Text',
        showOnArticles: false
      }
      mockBannerService.create.mockResolvedValue(mockBanner)
      const result = await resolver.createBanner(createInput)
      expect(result).toEqual(mockBanner)
    })

    it('should update banner', async () => {
      const updateInput = {
        id: '1',
        title: 'Updated Banner Title',
        text: 'Updated Banner Text',
        active: true,
        showOnArticles: false,
        actions: []
      }
      mockBannerService.update.mockResolvedValue(mockBanner)
      const result = await resolver.updateBanner(updateInput)
      expect(result).toEqual(mockBanner)
    })

    it('should delete banner', async () => {
      await resolver.deleteBanner('1')
      expect(mockBannerService.delete).toHaveBeenCalledWith('1')
    })
  })
})
