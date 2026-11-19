import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Author, AuthorDataloaderService } from '@wepublish/author/api';

import { AuthorsBlock } from './authors-block.model';

@Resolver(() => AuthorsBlock)
export class AuthorsBlockResolver {
  constructor(private authorDataloader: AuthorDataloaderService) {}

  /** The chosen authors in the chosen order, without deleted ones */
  @ResolveField(() => [Author])
  async authors(@Parent() { authorIds }: AuthorsBlock) {
    if (!authorIds?.length) {
      return [];
    }

    const authors = await this.authorDataloader.loadMany(authorIds);

    return authors.filter(author => author && !(author instanceof Error));
  }

  @ResolveField(() => [String])
  async authorIds(@Parent() { authorIds }: AuthorsBlock): Promise<string[]> {
    if (!authorIds?.length) {
      return [];
    }

    const authors = await this.authorDataloader.loadMany(authorIds);

    return authorIds.filter(
      (_id, index) => authors[index] && !(authors[index] instanceof Error)
    );
  }
}
