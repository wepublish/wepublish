import {gql} from 'graphql-tag'
import Author from '~/sdk/wep/models/author/Author'
import WepImage from '~/sdk/wep/models/image/WepImage'

export default class Authors {
  public authors: Author[]

  constructor() {
    this.authors = []
  }

  public parse(authors: Author[]): Authors {
    this.authors = []
    for (const author of authors) {
      this.authors.push(new Author(author))
    }
    return this
  }

  /**
   * GRAPHQL FRAGMENTS
   */
  public static reducedAuthorsFragment = gql`
    fragment reducedAuthors on Author {
      name
    }
  `

  public static authorsFragment = gql`
    fragment authors on Author {
      jobTitle
      bio
      links {
        title
        url
      }
      url
      slug
      name
      modifiedAt
      createdAt
      id
      image {
        ...image
      }
    }
    ${WepImage.wepImageFragment}
  `
}
