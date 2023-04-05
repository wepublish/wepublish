import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {Module} from '@nestjs/common'
import {GraphQLModule} from '@nestjs/graphql'
import {DashboardModule, MembershipModule} from '@wepublish/membership/api'
import {ApiModule} from '@wepublish/nest-modules'
import {OldContextService, PrismaService} from '@wepublish/api'
import {AuthenticationModule} from '@wepublish/authentication/api'
import {PermissionModule} from '@wepublish/permissions/api'
import {SettingModule} from '@wepublish/settings/api'
import {ScheduleModule} from '@nestjs/schedule'

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
    SettingModule,
    ScheduleModule.forRoot()
  ],
  controllers: [],
  providers: [PrismaService, OldContextService]
})
export class AppModule {}
