import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {Module} from '@nestjs/common'
import {GraphQLModule} from '@nestjs/graphql'
import {DashboardModule, MembershipModule} from '@wepublish/membership/api'
import {ApiModule} from '@wepublish/nest-modules'
import {SettingModule, AuthenticationModule, PermissionModule} from '@wepublish/api'
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
  providers: []
})
export class AppModule {}
