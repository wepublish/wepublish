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

import {CollectionName, DBPeerProfile, DBPeer} from './schema'

export class MongoDBPeerAdapter implements DBPeerAdapter {
  private peerProfiles: Collection<DBPeerProfile>
  private peers: Collection<DBPeer>

  constructor(db: Db) {
    this.peerProfiles = db.collection(CollectionName.PeerProfiles)
    this.peers = db.collection(CollectionName.Peers)
  }

  async updatePeerProfile(input: PeerProfileInput): Promise<PeerProfile> {
    const {value} = await this.peerProfiles.findOneAndUpdate(
      {},
      {
        $set: {
          name: input.name,
          logoID: input.logoID,
          themeColor: input.themeColor,
          themeFontColor: input.themeFontColor,
          callToActionURL: input.callToActionURL,
          callToActionText: input.callToActionText,
          callToActionImageID: input.callToActionImageID,
          callToActionImageURL: input.callToActionImageURL
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
}
