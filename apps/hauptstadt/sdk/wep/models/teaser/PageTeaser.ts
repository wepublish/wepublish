import {gql} from 'graphql-tag'
import Teaser from '~/sdk/wep/models/teaser/Teaser'
import WepImage from '~/sdk/wep/models/image/WepImage'
import ReducedPage from '~/sdk/wep/models/wepPublication/page/ReducedPage'

export default class PageTeaser extends Teaser {
  public page: ReducedPage

  constructor({style, image, preTitle, title, lead, page, __typename}: PageTeaser) {
    super({
      style,
      image,
      preTitle,
      title,
      lead,
      wepPublication: page ? new ReducedPage(page) : undefined,
      __typename
    })
    this.page = page
  }

  /**
   * GRAPHQL FRAGMENTS
   */
  public static pageTeaserFragment = gql`
    fragment pageTeaser on PageTeaser {
      style
      image {
        ...image
      }
      preTitle
      title
      lead
      page {
        ...reducedPage
      }
    }
    ${WepImage.wepImageFragment}
    ${ReducedPage.reducedPageFragment}
  `
}
