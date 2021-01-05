import {
  DBCommentAdapter,
  CreateCommentArgs,
  PrivateComment,
  // GetCommentsArgs,
  // GetPublicCommentsArgs,
  ConnectionResult
} from '@wepublish/api'

import {Collection, Db} from 'mongodb'

import {CollectionName, DBComment} from './schema'

export class MongoDBCommentAdapter implements DBCommentAdapter {
  private comments: Collection<DBComment>
  private locale: string

  constructor(db: Db, locale: string) {
    this.comments = db.collection(CollectionName.Comments)
    this.locale = locale
  }

  async createComment({input}: CreateCommentArgs): Promise<PrivateComment> {
    const {...data} = input
    const {ops} = await this.comments.insertOne({
      ...data,
      createdAt: new Date(),
      modifiedAt: new Date()
    })

    const {_id: id, ...comment} = ops[0]

    return {id, ...comment}
  }

  // async getComments({filter}: GetCommentsArgs): Promise<ConnectionResult<PrivateComment>> {
  //   const [totalCount, comments] = await Promise.all([
  //     this.comments.countDocuments(), // MongoCountPreferences doesn't include collation

  //     this.comments.aggregate([], {collation: {locale: this.locale, strength: 2}}).toArray()
  //   ])

  //   return {
  //     nodes: comments.map<PrivateComment>(({_id: id, ...comment}) => ({id, ...comment})),
  //     pageInfo: {
  //       startCursor: '',
  //       endCursor: '',
  //       hasNextPage: true,
  //       hasPreviousPage: false
  //     },
  //     totalCount: totalCount
  //   }
  // }

  async getPublicComments(ids: readonly string[]): Promise<ConnectionResult<PrivateComment>> {
    console.log(ids)

    const [totalCount, comments] = await Promise.all([
      this.comments.countDocuments(), // MongoCountPreferences doesn't include collation

      this.comments.aggregate([], {collation: {locale: this.locale, strength: 2}}).toArray()
    ])

    return {
      nodes: comments.map<PrivateComment>(({_id: id, ...comment}) => ({id, ...comment})),
      pageInfo: {
        startCursor: '',
        endCursor: '',
        hasNextPage: true,
        hasPreviousPage: false
      },
      totalCount: totalCount
    }
  }
}
