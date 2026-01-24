import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateTokenInput, Token, TokenWithSecret } from './token.model';
import { TokenService } from './token.service';
import { Permissions } from '@wepublish/permissions/api';
import {
  CanCreateToken,
  CanDeleteToken,
  CanGetTokens,
} from '@wepublish/permissions';

@Resolver(() => Token)
export class TokenResolver {
  constructor(private service: TokenService) {}

  @Permissions(CanGetTokens)
  @Query(() => [Token], {
    description: 'Returns a list of all tokens.',
  })
  async tokens() {
    return this.service.getTokens();
  }

  @Permissions(CanCreateToken)
  @Mutation(() => TokenWithSecret, {
    description: "Creates a token and returns it's secret once.",
  })
  async createToken(@Args() input: CreateTokenInput) {
    return this.service.createToken(input);
  }

  @Permissions(CanDeleteToken)
  @Mutation(() => Token, {
    description: 'Deletes a token.',
  })
  async deleteToken(@Args('id') id: string) {
    return this.service.deleteToken(id);
  }
}
