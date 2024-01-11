import {Test, TestingModule} from '@nestjs/testing'
import {ImageResolver} from './image.resolver'

describe('ImageResolver', () => {
  let resolver: ImageResolver

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageResolver]
    }).compile()

    resolver = module.get<ImageResolver>(ImageResolver)
  })

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
