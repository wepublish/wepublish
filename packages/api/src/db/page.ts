import {PageBlock} from './block'
import {MetadataProperty} from '@prisma/client'

// TODO: Remove arg interfaces in favor of explicit arguments.

export interface PageData {
  readonly updatedAt?: Date | null
  readonly publishedAt?: Date | null

  readonly slug: string

  readonly title: string
  readonly description?: string | null
  readonly tags: string[]

  readonly properties: MetadataProperty[]

  readonly imageID?: string | null

  readonly socialMediaTitle?: string | null
  readonly socialMediaDescription?: string | null
  readonly socialMediaImageID?: string | null

  readonly blocks: PageBlock[]
}

// Page State Flow:
// Draft -> Pending (Optional) -> Published
export interface Page {
  readonly id: string

  readonly createdAt: Date
  readonly modifiedAt: Date

  readonly draft: PageRevision | null
  readonly published: PageRevision | null
  readonly pending: PageRevision | null
}

export interface PageRevision extends PageData {
  readonly revision: number

  readonly createdAt: Date
  readonly publishAt?: Date | null
}

export interface PublicPage extends PageData {
  readonly id: string

  readonly updatedAt?: Date | null
  readonly publishedAt?: Date | null

  readonly blocks: PageBlock[]
}

export interface PageFilter {
  readonly title?: string
  readonly draft?: boolean
  readonly published?: boolean
  readonly pending?: boolean
  readonly tags?: string[]
}

export interface PublishedPageFilter {
  readonly tags?: string[]
}

export enum PageSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt',
  PublishedAt = 'publishedAt',
  UpdatedAt = 'updatedAt',
  PublishAt = 'publishAt'
}
