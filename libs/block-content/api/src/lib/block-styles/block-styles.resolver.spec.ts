import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import { BlockStyle, PrismaClient } from '@prisma/client';
import request from 'supertest';
import { BlockStylesDataloaderService } from './block-styles-dataloader.service';
import {
  CreateBlockStyleInput,
  UpdateBlockStyleInput,
} from './block-styles.model';
import { BlockStylesResolver } from './block-styles.resolver';
import { BlockStylesService } from './block-styles.service';

const mockBlockStyle = {
  id: '1234',
  createdAt: new Date('2023-01-01'),
  modifiedAt: new Date('2023-01-01'),
  blocks: ['Event'],
  name: 'Name',
} as BlockStyle;

const blockstyleListQuery = `
  query BlockStyleList {
    blockStyles {
      id
      name
      blocks
    }
  }
`;

const createBlockStyleQuery = `
  mutation CreateBlockStyle(
    $name: String!
    $blocks: [BlockType!]!
  ) {
    createBlockStyle(
      name: $name
      blocks: $blocks
    ) {
      id
      name
      blocks
    }
  }
`;

const updateBlockStyleQuery = `
  mutation UpdateBlockStyle(
    $id: String!,
    $name: String!
    $blocks: [BlockType!]
  ) {
    updateBlockStyle(
      id: $id
      name: $name
      blocks: $blocks
    ) {
      id
      name
      blocks
    }
  }
`;

const deleteBlockStyleQuery = `
  mutation DeleteBlockStyle($id: String!) {
    deleteBlockStyle(id: $id) {
      id
      name
      blocks
    }
  }
`;

describe('BlockStyleService', () => {
  let app: INestApplication;
  let blockstyleServiceMock: {
    [method in keyof BlockStylesService]?: jest.Mock;
  };
  let BlockStylesDataloaderServiceMock: {
    [method in keyof BlockStylesDataloaderService]?: jest.Mock;
  };

  beforeEach(async () => {
    blockstyleServiceMock = {
      getBlockStyles: jest.fn(),
      createBlockStyle: jest.fn(),
      deleteBlockStyle: jest.fn(),
      updateBlockStyle: jest.fn(),
    };

    BlockStylesDataloaderServiceMock = {
      load: jest.fn(),
    };

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
        BlockStylesResolver,
        {
          provide: BlockStylesService,
          useValue: blockstyleServiceMock,
        },
        {
          provide: BlockStylesDataloaderService,
          useValue: BlockStylesDataloaderServiceMock,
        },
        {
          provide: PrismaClient,
          useValue: jest.fn(), // not used due to mocks but needs to be provided
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('blockStyles', async () => {
    blockstyleServiceMock.getBlockStyles?.mockResolvedValue([mockBlockStyle]);

    await request(app.getHttpServer())
      .post('')
      .send({
        query: blockstyleListQuery,
      })
      .expect(res => {
        expect(
          blockstyleServiceMock.getBlockStyles?.mock.calls[0]
        ).toMatchSnapshot();
        expect(res.body.data.blockStyles).toMatchSnapshot();
      })
      .expect(200);
  });

  test('create', async () => {
    blockstyleServiceMock.createBlockStyle?.mockResolvedValue(mockBlockStyle);

    await request(app.getHttpServer())
      .post('')
      .send({
        query: createBlockStyleQuery,
        variables: {
          name: 'Name',
          blocks: ['Event'],
        } as CreateBlockStyleInput,
      })
      .expect(res => {
        expect(
          blockstyleServiceMock.createBlockStyle?.mock.calls[0]
        ).toMatchSnapshot();
        expect(res.body.data.createBlockStyle).toMatchSnapshot();
      })
      .expect(200);
  });

  test('update', async () => {
    blockstyleServiceMock.updateBlockStyle?.mockResolvedValue({
      ...mockBlockStyle,
      name: 'Bar',
    });

    await request(app.getHttpServer())
      .post('')
      .send({
        query: updateBlockStyleQuery,
        variables: {
          id: mockBlockStyle.id,
          name: 'Bar',
          blocks: ['Comment', 'Event'],
        } as UpdateBlockStyleInput,
      })
      .expect(res => {
        expect(
          blockstyleServiceMock.updateBlockStyle?.mock.calls[0]
        ).toMatchSnapshot();
        expect(res.body.data.updateBlockStyle).toMatchSnapshot();
      })
      .expect(200);
  });

  test('delete', async () => {
    blockstyleServiceMock.deleteBlockStyle?.mockResolvedValue(mockBlockStyle);

    await request(app.getHttpServer())
      .post('')
      .send({
        query: deleteBlockStyleQuery,
        variables: {
          id: '1234',
        },
      })
      .expect(res => {
        expect(
          blockstyleServiceMock.deleteBlockStyle?.mock.calls[0]
        ).toMatchSnapshot();
        expect(res.body.data.deleteBlockStyle).toMatchSnapshot();
      })
      .expect(200);
  });
});
