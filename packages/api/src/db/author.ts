import {ConnectionResult, SortOrder, InputCursor, Limit} from './common'
import {RichTextNode} from '../graphql/richText'

export interface AuthorLink {
  title: string
  url: string
}

export interface Author {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly imageID?: string
  readonly links: AuthorLink[]
  readonly bio: RichTextNode[]
}

export interface AuthorInput {
  readonly name: string
  readonly slug: string
  readonly imageID?: string
  readonly links: AuthorLink[]
  readonly bio: RichTextNode[]
}

export type OptionalAuthor = Author | null

export interface CreateAuthorArgs {
  readonly input: AuthorInput
}

export interface UpdateAuthorArgs {
  readonly id: string
  readonly input: AuthorInput
}

export interface DeleteAuthorArgs {
  readonly id: string
}

export enum AuthorSort {
  CreatedAt = 'modifiedAt',
  ModifiedAt = 'modifiedAt'
}

export interface AuthorFilter {
  readonly name?: string
}

export interface GetAuthorsArgs {
  readonly cursor: InputCursor
  readonly limit: Limit
  readonly filter?: AuthorFilter
  readonly sort: AuthorSort
  readonly order: SortOrder
}

export interface DBAuthorAdapter {
  createAuthor(args: CreateAuthorArgs): Promise<Author>
  updateAuthor(args: UpdateAuthorArgs): Promise<OptionalAuthor>
  deleteAuthor(args: DeleteAuthorArgs): Promise<string | null>

  getAuthorsByID(ids: readonly string[]): Promise<OptionalAuthor[]>
  getAuthorsBySlug(slugs: readonly string[]): Promise<OptionalAuthor[]>

  getAuthors(args: GetAuthorsArgs): Promise<ConnectionResult<Author>>
}
