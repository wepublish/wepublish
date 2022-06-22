import {DBArticleAdapter} from './article'
import {DBPageAdapter} from './page'

export interface DBAdapter {
  readonly article: DBArticleAdapter
  readonly page: DBPageAdapter
}
