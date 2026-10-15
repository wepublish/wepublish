import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  Provider,
} from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { MailContext } from './mail-context';
import {
  MAILS_MODULE_OPTIONS,
  MailsModuleAsyncOptions,
  MailsModuleOptions,
} from './mails-module-options';
import { PrismaClient } from '@prisma/client';
import { createAsyncOptionsProvider } from '@wepublish/utils/api';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { MailWebhookController, MailWebhookMiddleware } from './mail.webhook';
import {
  EMAIL_QUALITY_RECORDER,
  EmailQualityRecorder,
} from './email-quality-recorder';

@Module({
  imports: [PrismaModule],
  controllers: [MailWebhookController],
  providers: [MailWebhookMiddleware],
  exports: [MailContext],
})
export class MailsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MailWebhookMiddleware).forRoutes(MailWebhookController);
  }

  static registerAsync(options: MailsModuleAsyncOptions): DynamicModule {
    return {
      module: MailsModule,
      global: options.global,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(
    options: MailsModuleAsyncOptions
  ): Provider[] {
    return [
      MailWebhookMiddleware,
      createAsyncOptionsProvider<MailsModuleOptions>(
        MAILS_MODULE_OPTIONS,
        options
      ),
      {
        provide: MailContext,
        useFactory: (
          { mailProvider, jwtGenerator }: MailsModuleOptions,
          prisma: PrismaClient,
          kv: KvTtlCacheService,
          emailQualityRecorder?: EmailQualityRecorder
        ) =>
          new MailContext({
            prisma,
            mailProvider,
            kv,
            jwtGenerator,
            emailQualityRecorder,
          }),
        inject: [
          MAILS_MODULE_OPTIONS,
          PrismaClient,
          KvTtlCacheService,
          { token: EMAIL_QUALITY_RECORDER, optional: true },
        ],
      },
    ];
  }
}
