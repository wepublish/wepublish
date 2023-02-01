import {Module} from '@nestjs/common'
import {ApiModule} from '@wepublish/nest-modules'
import {GraphQLModule} from '@nestjs/graphql'
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {MembershipApiModule} from '@wepublish/membership/api'
import {PrismaService} from '@wepublish/api'

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: './apps/api-example/schema-v2.graphql',
      sortSchema: true,
      path: 'v2'
    }),
    ApiModule,
    MembershipApiModule
  ],
  controllers: [],
  providers: [PrismaService]
})
export class AppModule {}
