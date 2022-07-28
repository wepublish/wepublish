import {
  DBPeerAdapter,
  OptionalPeer,
  PeerProfile,
  PeerProfileInput,
  UpdatePeerInput
} from '@wepublish/api'
import {Collection, Db} from 'mongodb'
import {CollectionName, DBPeer, DBPeerProfile} from './schema'

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

  async updatePeer(
    id: string,
    {hostURL, name, slug, token, isDisabled}: UpdatePeerInput
  ): Promise<OptionalPeer> {
    const toUpdate = {
      modifiedAt: new Date()
    } as Record<string, unknown>
    if (hostURL) toUpdate.hostUrl = hostURL
    if (name) toUpdate.name = name
    if (slug) toUpdate.slug = slug
    token ? (toUpdate.token = token) : (toUpdate.token = '$token')
    if (isDisabled !== undefined) toUpdate.isDisabled = isDisabled

    const {value} = await this.peers.findOneAndUpdate(
      {_id: id},
      [
        {
          $set: toUpdate
        }
      ] as any,
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...data} = value
    return {id: outID, ...data}
  }
}
