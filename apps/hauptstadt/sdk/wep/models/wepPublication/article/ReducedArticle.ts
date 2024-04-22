import {gql} from 'graphql-tag'
import ReducedWepPublication from '~/sdk/wep/models/wepPublication/ReducedWepPublication'
import Authors from '~/sdk/wep/models/author/Authors'
import WepImage from '~/sdk/wep/models/image/WepImage'
import Author from '~/sdk/wep/models/author/Author'
import Property from '~/sdk/wep/models/properties/Property'

/**
 * This class is usefully to avoid circular dependencies. It's a subset of the Article model.
 */
export default class ReducedArticle extends ReducedWepPublication {
  public lead: string
  public authors?: Authors

  constructor({
    id,
    publishedAt,
    slug,
    url,
    title,
    preTitle,
    image,
    lead,
    authors,
    properties
  }: ReducedArticle) {
    super({id, publishedAt, slug, url, title, preTitle, image, properties})
    this.lead = lead
    this.authors = authors ? new Authors().parse(authors as unknown as Author[]) : undefined
  }

  /**
   *  GRAPHQL FRAGMENTS
   */
  static reducedArticleFragment = gql`
    fragment reducedArticle on Article {
      id
      publishedAt
      slug
      url
      title
      preTitle
      lead
      authors {
        ...reducedAuthors
      }
      image {
        ...image
      }
      socialMediaTitle
      socialMediaDescription
      socialMediaImage {
        ...image
      }
      properties {
        ...property
      }
    }
    ${Authors.reducedAuthorsFragment}
    ${WepImage.wepImageFragment}
    ${Property.propertyFragment}
  `
}
