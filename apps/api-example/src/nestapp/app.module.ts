import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {Module} from '@nestjs/common'
import {GraphQLModule} from '@nestjs/graphql'
import {MailProviderService, PrismaService} from '@wepublish/api'
import {ApiModule} from '@wepublish/nest-modules'
import {
  DashboardModule,
  MailTemplateModule,
  SubscriptionFlowModule
} from '@wepublish/membership/api'

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: './apps/api-example/schema-v2.graphql',
      sortSchema: true,
      path: 'v2'
    }),
    ApiModule,
    MailTemplateModule,
    SubscriptionFlowModule,
    DashboardModule
  ],
  controllers: [],
  providers: [PrismaService, MailProviderService]
})
export class AppModule {}
