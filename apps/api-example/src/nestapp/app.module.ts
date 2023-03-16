import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {Module} from '@nestjs/common'
import {GraphQLModule} from '@nestjs/graphql'
import {MembershipModule} from '@wepublish/membership/api'
import {ApiModule} from '@wepublish/nest-modules'
import {
  SettingModule,
  DashboardModule,
  AuthenticationModule,
  PermissionModule,
  OldContextService,
  PrismaService
} from '@wepublish/api'

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
    ApiModule,
    MembershipModule,
    DashboardModule,
    AuthenticationModule,
    PermissionModule,
    SettingModule
  ],
  controllers: [],
  providers: [PrismaService, OldContextService]
})
export class AppModule {}
