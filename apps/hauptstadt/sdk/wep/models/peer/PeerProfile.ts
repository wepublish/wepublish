import {gql} from 'graphql-tag'
import WepImage from '~/sdk/wep/models/image/WepImage'
import {SlateNode} from '~/sdk/wep/classes/Slate'

export default class PeerProfile {
  public name: string
  public logo?: WepImage
  public themeColor: string
  public themeFontColor: string
  public hostURL: string
  public websiteURL: string
  public callToActionText: SlateNode[]
  public callToActionURL: string
  public callToActionImageURL: string
  public callToActionImage: WepImage

  constructor({
    name,
    logo,
    themeColor,
    themeFontColor,
    hostURL,
    websiteURL,
    callToActionText,
    callToActionURL,
    callToActionImageURL,
    callToActionImage
  }: PeerProfile) {
    this.name = name
    this.logo = logo ? new WepImage(logo) : undefined
    this.themeColor = themeColor
    this.themeColor = themeColor
    this.themeFontColor = themeFontColor
    this.hostURL = hostURL
    this.websiteURL = websiteURL
    this.callToActionText = callToActionText
    this.callToActionURL = callToActionURL
    this.callToActionImageURL = callToActionImageURL
    this.callToActionImage = callToActionImage
  }

  public static reducedPeerProfileFragment = gql`
    fragment reducedPeerProfile on PeerProfile {
      websiteURL
      logo {
        ...image
      }
    }
  `

  public static peerProfileFragment = gql`
    fragment peerProfile on PeerProfile {
      name
      logo {
        ...image
      }
      themeColor
      themeFontColor
      hostURL
      websiteURL
      callToActionText
      callToActionURL
      callToActionImageURL
      callToActionImage {
        ...image
      }
    }
    ${WepImage.wepImageFragment}
  `
}
