import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CreateTokenInput,
  Token,
  TokenWithSecret,
  UpdateTokenInput,
} from './token.model';
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

  // whoever may create a token may set what it is allowed to do
  @Permissions(CanCreateToken)
  @Mutation(() => Token, {
    description:
      'Renames a token or replaces its roles. Cached sessions of the token are cleared, so new roles apply at once.',
  })
  async updateToken(@Args() input: UpdateTokenInput) {
    return this.service.updateToken(input);
  }

  @Permissions(CanDeleteToken)
  @Mutation(() => Token, {
    description: 'Deletes a token.',
  })
  async deleteToken(@Args('id') id: string) {
    return this.service.deleteToken(id);
  }
}
