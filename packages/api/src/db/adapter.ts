import {DBUserAdapter} from './user'
import {DBSessionAdapter} from './session'
import {DBNavigationAdapter} from './navigation'
import {DBAuthorAdapter} from './author'
import {DBImageAdapter} from './image'
import {DBArticleAdapter} from './article'
import {DBPageAdapter} from './page'
import {DBPeerAdapter} from './peer'

export interface DBAdapter
  extends DBPeerAdapter,
    DBUserAdapter,
    DBSessionAdapter,
    DBNavigationAdapter,
    DBAuthorAdapter,
    DBImageAdapter,
    DBArticleAdapter,
    DBPageAdapter {}
