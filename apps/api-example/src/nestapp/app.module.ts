import {Module} from '@nestjs/common'
import {ApiModule} from '@wepublish/nest-modules'
import {GraphQLModule} from '@nestjs/graphql'
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {DashboardModule} from '@wepublish/membership/api'
import {ConsentModule} from '@wepublish/consent/api'
import {AuthenticationModule} from '@wepublish/authentication/api'
import {PermissionModule} from '@wepublish/permissions/api'

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
    DashboardModule,
    AuthenticationModule,
    PermissionModule,
    ConsentModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
