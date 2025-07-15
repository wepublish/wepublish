import {Args, Parent, Query, ResolveField, Resolver} from '@nestjs/graphql'
import {Public} from '@wepublish/authentication/api'
import {Author} from './author.model'
import {AuthorService} from './author.service'
import {AuthorDataloaderService} from './author-dataloader.service'
import {UserInputError} from '@nestjs/apollo'
import {AuthorArgs, AuthorsQueryArgs, PaginatedAuthors} from './authors.query'
import {URLAdapter} from '@wepublish/nest-modules'
import {Tag, TagService} from '@wepublish/tag/api'

@Resolver(() => Author)
export class AuthorResolver {
  constructor(
    private authorService: AuthorService,
    private authorDataloader: AuthorDataloaderService,
    private tagService: TagService,
    private urlAdapter: URLAdapter
  ) {}

  @Public()
  @Query(() => Author, {
    nullable: true,
    description: 'Get an author by ID or slug'
  })
  async author(@Args() args: AuthorArgs) {
    let author
    if (args.id) {
      author = await this.authorDataloader.load(args.id)
    } else if (args.slug) {
      author = await this.authorService.getAuthorBySlug(args.slug)
    } else {
      throw new UserInputError('You must provide either `id` or `slug`.')
    }

    if (!author) {
      throw new UserInputError('Author not found')
    }

    return author
  }

  @Public()
  @Query(() => PaginatedAuthors, {
    description: 'Get a paginated list of authors with optional filtering and sorting'
  })
  async authors(@Args() args: AuthorsQueryArgs) {
    return this.authorService.getAuthors(
      args.filter,
      args.sort,
      args.order,
      args.cursor || null,
      args.skip || 0,
      args.take || 10
    )
  }

  @ResolveField(() => String, {nullable: true})
  async url(@Parent() parent: Author) {
    return this.urlAdapter.getAuthorURL(parent)
  }

  @ResolveField(() => [Tag])
  async tags(@Parent() parent: Author) {
    const {id: articleId} = parent
    return this.tagService.getTagsByAuthorId(articleId)
  }
}
