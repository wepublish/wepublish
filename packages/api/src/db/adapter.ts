import {DBUserAdapter} from './user'
import {DBImageAdapter} from './image'
import {DBSessionAdapter} from './session'
import {DBArticleAdapter} from './article'
import {DBAuthorAdapter} from './author'

export interface DBAdapter
  extends DBUserAdapter,
    DBSessionAdapter,
    DBArticleAdapter,
    DBImageAdapter,
    DBAuthorAdapter {}
