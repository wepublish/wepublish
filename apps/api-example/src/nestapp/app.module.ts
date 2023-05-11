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
  EventsImportModule,
  MediaAdapterModule,
  MediaAdapterService,
  KarmaMediaAdapter
} from '@wepublish/api'
import {ConfigModule, ConfigService} from '@nestjs/config'
import {URL} from 'url'

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
    EventsImportModule,
    MediaAdapterModule,
    ConfigModule.forRoot()
  ],
  providers: [
    {
      provide: MediaAdapterService,
      useFactory: (config: ConfigService) => {
        const internalUrl = config.get('MEDIA_SERVER_INTERNAL_URL')

        return new KarmaMediaAdapter(
          new URL(config.getOrThrow('MEDIA_SERVER_URL')),
          config.getOrThrow('MEDIA_SERVER_TOKEN'),
          internalUrl ? new URL(internalUrl) : undefined
        )
      },
      inject: [ConfigService]
    }
  ]
})
export class AppModule {}
