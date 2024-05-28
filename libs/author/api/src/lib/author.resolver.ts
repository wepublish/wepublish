import {Resolver, Query, Mutation, Args} from '@nestjs/graphql'
import {AuthorService} from './author.service'
import {
  Author,
  AuthorByIdArgs,
  AuthorBySlugArgs,
  CreateAuthorArgs,
  GetAuthorsArgs,
  PaginatedAuthors,
  UpdateAuthorArgs
} from './author.model'
import {
  CanCreateAuthor,
  CanDeleteAuthor,
  CanGetAuthor,
  Permissions
} from '@wepublish/permissions/api'
import {AuthorDataloader} from './author.dataloader'
import {UserInputError} from '@nestjs/apollo'

@Resolver(() => Author)
export class AuthorResolver {
  constructor(
    private readonly authorService: AuthorService,
    private readonly authorDataloader: AuthorDataloader
  ) {}

  @Query(returns => Author)
  @Permissions(CanGetAuthor)
  async getAuthorsById(@Args() {id}: AuthorByIdArgs) {
    const author = await this.authorDataloader.load(id)
    if (null === author) {
      throw new UserInputError('Author not found')
    }
    return author
  }

  @Query(returns => Author)
  @Permissions(CanGetAuthor)
  async getAuthorBySlug(@Args() {slug}: AuthorBySlugArgs) {
    const author = await this.authorService.getAuthorBySlug(slug)
    if (null === author) {
      throw new UserInputError('Author not found')
    }
    return author
  }

  @Query(returns => PaginatedAuthors)
  @Permissions(CanGetAuthor)
  async getAuthors(@Args() args: GetAuthorsArgs) {
    return await this.authorService.getAuthors(args)
  }

  @Mutation(returns => Author)
  @Permissions(CanCreateAuthor)
  async createAuthor(@Args() {author}: CreateAuthorArgs) {
    return this.authorService.createAuthor(author)
  }

  @Mutation(returns => Author)
  @Permissions(CanCreateAuthor)
  async updateAuthor(@Args() {author}: UpdateAuthorArgs) {
    return this.authorService.updateAuthor(author)
  }

  @Mutation(returns => Author)
  @Permissions(CanDeleteAuthor)
  async deleteAuthor(@Args() {id}: AuthorByIdArgs) {
    return this.authorService.deleteAuthorById(id)
  }
}
