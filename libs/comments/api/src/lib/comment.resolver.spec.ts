import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import { URLAdapter, URLAdapterModule } from '@wepublish/nest-modules';
import {
  AddComment,
  CommentInput,
  CommentItemType,
  Comments,
  createMock,
  PartialMocked,
} from '@wepublish/testing';
import { CommentDataloaderService } from './comment-dataloader.service';
import { CommentResolver } from './comment.resolver';
import { CommentService } from './comment.service';
import { RatingSystemService } from './rating-system/rating-system.service';
import { CommentTagDataloader } from '@wepublish/tag/api';
import { Descendant } from 'slate';
import request from 'supertest';
import { Comment, CommentAuthorType } from './comment.model';
import { ImageDataloaderService } from '@wepublish/image/api';
import { ArticleDataloaderService } from '@wepublish/article/api';
import { PageDataloaderService } from '@wepublish/page/api';
import { CommentState } from '@prisma/client';

const mockUser = {
  id: 'userId',
  name: 'name',
  firstName: 'firstName',
  birthday: null,
  email: 'email',
  active: true,
  flair: 'flair',
  userImageID: 'userImageId',
  roleIDs: [],
};

const mockUserSession = {
  type: 'user',
  id: '448c86d8-9df1-4836-9ae9-aa2668ef9dcd',
  token: 'some-token',
  user: mockUser,
};

const richTextNodes = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'p text rich text',
      },
    ],
  },
] as Descendant[];

const mockComment: Comment = {
  id: 'id',
  tags: [],
  authorType: CommentAuthorType.author,
  itemID: 'item-id',
  itemType: CommentItemType.Article,
  state: CommentState.approved,
  createdAt: new Date('2002-12-29'),
  modifiedAt: new Date('2002-12-29'),
  children: [],
  calculatedRatings: [],
  overriddenRatings: [],
  userRatings: [],
};

describe('CommentResolver', () => {
  let app: INestApplication;
  let commentService: PartialMocked<CommentService>;
  let commentDataloader: PartialMocked<CommentDataloaderService>;
  let ratingSystemService: PartialMocked<RatingSystemService>;
  let imageDataloaderService: PartialMocked<ImageDataloaderService>;
  let articleDataloaderService: PartialMocked<ArticleDataloaderService>;
  let pageDataloaderService: PartialMocked<PageDataloaderService>;
  let commentTagDataloader: PartialMocked<CommentTagDataloader>;

  beforeEach(async () => {
    commentService = createMock(CommentService);
    commentDataloader = createMock(CommentDataloaderService);
    ratingSystemService = createMock(RatingSystemService);
    imageDataloaderService = createMock(ImageDataloaderService);
    articleDataloaderService = createMock(ArticleDataloaderService);
    pageDataloaderService = createMock(PageDataloaderService);
    commentTagDataloader = createMock(CommentTagDataloader);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
          context: {
            req: {
              user: mockUserSession,
            },
          },
        }),
        URLAdapterModule.register(new URLAdapter(`https://example.com`)),
      ],
      providers: [
        CommentResolver,
        {
          provide: CommentService,
          useValue: commentService,
        },
        {
          provide: CommentDataloaderService,
          useValue: commentDataloader,
        },
        {
          provide: RatingSystemService,
          useValue: ratingSystemService,
        },
        {
          provide: ImageDataloaderService,
          useValue: imageDataloaderService,
        },
        {
          provide: ArticleDataloaderService,
          useValue: articleDataloaderService,
        },
        {
          provide: PageDataloaderService,
          useValue: pageDataloaderService,
        },
        {
          provide: CommentTagDataloader,
          useValue: commentTagDataloader,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('Public: comment from a user with approval permission is approved', async () => {
    commentService.addComment?.mockResolvedValue(mockComment as any);
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
                children: [{ text: 'hello' }],
              },
            ],
          },
        },
      });

    expect(res.body.data).toMatchSnapshot();
    expect(res.body.data.addComment.state).toMatchSnapshot(`"approved"`);
  });

  test('can be created with bare minimum', async () => {
    commentService.addComment?.mockResolvedValue(mockComment as any);
    const input: CommentInput = {
      itemID: 'item-id',
      itemType: CommentItemType.Article,
      text: richTextNodes,
    };

    const res = await request(app.getHttpServer()).post('/').send({
      query: AddComment,
      variables: {
        input,
      },
    });

    expect(commentService.addComment?.mock.calls).toMatchSnapshot();
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data).toMatchSnapshot();
  });

  test('get comments', async () => {
    commentService.getPublicCommentsForItemById?.mockResolvedValue([
      {
        calculatedRatings: [],
        tags: [],
        featured: false,
        title: 'title',
        lead: null,
        text: null,
        revisions: [],
        id: 'id',
        createdAt: new Date('2022-12-29'),
        modifiedAt: new Date('2022-12-29'),
        itemID: 'item-id',
        itemType: CommentItemType.Article,
        parentID: null,
        state: 'approved',
        source: null,
        authorType: 'team',
        guestUserImageID: 'guestUserImageID',
        userID: 'user-id',
        rejectionReason: null,
        guestUsername: null,
      },
    ]);

    imageDataloaderService.load?.mockResolvedValue({
      id: 'guestUserImageID',
      filename: 'image.png',
    });

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: Comments,
        variables: {
          itemID: 'item-id',
        },
      })
      .expect(res => {
        expect(
          commentService.getPublicCommentsForItemById?.mock.calls
        ).toMatchSnapshot();
        expect(imageDataloaderService.load?.mock.calls).toMatchSnapshot();
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data).toMatchSnapshot();
      });
  });
});
