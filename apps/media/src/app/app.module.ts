import {Module} from '@nestjs/common'

import {AppController} from './app.controller'
import {MediaServiceModule, StorageClientModule, TokenModule} from '@wepublish/media/api'
import {ConfigModule, ConfigService} from '@nestjs/config'
import {MulterModule} from '@nestjs/platform-express'
import {PassportModule} from '@nestjs/passport'

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true
    }),
    MulterModule.register({}),
    MediaServiceModule.forRootAsync({
      imports: [
        StorageClientModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (config: ConfigService) => ({
            endPoint: config.getOrThrow('S3_ENDPOINT'),
            port: +config.getOrThrow('S3_PORT'),
            accessKey: config.getOrThrow('S3_ACCESS_KEY'),
            secretKey: config.getOrThrow('S3_SECRET_KEY'),
            useSSL: Boolean(config.get('S3_SSL')),
            region: config.get('S3_REGION', 'us-east-1')
          }),
          inject: [ConfigService]
        }),
        ConfigModule
      ],
      useFactory: (config: ConfigService) => ({
        uploadBucket: config.get('S3_UPLOAD_BUCKET', 'wepublish-staff'),
        transformationBucket: config.get('S3_TRANSFORMATION_BUCKET', 'wepublish-transformed')
      }),
      inject: [ConfigService]
    }),
    TokenModule.registerAsync({
      imports: [ConfigModule, PassportModule],
      useFactory: (config: ConfigService) => ({
        token: config.getOrThrow('TOKEN')
      }),
      inject: [ConfigService]
    })
  ],
  controllers: [AppController]
})
export class AppModule {}
