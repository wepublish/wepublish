import {QueryResult} from '@apollo/client'
import {PeerQuery} from '@wepublish/website/api'

export type BuilderPeerProps = Pick<QueryResult<PeerQuery>, 'data' | 'loading' | 'error'> & {
  originUrl?: string
  className?: string
}
