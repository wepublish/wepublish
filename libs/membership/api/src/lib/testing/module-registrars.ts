import {PrismaClient} from '@prisma/client'
import {DynamicModule} from '@nestjs/common'
import {PrismaModule, PrismaService} from '@wepublish/nest-modules'
import {MailsModule} from '@wepublish/mails'
import {FakeMailProvider} from './FakeMailProvider'

export function registerPrismaModule(prismaClient: PrismaClient): DynamicModule {
  return {
    module: PrismaModule,
    providers: [
      {
        provide: PrismaClient,
        useFactory: () => prismaClient as PrismaService
      }
    ],
    exports: [PrismaService]
  }
}

export function registerMailsModule(): DynamicModule {
  return MailsModule.registerAsync({
    useFactory: () => ({
      defaultReplyToAddress: 'test@exmaple.com',
      defaultFromAddress: 'test@exmaple.com',
      mailProvider: new FakeMailProvider({
        id: 'fakeMail',
        name: 'Fake Mail',
        fromAddress: 'fakeMail@wepublish.media'
      })
    })
  })
}
