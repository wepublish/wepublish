// import {Article, GetArticlesArgs} from './article'
// import {ConnectionResult} from './common'

export interface BasePeer {
  apiURL: string
}

export interface PeerData {
  name: string
  logoID?: string
  themeColor: string
}

export enum PeerState {
  Accepted = 'accepted',
  Declined = 'declined',
  Pending = 'pending',
  Requested = 'requested'
}

export interface Peer extends BasePeer {
  id: string
  token: string
  state: PeerState
}

export interface RequestedPeer extends BasePeer {
  id: string
  token: string
  state: PeerState.Requested
}

export interface PendingPeer extends BasePeer {
  id: string
  token: string
  state: PeerState.Pending
}

export interface PeerWithData extends Peer, PeerData {}

export interface PeerInput extends BasePeer {}

export type OptionalPeer = Peer | undefined
export type OptionalPeerWithData = PeerWithData | undefined

export interface DBPeerAdapter {
  createIncomingPeerRequest(url: string): Promise<PendingPeer>
  createOutgoingPeerRequest(url: string, token: string): Promise<RequestedPeer>

  getPeersByID(ids: readonly string[]): Promise<OptionalPeer[]>

  // acceptIncomingPeerRequest(id: string): Promise<IncomingPeerRequest>
  // declineIncomingPeerRequest(id: string): Promise<IncomingPeerRequest>
  // getIncomingPeerRequests(): Promise<IncomingPeerRequest[]>
  // createOutgoingPeerRequest(input: OutgoingPeerRequestInput): Promise<OutgoingPeerRequest>
  // deleteOutgoingPeerRequest(id: string): Promise<OutgoingPeerRequest>
  // getOutgoingPeerRequests(): Promise<OutgoingPeerRequest[]>
  // ---
  // acceptPendingPeer(id: string): Promise<Peer>
  // declinePendingPeer(id: string): Promise<Peer>
  // updatePeer(id: string, input: PeerInput): Promise<Peer>
  // updatePeerState(id: string, state: PeerState): Promise<Peer>
  // deletePeer(id: string): Promise<boolean>
  // getPeerByID(id: string): Promise<Peer>
  // getPeerByToken(token: string): Promise<Peer>
  // getPeers(): Promise<Peer[]>
  // getPeerArticles(id: string, args: GetArticlesArgs): Promise<ConnectionResult<Article>>
  // connectPeerArticle(id: string, articleID: string): Promise<Article>
}
