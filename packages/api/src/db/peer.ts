export interface PeerProfile {
  name: string
  logoID?: string
  themeColor: string
}

export type ResolvedPeerProfile = unknown

export interface PeerProfileInput {
  name: string
  logoID?: string
  themeColor: string
}

export interface BasePeer {
  name: string
  slug: string
  hostURL: string
}

export interface Peer extends BasePeer {
  createdAt: Date
  modifiedAt: Date
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
  getPeerProfile(): Promise<PeerProfile>
  updatePeerProfile(input: PeerProfileInput): Promise<PeerProfile>
  createPeer(input: CreatePeerInput): Promise<Peer>
  updatePeer(id: string, input: UpdatePeerInput): Promise<OptionalPeer>
  deletePeer(id: string): Promise<string | null>
  getPeersByID(ids: readonly string[]): Promise<OptionalPeer[]>
  getPeersBySlug(ids: readonly string[]): Promise<OptionalPeer[]>
  getPeers(): Promise<Peer[]>
}
