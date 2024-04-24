import moment, {Moment} from 'moment'
import {gql} from 'graphql-tag'
import PeerProfile from '~/sdk/wep/models/peer/PeerProfile'

export default class Peer {
  public id: string
  public createdAt?: Moment
  public modifiedAt?: Moment
  public name: string
  public slug: string
  public hostURL: string
  public profile?: PeerProfile

  constructor({id, createdAt, modifiedAt, name, slug, hostURL, profile}: Peer) {
    this.id = id
    this.createdAt = createdAt ? moment(createdAt) : undefined
    this.modifiedAt = modifiedAt ? moment(modifiedAt) : undefined
    this.name = name
    this.slug = slug
    this.hostURL = hostURL
    this.profile = profile ? new PeerProfile(profile) : undefined
  }

  public static reducedPeerFragment = gql`
    fragment reducedPeer on Peer {
      id
      name
      slug
      hostURL
      profile {
        ...reducedPeerProfile
      }
    }
    ${PeerProfile.reducedPeerProfileFragment}
  `

  public static peerFragment = gql`
    fragment peer on Peer {
      name
      hostURL
      slug
      profile {
        ...peerProfile
      }
      modifiedAt
      createdAt
      id
    }
    ${PeerProfile.peerProfileFragment}
  `
}
