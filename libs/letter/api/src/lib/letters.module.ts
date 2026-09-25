import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  Provider,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '@wepublish/nest-modules';
import { createAsyncOptionsProvider } from '@wepublish/utils/api';
import { LetterContext } from './letter-context';
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
      exports: [LetterContext],
    };
  }

  private static createAsyncProviders(
    options: LettersModuleAsyncOptions
  ): Provider[] {
    return [
      LetterWebhookMiddleware,
      createAsyncOptionsProvider<LettersModuleOptions>(
        LETTERS_MODULE_OPTIONS,
        options
      ),
      {
        provide: LetterContext,
        useFactory: (
          { letterProvider, pdfRenderer }: LettersModuleOptions,
          prisma: PrismaClient
        ) => new LetterContext({ letterProvider, pdfRenderer, prisma }),
        inject: [LETTERS_MODULE_OPTIONS, PrismaClient],
      },
    ];
  }
}
