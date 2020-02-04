import {DBUserAdapter} from './user'
import {DBImageAdapter} from './image'
import {DBSessionAdapter} from './session'

export interface DBAdapter extends DBUserAdapter, DBImageAdapter, DBSessionAdapter {}
