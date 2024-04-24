import {gql} from 'graphql-tag'
import Peer from '~/sdk/wep/models/peer/Peer'
import Teaser from '~/sdk/wep/models/teaser/Teaser'
import WepImage from '~/sdk/wep/models/image/WepImage'
import ReducedArticle from '~/sdk/wep/models/wepPublication/article/ReducedArticle'

export default class PeerArticleTeaser extends Teaser {
  public peer?: Peer

  constructor({
    style,
    image,
    preTitle,
    title,
    lead,
    peer,
    article,
    __typename
  }: {
    style: string
    image: WepImage
    preTitle: string
    title: string
    lead: string
    peer: Peer
    article: ReducedArticle
    __typename: string
  }) {
    super({
      style,
      image,
      preTitle,
      title,
      lead,
      wepPublication: new ReducedArticle(article),
      __typename
    })
    this.peer = peer ? new Peer(peer) : undefined
  }

  /**
   * GRAPHQL FRAGMENTS
   */
  public static peerArticleTeaserFragment = gql`
    fragment peerArticleTeaser on PeerArticleTeaser {
      style
      image {
        ...image
      }
      preTitle
      title
      lead
      peer {
        ...reducedPeer
      }
      article {
        ...reducedArticle
      }
    }
    ${WepImage.wepImageFragment}
    ${ReducedArticle.reducedArticleFragment}
    ${Peer.reducedPeerFragment}
  `
}
