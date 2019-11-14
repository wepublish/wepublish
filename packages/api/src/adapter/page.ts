import {VersionState} from './versionState'
import {PageBlock} from './blocks'

export interface Page {
  readonly id: string

  readonly createdAt: Date
  readonly updatedAt: Date
  readonly publishedAt?: Date

  readonly latestVersion: number
  readonly publishedVersion?: number
  readonly draftVersion?: number
}

export interface PageVersion {
  readonly id: string
  readonly version: number
  readonly state: VersionState

  readonly createdAt: Date
  readonly updatedAt: Date

  readonly slug: string
  readonly title: string
  readonly description: string
  readonly tags: string[]
  readonly imageID?: string
}

export interface PageInput {
  readonly state: VersionState

  readonly title: string
  readonly description: string
  readonly slug: string
  readonly tags: string[]

  readonly blocks: PageBlock[]
}
