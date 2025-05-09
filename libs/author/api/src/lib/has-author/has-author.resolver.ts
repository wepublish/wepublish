import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {HasAuthor, HasOptionalAuthor} from './has-author.model'
import {Author} from '../author.model'
import {AuthorDataloader} from '../author-dataloader'

@Resolver(() => HasAuthor)
export class HasAuthorResolver {
  constructor(private dataloader: AuthorDataloader) {}

  @ResolveField(() => Author, {nullable: true})
  public author(@Parent() {authorId}: HasOptionalAuthor | HasAuthor) {
    if (!authorId) {
      return null
    }

    return this.dataloader.load(authorId)
  }
}

@Resolver(() => HasOptionalAuthor)
export class HasOptionalAuthorResolver extends HasAuthorResolver {}
