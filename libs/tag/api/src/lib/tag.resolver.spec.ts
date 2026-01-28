import { INestApplication } from '@nestjs/common';
import {
  createMock,
  PartialMocked,
  TagList,
  TagType,
} from '@wepublish/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { URLAdapter } from '@wepublish/nest-modules';
import { TagResolver } from './tag.resolver';
import { TagService } from './tag.service';
import request from 'supertest';
import { TagDataloader } from './tag.dataloader';

describe('TagResolver', () => {
  let app: INestApplication;
  let tagService: PartialMocked<TagService>;
  let tagDataloader: PartialMocked<TagDataloader>;
  let urlAdapter: PartialMocked<URLAdapter>;

  beforeEach(async () => {
    tagService = createMock(TagService);
    tagDataloader = createMock(TagDataloader);
    urlAdapter = createMock(URLAdapter);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
        }),
      ],
      providers: [
        TagResolver,
        {
          provide: TagService,
          useValue: tagService,
        },
        {
          provide: TagDataloader,
          useValue: tagDataloader,
        },
        {
          provide: URLAdapter,
          useValue: urlAdapter,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('can query a list of tags and return one tag with its URL', async () => {
    urlAdapter.getTagURL?.mockResolvedValue('url-id1');
    tagService.getTags?.mockResolvedValue({
      nodes: [
        {
          id: 'id1',
          tag: 'tag1',
          createdAt: new Date('2023-01-01'),
          description: [],
          main: false,
          modifiedAt: new Date('2023-01-01'),
          peerId: null,
          type: TagType.Article,
        },
      ],
      pageInfo: {
        startCursor: 'id1',
        endCursor: 'id1',
        hasNextPage: false,
        hasPreviousPage: false,
      },
      totalCount: 1,
    });

    await request(app.getHttpServer())
      .post('')
      .send({
        query: TagList,
        variables: {
          filter: {
            tag: 'tag1',
          },
        },
      })
      .expect(response => {
        expect(tagService.getTags?.mock.calls).toMatchSnapshot();
        expect(urlAdapter.getTagURL?.mock.calls).toMatchSnapshot();
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data).toMatchSnapshot();
      });
  });

  test('can query a list of tags and return a list of tags each with its URL', async () => {
    urlAdapter.getTagURL?.mockResolvedValueOnce('url-id2');
    urlAdapter.getTagURL?.mockResolvedValueOnce('url-id3');
    tagService.getTags?.mockResolvedValue({
      nodes: [
        {
          id: 'id2',
          tag: 'tag2',
          createdAt: new Date('2023-01-01'),
          description: [],
          main: false,
          modifiedAt: new Date('2023-01-01'),
          peerId: null,
          type: TagType.Article,
        },
        {
          id: 'id3',
          tag: 'tag3',
          createdAt: new Date('2023-01-01'),
          description: [],
          main: false,
          modifiedAt: new Date('2023-01-01'),
          peerId: null,
          type: TagType.Article,
        },
      ],
      pageInfo: {
        startCursor: 'id2',
        endCursor: 'id3',
        hasNextPage: false,
        hasPreviousPage: false,
      },
      totalCount: 2,
    });

    await request(app.getHttpServer())
      .post('')
      .send({
        query: TagList,
        variables: {
          filter: {
            type: TagType.Article,
            tags: ['tag2', 'tag3'],
          },
        },
      })
      .expect(response => {
        expect(tagService.getTags?.mock.calls).toMatchSnapshot();
        expect(urlAdapter.getTagURL?.mock.calls).toMatchSnapshot();
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data).toMatchSnapshot();
      });
  });
});
