import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {Module} from '@nestjs/common'
import {GraphQLModule} from '@nestjs/graphql'
import {DashboardModule, MembershipModule} from '@wepublish/membership/api'
import {ApiModule} from '@wepublish/nest-modules'
import {
  SettingModule,
  AuthenticationModule,
  PermissionModule,
  BaseMailProvider,
  MailgunMailProvider
} from '@wepublish/api'
import {ScheduleModule} from '@nestjs/schedule'
import {MailsModule} from '@wepublish/mails'
import process from 'process'
import bodyParser from 'body-parser'
import Mailgun from 'mailgun.js'
import FormData from 'form-data'

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: './apps/api-example/schema-v2.graphql',
      sortSchema: true,
      path: 'v2',
      cors: {
        credentials: true,
        origin: true
      }
    }),
    MailsModule.forRoot({
      defaultReplyToAddress: process.env.MAILS_DEFAULT_REPLY_ADDRESS ?? '',
      defaultFromAddress: process.env.MAILS_DEFAULT_FROM_ADDRESS ?? ''
    }),
    ApiModule,
    MembershipModule,
    DashboardModule,
    AuthenticationModule,
    PermissionModule,
    SettingModule,
    ScheduleModule.forRoot()
  ],
  controllers: [],
  providers: [
    {
      provide: BaseMailProvider,
      useFactory: () =>
        new MailgunMailProvider({
          id: 'mailgun',
          name: 'Mailgun',
          fromAddress: 'dev@wepublish.ch',
          webhookEndpointSecret: process.env.MAILGUN_WEBHOOK_SECRET!,
          baseDomain: process.env.MAILGUN_BASE_DOMAIN!,
          mailDomain: process.env.MAILGUN_MAIL_DOMAIN!,
          apiKey: process.env.MAILGUN_API_KEY!,
          incomingRequestHandler: bodyParser.json(),
          mailgunClient: new Mailgun(FormData).client({
            username: 'api',
            key: process.env.MAILGUN_API_KEY || 'dev-api-key'
          })
        })
    }
  ]
})
export class AppModule {}
