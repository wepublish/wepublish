import {gql} from 'graphql-tag'
import Block, {BlockTypename} from '~/sdk/wep/models/block/Block'
import {SlateNode} from '~/sdk/wep/classes/Slate'
import WepImage from '~/sdk/wep/models/image/WepImage'
import Peer from '~/sdk/wep/models/peer/Peer'

export default class LinkPageBreakBlock extends Block {
  public text?: string
  public richText?: SlateNode[] | string
  public linkURL?: string
  public linkText?: string
  public linkTarget?: string
  public hideButton?: boolean
  public styleOption?: string
  public layoutOption?: string
  public templateOption?: string
  public image?: WepImage
  public peer?: Peer

  constructor({
    __typename,
    text,
    richText,
    linkURL,
    linkText,
    linkTarget,
    hideButton,
    styleOption,
    layoutOption,
    templateOption,
    image,
    peer
  }: {
    __typename: BlockTypename
    text?: string
    richText?: SlateNode[] | string
    linkURL?: string
    linkText?: string
    linkTarget?: string
    hideButton?: boolean
    styleOption?: string
    layoutOption?: string
    templateOption?: string
    image?: WepImage
    peer?: Peer
  }) {
    super({__typename})
    this.text = text
    this.richText = richText
    this.linkURL = linkURL
    this.linkText = linkText
    this.linkTarget = linkTarget
    this.hideButton = hideButton
    this.styleOption = styleOption
    this.layoutOption = layoutOption
    this.templateOption = templateOption
    this.image = image ? new WepImage(image) : undefined
    this.peer = peer ? new Peer(peer) : undefined
  }

  public static linkPageBreakBlockFragment = gql`
    fragment linkPageBreakBlock on LinkPageBreakBlock {
      text
      richText
      linkURL
      linkText
      linkTarget
      hideButton
      styleOption
      layoutOption
      templateOption
      image {
        ...image
      }
    }
    ${WepImage.wepImageFragment}
  `
}
