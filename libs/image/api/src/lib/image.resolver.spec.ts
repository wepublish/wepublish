import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { ImageResolver } from './image.resolver';
import { ImageDataloaderService } from './image-dataloader.service';
import { MediaAdapter } from './media-adapter';

const imageQuery = `
  query Image($id: String!) {
    image(id: $id) {
      id
      filename
    }
  }
`;

describe('ImageService', () => {
  let app: INestApplication;
  let imageDataloaderServiceMock: {
    [method in keyof ImageDataloaderService]?: jest.Mock;
  };
  let mediaAdapterMock: { getImageURL: jest.Mock };

  beforeEach(async () => {
    imageDataloaderServiceMock = {
      load: jest.fn(),
    };

    mediaAdapterMock = {
      getImageURL: jest.fn().mockReturnValue('https://example.com/image.jpg'),
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
        ImageResolver,
        {
          provide: ImageDataloaderService,
          useValue: imageDataloaderServiceMock,
        },
        {
          provide: MediaAdapter,
          useValue: mediaAdapterMock,
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

  test('image', async () => {
    imageDataloaderServiceMock.load?.mockResolvedValue({
      id: '123',
      filename: '123.webp',
    });

    await request(app.getHttpServer())
      .post('')
      .send({
        query: imageQuery,
        variables: {
          id: '1234',
        },
      })
      .expect(200)
      .expect(res => {
        expect(
          imageDataloaderServiceMock.load?.mock.calls[0]
        ).toMatchSnapshot();
        expect(res.body.data.getImage).toMatchSnapshot();
      });
  });
});
