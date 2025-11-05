import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Public } from '@wepublish/authentication/api';
import { Author } from './author.model';
import { AuthorService } from './author.service';
import { AuthorDataloaderService } from './author-dataloader.service';
import {
  AuthorArgs,
  AuthorsQueryArgs,
  PaginatedAuthors,
} from './authors.query';
import { URLAdapter } from '@wepublish/nest-modules';
import { AuthorTagDataloader, Tag } from '@wepublish/tag/api';
import { NotFoundException, BadRequestException } from '@nestjs/common';

@Resolver(() => Author)
export class AuthorResolver {
  constructor(
    private authorService: AuthorService,
    private authorDataloader: AuthorDataloaderService,
    private tagDataLoader: AuthorTagDataloader,
    private urlAdapter: URLAdapter
  ) {}

  @Public()
  @Query(() => Author, {
    nullable: true,
    description: 'Get an author by ID or slug',
  })
  async author(@Args() args: AuthorArgs) {
    if (args.id != null) {
      const author = await this.authorDataloader.load(args.id);

      if (!author) {
        throw new NotFoundException(`Author with id ${args.id} was not found.`);
      }

      return author;
    }

    if (args.slug != null) {
      const author = await this.authorService.getAuthorBySlug(args.slug);

      if (!author) {
        throw new NotFoundException(
          `Author with slug ${args.slug} was not found.`
        );
      }

      return author;
    }

    throw new BadRequestException('Author id or slug required.');
  }

  @Public()
  @Query(() => PaginatedAuthors, {
    description:
      'Get a paginated list of authors with optional filtering and sorting',
  })
  async authors(@Args() args: AuthorsQueryArgs) {
    return this.authorService.getAuthors(
      args.filter,
      args.sort,
      args.order,
      args.cursor || null,
      args.skip || 0,
      args.take || 10
    );
  }

  @ResolveField(() => String, { nullable: true })
  async url(@Parent() parent: Author) {
    return this.urlAdapter.getAuthorURL(parent);
  }

  @ResolveField(() => [Tag])
  async tags(@Parent() parent: Author) {
    return this.tagDataLoader.load(parent.id);
  }
}
