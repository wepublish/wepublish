import {gql} from 'graphql-tag'
import NavigationLink from '~/sdk/wep/models/navigationLink/NavigationLink'
import ReducedArticle from '~/sdk/wep/models/wepPublication/article/ReducedArticle'
import IFrontendLink from '~/sdk/wep/models/navigationLink/IFrontendLink'

export default class ArticleNavigationLink extends NavigationLink implements IFrontendLink {
  article?: ReducedArticle
  constructor({label, __typename, article}: ArticleNavigationLink) {
    super({label, __typename})
    this.article = article
  }

  public getFrontendLink(): string {
    return `/a/${this.article?.slug}`
  }

  /**
   *  GRAPHQL FRAGMENTS
   */
  static articleNavigationFragment = gql`
    fragment articleNavigationLink on ArticleNavigationLink {
      label
      article {
        ...reducedArticle
      }
    }
    ${ReducedArticle.reducedArticleFragment}
  `
}
