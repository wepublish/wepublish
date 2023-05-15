import {Test, TestingModule} from '@nestjs/testing'
import {INestApplication, Module} from '@nestjs/common'
import * as crypto from 'crypto'
import {GraphQLModule} from '@nestjs/graphql'
import {ApolloDriverConfig, ApolloDriver} from '@nestjs/apollo'
import {CacheModule} from '@nestjs/cache-manager'
import {htmlToSlate} from 'slate-serializers'
import {PrismaModule} from '@wepublish/nest-modules'
import {EventsImportResolver} from './events-import.resolver'
import {EventsImportService} from './events-import.service'
import {Event, ImportedEventsDocument, Providers} from './events-import.model'
import {EventStatus} from './events-import.model'
import {MediaAdapterService} from '@wepublish/image/api'

export const generateRandomString = () => crypto.randomBytes(20).toString('hex')

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: '/'
    }),
    PrismaModule,
    CacheModule.register()
  ],
  providers: [EventsImportResolver, EventsImportService, MediaAdapterService]
})
export class AppModule {}

export const mockImportableEvents: Event[] = [
  {
    id: '123',
    createdAt: new Date(),
    modifiedAt: new Date(),
    name: 'some name',
    description: htmlToSlate('<p>some description</p>') as unknown as JSON,
    status: EventStatus.SCHEDULED,
    location: 'some location',
    imageUrl: 'some image url',
    externalSourceId: '123456',
    externalSourceName: 'ProviderName',
    startsAt: new Date(),
    endsAt: new Date()
  }
]

export const mockImportableEventsDocument: ImportedEventsDocument = {
  nodes: mockImportableEvents,
  totalCount: mockImportableEvents.length,
  pageInfo: {
    hasPreviousPage: false,
    hasNextPage: false,
    endCursor: '',
    startCursor: ''
  }
}

describe('EventsImportResolver', () => {
  let app: INestApplication
  let resolver: EventsImportResolver
  let service: EventsImportService

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = module.createNestApplication()

    resolver = module.get<EventsImportResolver>(EventsImportResolver)
    service = module.get<EventsImportService>(EventsImportService)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('importedEvents query should call importedEvents method of EventsImportService with the provided arguments', async () => {
    const filter = {}
    const order = 1
    const skip = 0
    const take = 10
    const sort = ''

    jest
      .spyOn(service, 'importedEvents')
      .mockReturnValueOnce(Promise.resolve(mockImportableEventsDocument))

    expect(resolver.importedEvents(filter, order, skip, take, sort)).resolves.toEqual(
      mockImportableEventsDocument
    )
    expect(service.importedEvents).toHaveBeenCalledWith({filter, order, skip, take, sort})
  })

  test('importedEvent query should call importedEvent method of EventsImportService with the provided filter', async () => {
    const filter = {id: 'some-id', source: Providers.AgendaBasel}

    jest
      .spyOn(service, 'importedEvent')
      .mockReturnValueOnce(Promise.resolve(mockImportableEvents[0]))

    expect(resolver.importedEvent(filter)).resolves.toEqual(mockImportableEvents[0])
    expect(service.importedEvent).toHaveBeenCalledWith(filter)
  })

  test('createEvent mutation should call createEvent method of EventsImportService with the provided filter', () => {
    const filter = {id: 'some-id', source: Providers.AgendaBasel}

    jest.spyOn(service, 'createEvent').mockReturnValueOnce(Promise.resolve('some-id'))

    expect(resolver.createEvent(filter)).resolves.toEqual('some-id')
    expect(service.createEvent).toHaveBeenCalledWith(filter)
  })
})
