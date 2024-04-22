import {gql} from 'graphql-tag'
import Block from '~/sdk/wep/models/block/Block'

export default class InstagramPostBlock extends Block {
  public postID?: string

  constructor({__typename, postID}: InstagramPostBlock) {
    super({__typename})
    this.postID = postID
  }

  public static instagramPostBlockFragment = gql`
    fragment instagramPostBlock on InstagramPostBlock {
      postID
    }
  `
}
