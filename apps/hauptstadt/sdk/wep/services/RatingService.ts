import Vue from 'vue'
import {gql} from 'graphql-tag'
import Service from '~/sdk/wep/services/Service'
import CommentRatings from '~/sdk/wep/models/comment/CommentRatings'
import CommentRating from '~/sdk/wep/models/comment/CommentRating'

export default class RatingService extends Service {
  constructor({vue}: {vue: Vue}) {
    super({vue})
  }

  public async getUserCommentRatings({
    commentId
  }: {
    commentId: string
  }): Promise<CommentRatings | false> {
    this.vue.$nextTick(() => {
      this.loadingStart()
    })

    try {
      const query = gql`
        query UserCommentRatings($commentId: ID!) {
          userCommentRatings(commentId: $commentId) {
            ...commentRating
          }
        }
        ${CommentRating.commentRatingFragment}
      `
      const response = await this.$apollo.query({
        query,
        variables: {
          commentId
        }
      })
      this.loadingFinish()
      return new CommentRatings().parse(response.data.userCommentRatings) || new CommentRatings()
    } catch (e) {
      this.loadingFinish()
      this.alert({
        title: e as string,
        type: 'error'
      })
      return false
    }
  }

  /**
   * Rate a comment
   * @param answerId
   * @param commentId
   * @param value
   */
  public async rateComment({
    answerId,
    commentId,
    value
  }: {
    answerId: string
    commentId: string
    value: number
  }): Promise<boolean> {
    this.vue.$nextTick(() => {
      this.loadingStart()
    })

    try {
      const mutation = gql`
        mutation rateComment($answerId: ID!, $commentId: ID!, $value: Int!) {
          rateComment(answerId: $answerId, commentId: $commentId, value: $value) {
            value
          }
        }
      `
      await this.$apollo.mutate({
        mutation,
        variables: {
          answerId,
          commentId,
          value
        }
      })
      this.loadingFinish()
      return true
    } catch (e) {
      this.loadingFinish()
      this.alert({
        title: e as string,
        type: 'error'
      })
      return false
    }
  }
}
