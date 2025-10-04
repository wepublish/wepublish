import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { HasAuthor, HasOptionalAuthor } from './has-author.model';
import { Author } from '../author.model';
import { AuthorDataloaderService } from '../author-dataloader.service';

@Resolver(() => HasAuthor)
export class HasAuthorResolver {
  public constructor(
    private authorDataloaderService: AuthorDataloaderService
  ) {}

  @ResolveField(() => Author, { nullable: true })
  public author(@Parent() { authorId }: HasOptionalAuthor | HasAuthor) {
    if (!authorId) {
      return null;
    }

    return this.authorDataloaderService.load(authorId);
  }
}

@Resolver(() => HasOptionalAuthor)
export class HasOptionalAuthorResolver extends HasAuthorResolver {}
