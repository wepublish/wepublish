import {gql} from 'graphql-tag'

export default class PageInfo {
  public startCursor?: string
  public endCursor?: string
  public hasNextPage?: boolean
  public hasPreviousPage?: boolean

  constructor({
    startCursor,
    endCursor,
    hasNextPage,
    hasPreviousPage
  }: {
    startCursor?: string
    endCursor?: string
    hasNextPage?: boolean
    hasPreviousPage?: boolean
  }) {
    this.startCursor = startCursor
    this.endCursor = endCursor
    this.hasNextPage = hasNextPage
    this.hasPreviousPage = hasPreviousPage
  }

  public static pageInfoFragment = gql`
    fragment pageInfo on PageInfo {
      startCursor
      endCursor
      hasNextPage
      hasPreviousPage
    }
  `
}
