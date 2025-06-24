import {INestApplication} from '@nestjs/common'
import {createMock, PartialMocked, TagList} from '@wepublish/testing'
import {Test, TestingModule} from '@nestjs/testing'
import {GraphQLModule} from '@nestjs/graphql'
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {URLAdapter} from '@wepublish/nest-modules'
import {TagResolver} from './tag.resolver'
import {TagService} from './tag.service'
import request from 'supertest'

describe('TagResolver', () => {
  let app: INestApplication
  let tagService: PartialMocked<TagService>
  let urlAdapter: PartialMocked<URLAdapter>

  beforeEach(async () => {
    tagService = createMock(TagService)
    urlAdapter = createMock(URLAdapter)

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded'
        })
      ],
      providers: [
        TagResolver,
        {
          provide: TagService,
          useValue: tagService
        },
        {
          provide: URLAdapter,
          useValue: urlAdapter
        }
      ]
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('can query a list of tags', async () => {
    urlAdapter.getTagURL?.mockResolvedValue('url-id1')
    tagService.getTags?.mockResolvedValue({
      nodes: [
        {
          id: 'id1',
          tag: 'tag1'
        }
      ],
      pageInfo: {
        startCursor: 'startCursor',
        endCursor: 'endCursor',
        hasNextPage: false,
        hasPreviousPage: false
      },
      totalCount: 0
    } as any)

    await request(app.getHttpServer())
      .post('')
      .send({
        query: TagList,
        variables: {
          filter: {
            tag: 'tag1'
          }
        }
      })
      .expect(response => {
        expect(tagService.getTags?.mock.calls).toMatchSnapshot()
        expect(urlAdapter.getTagURL?.mock.calls).toMatchSnapshot()
        expect(response.body.errors).toBeUndefined()
        expect(response.body.data).toMatchSnapshot()
      })
  })
})
