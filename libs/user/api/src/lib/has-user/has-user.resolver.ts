import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {HasUser, HasUserLc, HasOptionalUser, HasOptionalUserLc} from './has-user.model'
import {User} from '../user.model'

@Resolver(() => HasOptionalUser)
@Resolver(() => HasUser)
@Resolver(() => HasOptionalUserLc)
@Resolver(() => HasUserLc)
export class HasUserResolver {
  @ResolveField(() => User, {nullable: true})
  public user(@Parent() block: HasOptionalUser | HasUser | HasOptionalUserLc | HasUserLc) {
    const id = 'userId' in block ? block.userId : 'userID' in block ? block.userID : null

    if (!id) {
      return null
    }

    return {
      __typename: 'User',
      id
    }
  }
}
