import {Module} from '@nestjs/common'
import {ApiModule} from '@wepublish/nest-modules'
import {GraphQLModule} from '@nestjs/graphql'
import GraphQLJSON from 'graphql-type-json'
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {
  SettingModule,
  DashboardModule,
  AuthenticationModule,
  PermissionModule,
  ConsentModule,
  EventsImportModule
} from '@wepublish/api'

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      resolvers: {JSON: GraphQLJSON},
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
    ConsentModule,
    SettingModule,
    EventsImportModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
