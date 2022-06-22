import {DBUserAdapter} from './user'
import {DBArticleAdapter} from './article'
import {DBPageAdapter} from './page'
import {DBSubscriptionAdapter} from './subscription'

export interface DBAdapter {
  readonly user: DBUserAdapter
  readonly subscription: DBSubscriptionAdapter
  readonly article: DBArticleAdapter
  readonly page: DBPageAdapter
}
