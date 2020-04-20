import {Article, GetArticlesArgs} from './article'
import {ConnectionResult} from './common'

export interface BasePeer {
  name: string
  logoID?: string
  apiURL: string
  themeColor: string
}

export interface Peer extends BasePeer {
  id: string
  token: string
}

export interface PeerInput extends BasePeer {}

export interface PeerRequest extends BasePeer {
  id: string
}

export interface PeerRequestInput extends BasePeer {}

export interface DBPeerAdapter {
  createPeerRequest(input: PeerRequestInput): Promise<PeerRequest>

  acceptPeerRequest(id: string): Promise<PeerRequest>
  declinePeerRequest(id: string): Promise<PeerRequest>

  getPeerRequests(): Promise<PeerRequest[]>

  updatePeer(id: string, input: PeerInput): Promise<Peer>
  deletePeer(id: string): Promise<boolean>

  getPeerByID(id: string): Promise<Peer>
  getPeers(): Promise<Peer[]>

  getPeerArticles(id: string, args: GetArticlesArgs): Promise<ConnectionResult<Article>>
  connectPeerArticle(id: string, articleID: string): Promise<Article>
}
