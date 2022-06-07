import {RichTextNode} from '../graphql/richText'
import {InputCursor, Limit, SortOrder} from './common'

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
  jobTitle?: string | null
  imageID?: string | null
  links: AuthorLink[]
  bio: RichTextNode[]
}

export interface AuthorInput {
  name: string
  slug: string
  jobTitle?: string | null
  imageID?: string | null
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
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt',
  Name = 'name'
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
}
