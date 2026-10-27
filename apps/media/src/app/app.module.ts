import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import {
  MediaServiceModule,
  JwtAuthModule,
  UPLOAD_DISK,
  TRANSFORMATION_DISK,
  createStorageFetch,
  MediaLinkCacheModule,
} from '@wepublish/media/api';
import { DragonflyModule } from '@wepublish/dragonfly/api';
import { KvCacheModule } from '@wepublish/kv-ttl-cache/api';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { StorageModule, S3Disk } from '@nestjs/storage';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
    }),
    DragonflyModule.forRoot(),
    KvCacheModule.forRoot(),
    MediaLinkCacheModule,
    MulterModule.register({
      limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB
      },
    }),
    SentryModule.forRoot(),
    StorageModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const protocol = config.get('S3_SSL') ? 'https' : 'http';
        const endpoint = `${protocol}://${config.getOrThrow(
          'S3_ENDPOINT'
        )}:${config.getOrThrow('S3_PORT')}`;
        const shared = {
          endpoint,
          region: config.get('S3_REGION', 'us-east-1'),
          forcePathStyle: true,
          credentials: {
            accessKeyId: config.getOrThrow('S3_ACCESS_KEY'),
            secretAccessKey: config.getOrThrow('S3_SECRET_KEY'),
          },
          // One bounded dispatcher for both disks, so the socket cap covers
          // the whole R2 origin. See gotchas.md.
          fetch: createStorageFetch(),
        };

        return {
          default: TRANSFORMATION_DISK,
          disks: {
            [UPLOAD_DISK]: new S3Disk({
              ...shared,
              bucket: config.get('S3_UPLOAD_BUCKET', 'wepublish-staff'),
            }),
            [TRANSFORMATION_DISK]: new S3Disk({
              ...shared,
              bucket: config.get(
                'S3_TRANSFORMATION_BUCKET',
                'wepublish-transformed'
              ),
              publicUrl: config.getOrThrow('S3_PUBLIC_HOST'),
            }),
          },
        };
      },
      inject: [ConfigService],
    }),
    MediaServiceModule,
    JwtAuthModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        apiUrl: config.getOrThrow('API_URL'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
  exports: [],
})
export class AppModule {}
