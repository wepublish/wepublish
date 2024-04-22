import ArticleTeaser from '~/sdk/wep/models/teaser/ArticleTeaser'
import PeerArticleTeaser from '~/sdk/wep/models/teaser/PeerArticleTeaser'
import PageTeaser from '~/sdk/wep/models/teaser/PageTeaser'

/**
 * Types shortcut
 */
export type TeaserTypes = ArticleTeaser | PeerArticleTeaser | PageTeaser

/**
 * Class
 */
export default class Teasers {
  public teasers: TeaserTypes[]

  constructor() {
    this.teasers = []
  }

  public parse(teasers: TeaserTypes[]): Teasers {
    this.teasers = []
    for (const teaser of teasers) {
      switch (teaser?.__typename) {
        case 'ArticleTeaser':
          this.teasers.push(new ArticleTeaser(teaser as any))
          break
        case 'PeerArticleTeaser':
          try {
            this.teasers.push(new PeerArticleTeaser(teaser as any))
          } catch (e) {
            // todo: notify error listener such as Sentry
          }
          break
        case 'PageTeaser':
          this.teasers.push(new PageTeaser(teaser as PageTeaser))
          break
      }
    }
    return this
  }
}
