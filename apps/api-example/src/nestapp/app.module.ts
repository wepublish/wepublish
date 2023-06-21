import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {Global, Module} from '@nestjs/common'
import {ConfigModule, ConfigService} from '@nestjs/config'
import {GraphQLModule} from '@nestjs/graphql'
import {
  AgendaBaselService,
  AuthenticationModule,
  ConsentModule,
  DashboardModule,
  EventsImportModule,
  KarmaMediaAdapter,
  MediaAdapterService,
  PermissionModule,
  SettingModule
} from '@wepublish/api'
import {ApiModule} from '@wepublish/nest-modules'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {URL} from 'url'
import {JobsModule} from '@wepublish/jobs'

@Global()
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      resolvers: {RichText: GraphQLRichText},
      autoSchemaFile: './apps/api-example/schema-v2.graphql',
      sortSchema: true,
      path: 'v2',
      cors: {
        credentials: true,
        origin: true
      },
      cache: 'bounded'
    }),
    ApiModule,
    DashboardModule,
    AuthenticationModule,
    PermissionModule,
    ConsentModule,
    SettingModule,
    EventsImportModule.registerAsync({
      useFactory: (agendaBasel: AgendaBaselService) => [agendaBasel],
      inject: [AgendaBaselService]
    }),
    JobsModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        databaseUrl: config.getOrThrow('DATABASE_URL')
      }),
      inject: [ConfigService]
    }),
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
  ],
  exports: [MediaAdapterService]
})
export class AppModule {}
