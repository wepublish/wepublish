import {DynamicModule, Module, Provider} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {MailContext} from './mail-context'
import {BaseMailProvider} from './mail-provider/base-mail-provider'
import {
  MAILS_MODULE_OPTIONS,
  MailsModuleAsyncOptions,
  MailsModuleOptions
} from './mails-module-options'
import {PrismaClient} from '@prisma/client'
import {createAsyncOptionsProvider} from '@wepublish/utils'

@Module({
  imports: [PrismaModule],
  providers: [],
  exports: [MailContext]
})
export class MailsModule {
  static registerAsync(options: MailsModuleAsyncOptions): DynamicModule {
    return {
      module: MailsModule,
      global: options.global,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options)
    }
  }

  private static createAsyncProviders(options: MailsModuleAsyncOptions): Provider[] {
    return [
      createAsyncOptionsProvider<MailsModuleOptions>(MAILS_MODULE_OPTIONS, options),
      {
        provide: MailContext,
        useFactory: (
          {defaultFromAddress, defaultReplyToAddress}: MailsModuleOptions,
          prisma: PrismaClient,
          mailProvider: BaseMailProvider
        ) =>
          new MailContext({
            prisma,
            mailProvider,
            defaultFromAddress,
            defaultReplyToAddress
          }),
        inject: [MAILS_MODULE_OPTIONS, PrismaClient, BaseMailProvider]
      }
    ]
  }
}
