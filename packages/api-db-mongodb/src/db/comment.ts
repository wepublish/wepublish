import {
  AddPublicCommentArgs,
  DBCommentAdapter,
  OptionalComment,
  OptionalPublicComment,
  PublicComment,
  TakeActionOnCommentArgs,
  UpdatePublicCommentArgs
} from '@wepublish/api'
import {Collection, Db} from 'mongodb'
import {CollectionName, DBComment} from './schema'

export class MongoDBCommentAdapter implements DBCommentAdapter {
  private comments: Collection<DBComment>

  constructor(db: Db) {
    this.comments = db.collection(CollectionName.Comments)
  }

  async addPublicComment({input}: AddPublicCommentArgs): Promise<PublicComment> {
    const {text, ...data} = input
    const {ops} = await this.comments.insertOne({
      ...data,
      revisions: [
        {
          text,
          createdAt: new Date()
        }
      ],
      createdAt: new Date(),
      modifiedAt: new Date()
    })

    const {_id: id, ...comment} = ops[0]

    return {
      ...comment,
      id,
      text
    }
  }

  async updatePublicComment({
    id,
    text,
    state
  }: UpdatePublicCommentArgs): Promise<OptionalPublicComment> {
    const {value} = await this.comments.findOneAndUpdate(
      {_id: id},
      {
        $set: {
          state,
          modifiedAt: new Date()
        },
        $addToSet: {
          revisions: {
            text,
            createdAt: new Date()
          }
        }
      },
      {
        returnOriginal: false
      }
    )

    if (!value) return null

    const {_id: outID, ...comment} = value
    return {
      ...comment,
      id: outID,
      text
    }
  }

  async takeActionOnComment({
    id,
    state,
    rejectionReason
  }: TakeActionOnCommentArgs): Promise<OptionalComment> {
    const {value} = await this.comments.findOneAndUpdate(
      {_id: id},
      {
        $set: {
          state,
          rejectionReason,
          modifiedAt: new Date()
        }
      },
      {
        returnOriginal: false
      }
    )

    if (!value) return null
    const {_id: outID, ...comment} = value

    return {
      ...comment,
      id: outID
    }
  }
}
