export interface PeerArguments {
  readonly id?: string
}

export interface PeersArguments {}

export interface Peer {
  readonly id: string
  readonly name: string
  readonly url: string
}
