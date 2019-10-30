import {VersionState} from './versionState'
import {PageBlock} from './blocks'

export interface Page {
  readonly id: string

  readonly createdAt: Date
  readonly updatedAt: Date
  readonly publishedAt?: Date

  readonly publishedVersion?: number
  readonly draftVersion?: number
}

export interface PageVersion {
  readonly articleID: string

  readonly version: number
  readonly state: VersionState

  readonly createdAt: Date
  readonly updatedAt: Date

  readonly preTitle?: string
  readonly title: string
  readonly description: string
  readonly slug: string
}

export interface PageInput {
  readonly id: string
  readonly state: VersionState

  readonly title: string
  readonly description: string
  readonly slug: string

  readonly publishDate?: Date

  readonly blocks: PageBlock[]
}
