export interface Author {
  readonly id: string
  readonly name: string
  readonly imageID?: string
}

export type OptionalAuthor = Author | null

export interface DBAuthorAdapter {
  createAuthor(author: Author): Promise<Author>
  updateAuthor(author: Author): Promise<Author | null>
  deleteAuthor(id: string): Promise<boolean | null>
  getAuthorsByID(ids: readonly string[]): Promise<OptionalAuthor[]>
}
