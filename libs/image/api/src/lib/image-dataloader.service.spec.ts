import {Test, TestingModule} from '@nestjs/testing'
import {ImageDataloaderService} from './image-dataloader.service'

describe('ImageDataLoaderService', () => {
  let service: ImageDataloaderService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageDataloaderService]
    }).compile()

    service = module.get<ImageDataloaderService>(ImageDataloaderService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
