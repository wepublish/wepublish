import {DateRange} from './date'
import {VersionState} from './versionState'
import {ArticleBlock} from './blocks'
import {Peer} from './peer'

export interface ArticleArguments {
  readonly peer?: string
  readonly id?: string
}

export interface ArticlesArguments {
  readonly limit?: number

  readonly publishedBetween: DateRange
  readonly updatedBetween: DateRange
  readonly createdBetween: DateRange

  readonly tagsInclude: string[]
  readonly includePeers: boolean
}

export interface Article {
  readonly id: string
  readonly peer?: Peer

  readonly createdAt: Date
  readonly updatedAt: Date
  readonly publishedAt?: Date

  readonly latestVersion: number
  readonly publishedVersion?: number
  readonly draftVersion?: number
}

export interface ArticleVersion {
  readonly articleID: string

  readonly version: number
  readonly state: VersionState

  readonly createdAt: Date
  readonly updatedAt: Date
  readonly breaking: boolean

  readonly preTitle?: string
  readonly title: string
  readonly lead: string
  readonly slug: string
  readonly tags: string[]

  readonly imageID?: string
  readonly authorIDs: string[]
}

export interface ArticleTeaserOverrides {
  readonly preTitle?: string
  readonly title?: string
  readonly lead?: string
  readonly imageID?: string
}

export interface ArticleTeaser {
  readonly type: string
  readonly overrides: ArticleTeaserOverrides
  readonly articleID: string
}

export interface ArticleInput {
  readonly id: string
  readonly state: VersionState

  readonly preTitle?: string
  readonly title: string
  readonly lead: string
  readonly slug: string
  readonly tags: string[]
  readonly imageID?: string

  readonly breaking: boolean
  readonly blocks: ArticleBlock[]
  readonly authorIDs: string[]
}
