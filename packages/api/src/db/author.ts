export interface Author {
  readonly id: string
  readonly name: string
  readonly imageID?: string
}

export type OptionalAuthor = Author | null

export interface DBAuthorAdapter {
  getAuthorsByID(ids: readonly string[]): Promise<OptionalAuthor[]>
}
