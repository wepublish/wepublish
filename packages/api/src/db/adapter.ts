import {GraphQLResolveInfo} from 'graphql'
import {DBUserAdapter} from './user'

export interface QueryOpts {
  readonly info: GraphQLResolveInfo
}

export interface DBAdapter extends DBUserAdapter {}
