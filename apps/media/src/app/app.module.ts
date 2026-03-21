import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import {
  MediaServiceModule,
  StorageClientModule,
  JwtAuthModule,
} from '@wepublish/media/api';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
    }),
    CacheModule.register({
      ttl: 259200,
      max: 1000000,
      isGlobal: true,
    }),
    MulterModule.register({}),
    MediaServiceModule.forRootAsync({
      imports: [
        SentryModule.forRoot(),
        StorageClientModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (config: ConfigService) => ({
            endPoint: config.getOrThrow('S3_ENDPOINT'),
            port: +config.getOrThrow('S3_PORT'),
            accessKey: config.getOrThrow('S3_ACCESS_KEY'),
            secretKey: config.getOrThrow('S3_SECRET_KEY'),
            publicHost: config.getOrThrow('S3_PUBLIC_HOST'),
            useSSL: Boolean(config.get('S3_SSL')),
            region: config.get('S3_REGION', 'us-east-1'),
          }),
          inject: [ConfigService],
        }),
        ConfigModule,
      ],
      useFactory: (config: ConfigService) => ({
        uploadBucket: config.get('S3_UPLOAD_BUCKET', 'wepublish-staff'),
        transformationBucket: config.get(
          'S3_TRANSFORMATION_BUCKET',
          'wepublish-transformed'
        ),
      }),
      inject: [ConfigService],
    }),
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
