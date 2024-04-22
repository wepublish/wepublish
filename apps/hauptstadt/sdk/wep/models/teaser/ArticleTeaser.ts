import {gql} from 'graphql-tag'
import Teaser from '~/sdk/wep/models/teaser/Teaser'
import WepImage from '~/sdk/wep/models/image/WepImage'
import ReducedArticle from '~/sdk/wep/models/wepPublication/article/ReducedArticle'

export default class ArticleTeaser extends Teaser {
  constructor({
    style,
    image,
    preTitle,
    title,
    lead,
    __typename,
    article
  }: {
    style: string
    image: WepImage
    preTitle: string
    title: string
    lead: string
    __typename: string
    article: ReducedArticle
  }) {
    super({
      style,
      image,
      preTitle,
      title,
      lead,
      wepPublication: article ? new ReducedArticle(article) : undefined,
      __typename
    })
  }

  /**
   * GRAPHQL FRAGMENTS
   */
  public static articleTeaserFragment = gql`
    fragment articleTeaser on ArticleTeaser {
      style
      image {
        ...image
      }
      preTitle
      title
      lead
      article {
        ...reducedArticle
      }
    }
    ${WepImage.wepImageFragment}
    ${ReducedArticle.reducedArticleFragment}
  `
}
