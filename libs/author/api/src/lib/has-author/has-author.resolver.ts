import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {HasAuthor, HasOptionalAuthor} from './has-author.model'
import {Author} from '../author.model'

@Resolver(() => HasAuthor)
export class HasAuthorResolver {
  @ResolveField(() => Author, {nullable: true})
  public author(@Parent() {authorId}: HasOptionalAuthor | HasAuthor) {
    if (!authorId) {
      return null
    }

    return {
      __typename: 'Author',
      id: authorId
    }
  }
}

@Resolver(() => HasOptionalAuthor)
export class HasOptionalAuthorResolver extends HasAuthorResolver {}
