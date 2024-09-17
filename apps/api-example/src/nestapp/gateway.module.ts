import {IntrospectAndCompose, RemoteGraphQLDataSource} from '@apollo/gateway'
import {ApolloGatewayDriver, ApolloGatewayDriverConfig} from '@nestjs/apollo'
import {Module} from '@nestjs/common'
import {GraphQLModule} from '@nestjs/graphql'
import {ConfigModule, ConfigService} from '@nestjs/config'
import {readConfig} from '../readConfig'
import {HealthModule} from '@wepublish/health'
import {ScriptsModule} from '@wepublish/scripts/api'
import {HttpModule} from '@nestjs/axios'

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const configFile = await readConfig(config.getOrThrow('CONFIG_FILE_PATH'))
        return {
          server: {
            sortSchema: true,
            path: 'v1',
            cache: 'bounded',
            allowBatchedHttpRequests: true,
            playground: configFile.general.apolloPlayground
              ? configFile.general.apolloPlayground
              : false,
            introspection: configFile.general.apolloIntrospection
              ? configFile.general.apolloIntrospection
              : false
          },
          gateway: {
            buildService: ({name, url}) => {
              return new RemoteGraphQLDataSource({
                url,
                willSendRequest({request, context}) {
                  if (context.req && context.req.headers) {
                    Object.keys(context.req.headers).forEach(key => {
                      request.http.headers.set(key, context.req.headers[key])
                    })
                  }
                }
              })
            },
            supergraphSdl: new IntrospectAndCompose({
              subgraphs: [
                {name: 'v1', url: `http://localhost:${getPort()}/v1`},
                {name: 'v2', url: `http://localhost:${getPort()}/v2`}
              ]
            })
          }
        }
      }
    }),
    HttpModule,
    HealthModule,
    ScriptsModule
  ]
})
export class GatewayModule {}

function getPort() {
  const port = process.env.PORT ?? 4000
  return +port + 1
}
