import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  Provider,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
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
import { OrganisationResolver } from './organisation/organisation.resolver';
import { OrganisationService } from './organisation/organisation.service';
import { QrBillService } from './qr-bill/qr-bill.service';

@Module({
  imports: [PrismaModule],
  controllers: [LetterWebhookController],
  providers: [LetterWebhookMiddleware],
  exports: [LetterContext, OrganisationService, QrBillService],
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
      exports: [LetterContext, OrganisationService, QrBillService],
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
        provide: OrganisationService,
        useFactory: (prisma: PrismaClient, kv: KvTtlCacheService) =>
          new OrganisationService(prisma, kv),
        inject: [PrismaClient, KvTtlCacheService],
      },
      OrganisationResolver,
      {
        provide: QrBillService,
        useFactory: (prisma: PrismaClient, organisation: OrganisationService) =>
          new QrBillService(prisma, organisation),
        inject: [PrismaClient, OrganisationService],
      },
      {
        provide: LetterContext,
        useFactory: (
          { letterProvider, pdfRenderer }: LettersModuleOptions,
          prisma: PrismaClient,
          qrBill: QrBillService,
          organisation: OrganisationService
        ) =>
          new LetterContext({
            letterProvider,
            pdfRenderer,
            prisma,
            qrBill,
            organisation,
          }),
        inject: [
          LETTERS_MODULE_OPTIONS,
          PrismaClient,
          QrBillService,
          OrganisationService,
        ],
      },
    ];
  }
}
