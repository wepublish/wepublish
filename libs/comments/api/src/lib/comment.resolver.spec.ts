import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {INestApplication} from '@nestjs/common'
import {GraphQLModule} from '@nestjs/graphql'
import {Test, TestingModule} from '@nestjs/testing'
import {URLAdapter, URLAdapterModule} from '@wepublish/nest-modules'
import {
  AddComment,
  CommentInput,
  CommentItemType,
  createMock,
  PartialMocked
} from '@wepublish/testing'
import {CommentDataloaderService} from './comment-dataloader.service'
import {CommentResolver} from './comment.resolver'
import {CommentService} from './comment.service'
import {RatingSystemService} from './rating-system/rating-system.service'
import {TagService} from '@wepublish/tag/api'
import {Descendant} from 'slate'
import request from 'supertest'
import {
  Comment,
  CommentAuthorType,
  CommentItemType as CommentModelItemType,
  CommentState
} from './comment.model'

const mockUser = {
  id: 'userId',
  name: 'name',
  firstName: 'firstName',
  birthday: null,
  email: 'email',
  active: true,
  flair: 'flair',
  userImageID: 'userImageId',
  roleIDs: []
}

const mockUserSession = {
  type: 'user',
  id: '448c86d8-9df1-4836-9ae9-aa2668ef9dcd',
  token: 'some-token',
  user: mockUser
}

const richTextNodes = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'p text rich text'
      }
    ]
  }
] as Descendant[]

const mockComment: Comment = {
  id: '',
  tags: [],
  authorType: CommentAuthorType.author,
  itemID: '',
  itemType: CommentModelItemType.article,
  state: CommentState.approved,
  createdAt: new Date('2002-12-29'),
  modifiedAt: new Date('2002-12-29'),
  children: []
}

describe('UserConsentResolver', () => {
  let app: INestApplication
  let commentService: PartialMocked<CommentService>
  let commentDataloader: PartialMocked<CommentDataloaderService>
  let tagService: PartialMocked<TagService>
  let ratingSystemService: PartialMocked<RatingSystemService>

  beforeEach(async () => {
    commentService = createMock(CommentService)
    commentDataloader = createMock(CommentDataloaderService)
    tagService = createMock(TagService)
    ratingSystemService = createMock(RatingSystemService)

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
          context: {
            req: {
              user: mockUserSession
            }
          }
        }),
        URLAdapterModule.register(new URLAdapter(`https://example.com`))
      ],
      providers: [
        CommentResolver,
        {
          provide: CommentService,
          useValue: commentService
        },
        {
          provide: CommentDataloaderService,
          useValue: commentDataloader
        },
        {
          provide: TagService,
          useValue: tagService
        },
        {
          provide: RatingSystemService,
          useValue: ratingSystemService
        }
      ]
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('Public: comment from a user with approval permission is approved', async () => {
    commentService.addPublicComment?.mockResolvedValue(mockComment as any)
    const res = await request(app.getHttpServer())
      .post('/')
      .send({
        query: AddComment,
        variables: {
          input: {
            itemID: 'd',
            itemType: CommentItemType.Article,
            text: [
              {
                type: 'paragraph',
                children: [{text: 'hello'}]
              }
            ]
          }
        }
      })

    expect(res.body.data).toMatchSnapshot()
    expect(res.body.data.addComment.state).toMatchInlineSnapshot(`"approved"`)
  })

  test('can be created with bare minimum', async () => {
    commentService.addPublicComment?.mockResolvedValue(mockComment as any)
    const input: CommentInput = {
      itemID: 'item-id',
      itemType: CommentItemType.Article,
      text: richTextNodes
    }

    const res = await request(app.getHttpServer()).post('/').send({
      query: AddComment,
      variables: {
        input
      }
    })

    expect(commentService.addPublicComment?.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "itemID": "item-id",
            "itemType": 0,
            "text": [
              {
                "children": [
                  {
                    "text": "p text rich text",
                  },
                ],
                "type": "paragraph",
              },
            ],
          },
          {
            "id": "448c86d8-9df1-4836-9ae9-aa2668ef9dcd",
            "token": "some-token",
            "type": "user",
            "user": {
              "active": true,
              "birthday": null,
              "email": "email",
              "firstName": "firstName",
              "flair": "flair",
              "id": "userId",
              "name": "name",
              "roleIDs": [],
              "userImageID": "userImageId",
            },
          },
        ],
      ]
    `)
    expect(res.body.errors).toBeUndefined()
    expect(res.body.data).toMatchInlineSnapshot(`
      {
        "addComment": {
          "id": "",
          "itemID": "",
          "itemType": "article",
          "parentID": null,
          "state": "approved",
          "text": null,
          "user": null,
        },
      }
    `)
  })
})
