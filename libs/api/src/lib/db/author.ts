import {RichTextNode} from '@wepublish/richtext/api'

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

export enum AuthorSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt',
  Name = 'name'
}

export interface AuthorFilter {
  name?: string
}
