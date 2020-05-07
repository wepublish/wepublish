import {
  DBPeerAdapter,
  PeerProfile,
  OptionalPeer,
  Peer,
  PeerProfileInput,
  UpdatePeerInput,
  CreatePeerInput
} from '@wepublish/api'

import {Collection, Db} from 'mongodb'

import {CollectionName, DBPeerInfo, DBPeer} from '../schema'

export class MongoDBPeerAdapter implements DBPeerAdapter {
  private peerInfo: Collection<DBPeerInfo>
  private peers: Collection<DBPeer>

  constructor(db: Db) {
    this.peerInfo = db.collection(CollectionName.PeerInfo)
    this.peers = db.collection(CollectionName.Peers)
  }

  async getPeerProfile(): Promise<PeerProfile> {
    const value = await this.peerInfo.findOne({})

    if (!value) {
      return {
        name: '',
        themeColor: '#000000'
      }
    }

    return value
  }

  async updatePeerProfile(input: PeerProfileInput): Promise<PeerProfile> {
    const {value} = await this.peerInfo.findOneAndUpdate(
      {},
      {
        $set: {
          name: input.name,
          logoID: input.logoID,
          themeColor: input.themeColor
        }
      },
      {
        upsert: true,
        returnOriginal: false
      }
    )

    return value!
  }

  async createPeer({name, slug, hostURL, token}: CreatePeerInput): Promise<Peer> {
    const {ops} = await this.peers.insertOne({
      createdAt: new Date(),
      modifiedAt: new Date(),
      slug,
      name,
      token,
      hostURL
    })

    const {_id: id, ...data} = ops[0]
    return {id, ...data}
  }

  async updatePeer(
    id: string,
    {hostURL, name, slug, token}: UpdatePeerInput
  ): Promise<OptionalPeer> {
    const {value} = await this.peers.findOneAndUpdate(
      {_id: id},
      [
        {
          $set: {
            modifiedAt: new Date(),
            name: {$literal: name},
            slug: {$literal: slug},
            hostURL: {$literal: hostURL},
            token: token ? {$literal: token} : '$token'
          } as any
        }
      ] as any,
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...data} = value
    return {id: outID, ...data}
  }

  async deletePeer(id: string): Promise<string | null> {
    const {deletedCount} = await this.peers.deleteOne({_id: id})
    return deletedCount !== 0 ? id : null
  }

  async getPeersByID(ids: readonly string[]): Promise<OptionalPeer[]> {
    const peers = await this.peers.find({_id: {$in: ids}}).toArray()
    const peerMap = Object.fromEntries(peers.map(({_id: id, ...peer}) => [id, {id, ...peer}]))

    return ids.map(id => peerMap[id] ?? null)
  }

  async getPeers(): Promise<Peer[]> {
    const peers = await this.peers.find().toArray()
    return peers.map(({_id: id, ...data}) => ({id, ...data}))
  }
}
