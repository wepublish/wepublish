import {Query, Resolver} from '@nestjs/graphql'

@Resolver()
export class TestQueryResolver {
  @Query(() => Boolean, {
    description: `This is test query used when testing mutation-only resolver.`
  })
  async testQuery() {
    return true
  }
}
