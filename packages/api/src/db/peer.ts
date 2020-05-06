export interface PeerInfo {
  name: string
  logo?: any
  logoID?: string
  themeColor: string
}

export type PeerInfoInput = PeerInfo

export interface BasePeer {
  name: string
  hostURL: string
}

export interface Peer extends BasePeer {
  id: string
  token: string
}

export type OptionalPeer = Peer | null

export interface CreatePeerInput extends BasePeer {
  token: string
}

export interface UpdatePeerInput extends BasePeer {
  token?: string
}

export interface DBPeerAdapter {
  getPeerInfo(): Promise<PeerInfo>
  updatePeerInfo(input: PeerInfoInput): Promise<PeerInfo>
  createPeer(input: CreatePeerInput): Promise<Peer>
  updatePeer(id: string, input: UpdatePeerInput): Promise<OptionalPeer>
  getPeersByID(ids: readonly string[]): Promise<OptionalPeer[]>
  getPeers(): Promise<Peer[]>
}
