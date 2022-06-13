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
// Draft -> Pending (Optional) -> Published -> History
export interface Page {
  readonly id: string

  readonly createdAt: Date
  readonly modifiedAt: Date

  readonly draft: PageRevision | null
  readonly published: PageRevision | null
  readonly pending: PageRevision | null
}

export interface PageHistory {
  readonly id: string
  readonly revisions: PageRevision[]
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
export interface GetPageHistoryArgs {
  readonly id: string
}

export interface UpdatePageArgs {
  readonly id: string
  readonly input: PageData
}

export interface UnpublishPageArgs {
  readonly id: string
}

export interface PublishPageArgs {
  readonly id: string
  readonly publishAt?: Date
  readonly publishedAt?: Date
  readonly updatedAt?: Date
}

export type OptionalPage = Page | null
export type OptionalPublicPage = PublicPage | null
export type OptionalPageHistory = PageHistory | null

export interface DBPageAdapter {
  updatePage(args: UpdatePageArgs): Promise<OptionalPage>
  publishPage(args: PublishPageArgs): Promise<OptionalPage>
  unpublishPage(args: UnpublishPageArgs): Promise<OptionalPage>
}
