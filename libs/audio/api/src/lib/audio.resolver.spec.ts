import { ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { NodeAdapter } from '@nestjs/platform-node';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { FeaturesService } from '@wepublish/features/api';
import { MediaAdapter } from '@wepublish/image/api';
import { createMock, PartialMocked } from '@wepublish/testing';
import { NodeApolloDriver } from '@wepublish/utils/api';
import request from 'supertest';
import { AudioResolver } from './audio.resolver';
import { AudioService } from './audio.service';
import { AudioUploadService } from './audio-upload.service';

describe('AudioResolver', () => {
  let app: INestApplication;
  let audios: PartialMocked<AudioService>;
  let uploads: PartialMocked<AudioUploadService>;
  const features = { isEnabled: vi.fn() };

  const gql = (query: string) =>
    request(app.getHttpServer()).post('/').send({ query });

  beforeAll(async () => {
    audios = createMock(AudioService);
    uploads = createMock(AudioUploadService);

    const module = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: NodeApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
        }),
      ],
      providers: [
        AudioResolver,
        { provide: AudioService, useValue: audios },
        { provide: AudioUploadService, useValue: uploads },
        { provide: MediaAdapter, useValue: {} },
        { provide: PrismaClient, useValue: {} },
        { provide: FeaturesService, useValue: features },
      ],
    }).compile();

    app = module.createNestApplication(new NodeAdapter());
    await app.listen(0, '127.0.0.1');
  });

  beforeEach(() => {
    features.isEnabled.mockResolvedValue(true);
  });

  afterAll(() => app.close());

  it('refuses to list audios while the video-audio-uploads feature is off', async () => {
    features.isEnabled.mockResolvedValue(false);

    const { body } = await gql(`query { audioStorageUsage { usedBytes } }`);

    expect(body.errors?.[0].message).toBe(
      'Feature "video-audio-uploads" is not enabled for this medium'
    );
    expect(features.isEnabled).toHaveBeenCalledWith('video-audio-uploads');
    expect(uploads.getStorageUsage).not.toHaveBeenCalled();
  });

  it('refuses mutations while the video-audio-uploads feature is off', async () => {
    features.isEnabled.mockResolvedValue(false);

    const { body } = await gql(`mutation { deleteAudio(id: "audio-1") }`);

    expect(body.errors?.[0].message).toBe(
      'Feature "video-audio-uploads" is not enabled for this medium'
    );
    expect(audios.deleteAudio).not.toHaveBeenCalled();
  });

  it('answers once the feature is on', async () => {
    uploads.getStorageUsage?.mockResolvedValue({
      usedBytes: 10,
      limitBytes: 100,
    });

    const { body } = await gql(`query { audioStorageUsage { usedBytes } }`);

    expect(body.errors).toBeUndefined();
    expect(body.data.audioStorageUsage).toEqual({ usedBytes: 10 });
  });
});
