import {gql} from 'graphql-tag'
import Block from '~/sdk/wep/models/block/Block'

export default class TwitterTweetBlock extends Block {
  public userID?: string
  public tweetID?: string

  constructor({__typename, userID, tweetID}: TwitterTweetBlock) {
    super({__typename})
    this.userID = userID
    this.tweetID = tweetID
  }

  public static twitterTweetBlockFragment = gql`
    fragment twitterTweetBlock on TwitterTweetBlock {
      userID
      tweetID
    }
  `
}
