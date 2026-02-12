import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Public } from '@wepublish/authentication/api';
import { Author, CreateAuthorInput, UpdateAuthorInput } from './author.model';
import { AuthorService } from './author.service';
import { AuthorDataloaderService } from './author-dataloader.service';
import { AuthorArgs, AuthorListArgs, PaginatedAuthors } from './author.model';
import { URLAdapter } from '@wepublish/nest-modules';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Permissions } from '@wepublish/permissions/api';
import { CanCreateAuthor, CanDeleteAuthor } from '@wepublish/permissions';
import { AuthorTagDataloader, Tag } from '@wepublish/tag/api';
import { Author as PAuthor } from '@prisma/client';

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
  async authors(@Args() args: AuthorListArgs) {
    return this.authorService.getAuthors(args);
  }

  @Permissions(CanCreateAuthor)
  @Mutation(returns => Author, { description: `Creates a new author.` })
  public createAuthor(@Args() author: CreateAuthorInput) {
    return this.authorService.createAuthor(author);
  }

  @Permissions(CanCreateAuthor)
  @Mutation(returns => Author, { description: `Updates an existing author.` })
  public updateAuthor(@Args() author: UpdateAuthorInput) {
    return this.authorService.updateAuthor(author);
  }

  @Permissions(CanDeleteAuthor)
  @Mutation(returns => Author, { description: `Deletes an existing author.` })
  public deleteAuthor(@Args('id') id: string) {
    return this.authorService.deleteAuthor(id);
  }

  @ResolveField(() => [Tag])
  async tags(@Parent() parent: PAuthor) {
    return this.tagDataLoader.load(parent.id);
  }

  @ResolveField(() => String, { nullable: true })
  async url(@Parent() parent: PAuthor) {
    return this.urlAdapter.getAuthorURL(parent);
  }
}
