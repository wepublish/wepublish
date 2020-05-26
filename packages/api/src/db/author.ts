import {ConnectionResult, SortOrder, InputCursor, Limit} from './common'
import {RichTextNode} from '../graphql/richText'

export interface AuthorLink {
  title: string
  url: string
}

export interface Author {
  id: string
  createdAt: Date
  modifiedAt: Date
  name: string
  slug: string
  imageID?: string
  links: AuthorLink[]
  bio: RichTextNode[]
}

export interface AuthorInput {
  name: string
  slug: string
  imageID?: string
  links: AuthorLink[]
  bio: RichTextNode[]
}

export type OptionalAuthor = Author | null

export interface CreateAuthorArgs {
  input: AuthorInput
}

export interface UpdateAuthorArgs {
  id: string
  input: AuthorInput
}

export interface DeleteAuthorArgs {
  id: string
}

export enum AuthorSort {
  CreatedAt = 'modifiedAt',
  ModifiedAt = 'modifiedAt'
}

export interface AuthorFilter {
  name?: string
}

export interface GetAuthorsArgs {
  cursor: InputCursor
  limit: Limit
  filter?: AuthorFilter
  sort: AuthorSort
  order: SortOrder
}

export interface DBAuthorAdapter {
  createAuthor(args: CreateAuthorArgs): Promise<Author>
  updateAuthor(args: UpdateAuthorArgs): Promise<OptionalAuthor>
  deleteAuthor(args: DeleteAuthorArgs): Promise<string | null>

  getAuthorsByID(ids: readonly string[]): Promise<OptionalAuthor[]>
  getAuthorsBySlug(slugs: readonly string[]): Promise<OptionalAuthor[]>

  getAuthors(args: GetAuthorsArgs): Promise<ConnectionResult<Author>>
}
