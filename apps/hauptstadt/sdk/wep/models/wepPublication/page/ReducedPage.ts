import {gql} from 'graphql-tag'
import {Moment} from 'moment'
import WepImage from '~/sdk/wep/models/image/WepImage'
import ReducedWepPublication from '~/sdk/wep/models/wepPublication/ReducedWepPublication'
import Property from '~/sdk/wep/models/properties/Property'
import Properties from '~/sdk/wep/models/wepPublication/page/Properties'

export default class ReducedPage extends ReducedWepPublication {
  constructor({
    id,
    publishedAt,
    slug,
    url,
    title,
    image,
    properties
  }: {
    id: string
    publishedAt?: Moment
    slug: string
    url: string
    title: string
    image?: WepImage
    properties?: Properties
  }) {
    super({id, publishedAt, slug, url, title, image, properties})
  }

  /**
   *  GRAPHQL FRAGMENTS
   */
  static reducedPageFragment = gql`
    fragment reducedPage on Page {
      id
      publishedAt
      slug
      url
      title
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
    ${WepImage.wepImageFragment}
    ${Property.propertyFragment}
  `
}
