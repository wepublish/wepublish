import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  Provider,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { FeaturesService } from '@wepublish/features/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { LETTER_SENDER } from '@wepublish/mail/api';
import { createAsyncOptionsProvider } from '@wepublish/utils/api';
import { GatedLetterSender } from './gated-letter-sender';
import { LetterContext } from './letter-context';
import { LetterLayoutResolver } from './letter-layout/letter-layout.resolver';
import { LetterLayoutService } from './letter-layout/letter-layout.service';
import {
  LetterWebhookController,
  LetterWebhookMiddleware,
} from './letter.webhook';
import {
  LETTERS_MODULE_OPTIONS,
  LettersModuleAsyncOptions,
  LettersModuleOptions,
} from './letters-module-options';

@Module({
  imports: [PrismaModule],
  controllers: [LetterWebhookController],
  providers: [LetterWebhookMiddleware],
  exports: [LetterContext],
})
export class LettersModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LetterWebhookMiddleware).forRoutes(LetterWebhookController);
  }

  static registerAsync(options: LettersModuleAsyncOptions): DynamicModule {
    return {
      module: LettersModule,
      global: options.global,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
      exports: [LetterContext, LETTER_SENDER],
    };
  }

  private static createAsyncProviders(
    options: LettersModuleAsyncOptions
  ): Provider[] {
    return [
      LetterWebhookMiddleware,
      // Stationery lives here because its preview needs the LetterContext the
      // factory below builds.
      LetterLayoutService,
      LetterLayoutResolver,
      createAsyncOptionsProvider<LettersModuleOptions>(
        LETTERS_MODULE_OPTIONS,
        options
      ),
      {
        provide: LetterContext,
        useFactory: (
          { letterProvider, pdfRenderer, documentUrl }: LettersModuleOptions,
          prisma: PrismaClient
        ) =>
          new LetterContext({
            letterProvider,
            pdfRenderer,
            prisma,
            documentUrl,
          }),
        inject: [LETTERS_MODULE_OPTIONS, PrismaClient],
      },
      // The mail lib prints automated mails for users in letter mode through
      // this; it only knows the token, not this lib.
      {
        provide: LETTER_SENDER,
        useFactory: (context: LetterContext, features: FeaturesService) =>
          new GatedLetterSender(context, features),
        inject: [LetterContext, FeaturesService],
      },
    ];
  }
}
