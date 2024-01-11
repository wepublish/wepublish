import {Test, TestingModule} from '@nestjs/testing'
import {EventDataloaderService} from './event-dataloader.service'

describe('EventDataloaderService', () => {
  let service: EventDataloaderService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventDataloaderService]
    }).compile()

    service = module.get<EventDataloaderService>(EventDataloaderService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
