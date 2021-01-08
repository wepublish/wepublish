import {
  DBCommentAdapter,
  CreateCommentArgs,
  Comment,
  GetCommentsArgs,
  ConnectionResult
} from '@wepublish/api'

import {Collection, Db, FilterQuery} from 'mongodb'

import {CollectionName, DBComment} from './schema'

export class MongoDBCommentAdapter implements DBCommentAdapter {
  private comments: Collection<DBComment>
  private locale: string

  constructor(db: Db, locale: string) {
    this.comments = db.collection(CollectionName.Comments)
    this.locale = locale
  }

  async createComment({input}: CreateCommentArgs): Promise<Comment> {
    const {...data} = input
    const {ops} = await this.comments.insertOne({
      ...data,
      revisions: [
        {
          ...data.revisions[0],
          createdAt: new Date()
        }
      ],
      createdAt: new Date(),
      modifiedAt: new Date()
    })

    const {_id: id, ...comment} = ops[0]

    return {id, ...comment}
  }

  async getComments({filter, limit}: GetCommentsArgs): Promise<ConnectionResult<Comment>> {
    const metaFilters: FilterQuery<any> = []

    if (filter?.status) {
      metaFilters.push({status: filter.status})
    }

    const [totalCount, comments] = await Promise.all([
      this.comments.countDocuments(), // MongoCountPreferences doesn't include collation

      this.comments
        .aggregate([], {collation: {locale: this.locale, strength: 2}})

        .match(metaFilters.length ? {$and: metaFilters} : {})
        .toArray()
    ])

    return {
      nodes: comments.map<Comment>(({_id: id, ...comment}) => ({id, ...comment})),
      pageInfo: {
        startCursor: '',
        endCursor: '',
        hasNextPage: true,
        hasPreviousPage: false
      },
      totalCount: totalCount
    }
  }

  // async getPublicComments(ids: readonly string[]): Promise<ConnectionResult<Comment>> {
  //   console.log(ids)

  //   const [totalCount, comments] = await Promise.all([
  //     this.comments.countDocuments(), // MongoCountPreferences doesn't include collation

  //     this.comments.aggregate([], {collation: {locale: this.locale, strength: 2}}).toArray()
  //   ])

  //   return {
  //     nodes: comments.map<Comment>(({_id: id, ...comment}) => ({id, ...comment})),
  //     pageInfo: {
  //       startCursor: '',
  //       endCursor: '',
  //       hasNextPage: true,
  //       hasPreviousPage: false
  //     },
  //     totalCount: totalCount
  //   }
  // }
}
