import {gql} from 'graphql-tag'
import Teasers from '~/sdk/wep/models/teaser/Teasers'
import Block from '~/sdk/wep/models/block/Block'
import ArticleTeaser from '~/sdk/wep/models/teaser/ArticleTeaser'
import Teaser from '~/sdk/wep/models/teaser/Teaser'
import PageTeaser from '~/sdk/wep/models/teaser/PageTeaser'
import PeerArticleTeaser from '~/sdk/wep/models/teaser/PeerArticleTeaser'

export default class TeaserGridBlock extends Block {
  public numColumns?: number
  public teasers?: Teasers

  constructor({numColumns, teasers, __typename}: TeaserGridBlock) {
    super({__typename})
    this.numColumns = numColumns
    this.teasers = teasers ? new Teasers().parse(teasers as unknown as Teaser[]) : undefined
  }

  /**
   * GRAPHQL FRAGMENTS
   */
  public static teaserGridBlockFragment = gql`
    fragment teaserGridBlock on TeaserGridBlock {
      numColumns
      teasers {
        ... on ArticleTeaser {
          ...articleTeaser
        }
        ... on PageTeaser {
          ...pageTeaser
        }
        ... on PeerArticleTeaser {
          ...peerArticleTeaser
        }
      }
    }
    ${ArticleTeaser.articleTeaserFragment}
    ${PageTeaser.pageTeaserFragment}
    ${PeerArticleTeaser.peerArticleTeaserFragment}
  `
}
