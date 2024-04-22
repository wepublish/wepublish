import Vue from 'vue'
import {gql} from 'graphql-tag'
import Service from '~/sdk/wep/services/Service'
import Comment from '~/sdk/wep/models/comment/Comment'
import {SlateNode} from '~/sdk/wep/classes/Slate'
import ChallengeAnswer from '~/sdk/wep/models/challenge/ChallengeAnswer'
import {WepPublicationTypeName} from '~/sdk/wep/interfacesAndTypes/WePublish'

export default class CommentService extends Service {
  constructor({vue}: {vue: Vue}) {
    super({vue})
  }

  /**
   * Create a new comment
   * @param parentID
   * @param itemID
   * @param itemType
   * @param title
   * @param text
   * @param guestUserName
   * @param challenge
   */
  public async createComment({
    parentID,
    itemID,
    itemType,
    title,
    text,
    guestUsername,
    challengeAnswer
  }: {
    parentID?: string
    itemID: string
    itemType: WepPublicationTypeName
    title?: string
    text: SlateNode[]
    guestUsername?: string
    challengeAnswer?: ChallengeAnswer
  }): Promise<Comment | false> {
    if (!itemID) {
      throw new Error('itemID missing in createComment() method within CommentService class!')
    }
    if (!itemType) {
      throw new Error('itemType missing in createComment() method within CommentService class!')
    }
    if (!text) {
      throw new Error('text missing in createComment() method within CommentService class!')
    }
    this.vue.$nextTick(() => {
      this.loadingStart()
    })
    try {
      const mutation = gql`
        mutation Mutation($input: CommentInput!) {
          addComment(input: $input) {
            ...comment
          }
        }
        ${Comment.commentFragment}
      `
      const response = await this.$apollo.mutate({
        mutation,
        variables: {
          input: {
            parentID,
            itemID,
            itemType,
            title,
            text,
            guestUsername,
            challenge: challengeAnswer
          }
        }
      })
      const returnComment = new Comment(response?.data?.addComment)
      this.alert({
        title: 'Dein Beitrag wird publiziert, sobald er von der Redaktion geprüft wurde.',
        type: 'success'
      })
      this.loadingFinish()
      return returnComment
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
   * Edit existing comment
   * @param id
   * @param text
   */
  public async updateComment({
    id,
    text
  }: {
    id: string
    text: SlateNode[]
  }): Promise<Comment | false> {
    if (!id) {
      throw new Error('Comment id missing in updateComment() method within CommentService class!')
    }
    if (!text) {
      throw new Error('text missing in updateComment() method within CommentService class!')
    }
    this.vue.$nextTick(() => {
      this.loadingStart()
    })
    try {
      const mutation = gql`
        mutation UpdateComment($input: CommentUpdateInput!) {
          updateComment(input: $input) {
            ...comment
          }
        }
        ${Comment.commentFragment}
      `
      const response = await this.$apollo.mutate({
        mutation,
        variables: {
          input: {
            id,
            text
          }
        }
      })
      const returnComment = new Comment(response?.data?.addComment)
      this.alert({
        title: 'Kommentar erfolgreich geändert.',
        type: 'success'
      })
      this.loadingFinish()
      return returnComment
    } catch (e) {
      this.loadingFinish()
      this.alert({
        title: 'Änderung konnte nicht gespeichert werden.',
        type: 'error'
      })
      return false
    }
  }
}
