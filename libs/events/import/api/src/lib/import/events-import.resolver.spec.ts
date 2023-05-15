import {Test, TestingModule} from '@nestjs/testing'
import {INestApplication, Module} from '@nestjs/common'
import request from 'supertest'
import * as crypto from 'crypto'
import {GraphQLModule} from '@nestjs/graphql'
import {ApolloDriverConfig, ApolloDriver} from '@nestjs/apollo'
import {PrismaClient /*, Prisma, Consent */} from '@prisma/client'
import {CacheModule} from '@nestjs/cache-manager'
import {htmlToSlate} from 'slate-serializers'
import {PrismaModule} from '@wepublish/nest-modules'
import {EventsImportResolver} from './events-import.resolver'
import {EventsImportService} from './events-import.service'
import {Event, ImportedEventsDocument} from './events-import.model'
import {EventStatus} from './events-import.model'
import {MediaAdapter, MediaAdapterService} from '@wepublish/image/api'

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

const eventRef = `
  fragment ImportableEventRef on Event {
    id
    name
    description
    status
    location
    externalSourceId
    externalSourceName
    imageUrl
    startsAt
    endsAt
  }
`

const eventListQuery = `
  ${eventRef}
  query ImportedEventList(
    $filter: ImportedEventFilter
    $order: Int
    $skip: Int
    $take: Int
    $sort: String
  ) {
    importedEvents(filter: $filter, order: $order, skip: $skip, take: $take, sort: $sort) {
      nodes {
        ...ImportableEventRef
      }

      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }

      totalCount
    }
  }
`

const importedEventQuery = `
  ${eventRef}
  query ImportedEvent($filter: SingleEventFilter!) {
    importedEvent(filter: $filter) {
      ...ImportableEventRef
    }
  }
`

const createEventMutation = `
  ${eventRef}
  mutation createEvent($filter: CreateEventArgs!) {
    createEvent(filter: $filter)
  }
`

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
  let prisma: PrismaClient
  let cacheManager: CacheModule
  let eventsService: EventsImportService
  const importableEvents: Event[] = mockImportableEvents

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    prisma = module.get<PrismaClient>(PrismaClient)
    app = module.createNestApplication()

    eventsService = new EventsImportService(cacheManager, prisma, mediaAdapter)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('importable event list query', async () => {
    jest
      .spyOn(eventsService, 'importedEvents')
      .mockImplementation(async () => mockImportableEventsDocument)

    await request(app.getHttpServer())
      .post('')
      .send({
        query: eventListQuery,
        variables: {take: 10, skip: 0}
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.importableEvents).toMatchObject(importableEvents)
      })
  })

  // test('create consent mutation', async () => {
  //   const toCreate = {
  //     name: 'some-name',
  //     slug: generateRandomString(),
  //     defaultValue: true
  //   }

  //   await request(app.getHttpServer())
  //     .post('/')
  //     .send({
  //       query: createConsentMutation,
  //       variables: {
  //         consent: toCreate
  //       }
  //     })
  //     .set('Accept', 'application/json')
  //     .expect(200)
  //     .expect(res => {
  //       expect(res.body.data.createConsent).toMatchObject({
  //         id: expect.any(String),
  //         name: 'some-name',
  //         slug: toCreate.slug,
  //         defaultValue: true
  //       })
  //     })
  // })

  // test('update consent mutation', async () => {
  //   const idToUpdate = consents[0].id

  //   const toUpdate = {
  //     name: 'changed name',
  //     slug: generateRandomString(),
  //     defaultValue: true
  //   }

  //   await request(app.getHttpServer())
  //     .post('/')
  //     .send({
  //       query: updateConsentMutation,
  //       variables: {
  //         id: idToUpdate,
  //         consent: toUpdate
  //       }
  //     })
  //     .set('Accept', 'application/json')
  //     .expect(200)
  //     .expect(res => {
  //       expect(res.body.data.updateConsent).toMatchObject({
  //         id: idToUpdate,
  //         name: 'changed name',
  //         slug: toUpdate.slug,
  //         defaultValue: true
  //       })
  //     })
  // })
})
