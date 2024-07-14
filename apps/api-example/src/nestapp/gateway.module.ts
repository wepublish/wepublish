import {IntrospectAndCompose, RemoteGraphQLDataSource} from '@apollo/gateway'
import {ApolloGatewayDriver, ApolloGatewayDriverConfig} from '@nestjs/apollo'
import {Module} from '@nestjs/common'
import {GraphQLModule} from '@nestjs/graphql'

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      server: {
        introspection: true,
        playground: true,
        path: '/'
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
            {name: 'v1', url: process.env.HOST_URL + '/v1'},
            {name: 'v2', url: process.env.HOST_URL + '/v2'}
          ]
        })
      }
    })
  ]
})
export class GatewayModule {}
