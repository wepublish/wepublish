import {gql} from 'graphql-tag'
import Block from '~/sdk/wep/models/block/Block'

export default class YouTubeVideoBlock extends Block {
  public videoID?: string

  constructor({__typename, videoID}: YouTubeVideoBlock) {
    super({__typename})
    this.videoID = videoID
  }

  public static youTubeVideoBlockFragment = gql`
    fragment youTubeVideoBlock on YouTubeVideoBlock {
      videoID
    }
  `
}
