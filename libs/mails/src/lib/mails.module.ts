import {DynamicModule, Module} from '@nestjs/common'
import {PrismaModule, PrismaService} from '@wepublish/nest-modules'
import {MailContext} from './mail-context'
import {BaseMailProvider} from './mail-provider/base-mail-provider'

type MailsModuleProps = {
  defaultFromAddress: string
  defaultReplyToAddress: string
}

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: MailContext,
      useFactory: (prisma: PrismaService, mailProvider: BaseMailProvider) => {
        return new MailContext({
          prisma,
          mailProvider,
          defaultFromAddress: 'ff',
          defaultReplyToAddress: 'ff'
        })
      },
      inject: [PrismaService, BaseMailProvider]
    }
  ],
  exports: [MailContext]
})
export class MailsModule {
  static forRoot({defaultFromAddress, defaultReplyToAddress}: MailsModuleProps): DynamicModule {
    return {
      module: MailsModule,
      providers: [
        {
          provide: MailContext,
          useFactory: (prisma: PrismaService, mailProvider: BaseMailProvider) => {
            return new MailContext({
              prisma,
              mailProvider,
              defaultFromAddress,
              defaultReplyToAddress
            })
          },
          inject: [PrismaService, BaseMailProvider]
        }
      ],
      exports: [MailContext]
    }
  }
}
