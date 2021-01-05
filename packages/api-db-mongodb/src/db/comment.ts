import {DBCommentAdapter, CreateCommentArgs, PrivateComment} from '@wepublish/api'

import {Collection, Db} from 'mongodb'

import {CollectionName, DBComment} from './schema'

export class MongoDBCommentAdapter implements DBCommentAdapter {
  private comments: Collection<DBComment>
  // private locale: string

  constructor(
    db: Db
    // locale: string
  ) {
    this.comments = db.collection(CollectionName.Comments)
    // this.locale = locale
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
}
