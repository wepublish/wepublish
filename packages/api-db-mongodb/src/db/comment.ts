import {
  DBCommentAdapter,
  AddPublicCommentArgs,
  Comment,
  GetCommentsArgs,
  ConnectionResult,
  CommentState,
  LimitType,
  InputCursorType,
  CommentSort,
  SortOrder,
  PublicComment
} from '@wepublish/api'

import {Collection, Db, FilterQuery, MongoCountPreferences} from 'mongodb'
import {Cursor} from './cursor'
import {MaxResultsPerPage} from './defaults'

import {CollectionName, DBComment} from './schema'

function commentSortFieldForSort(sort: CommentSort) {
  switch (sort) {
    case CommentSort.CreatedAt:
      return 'createdAt'

    case CommentSort.ModifiedAt:
      return 'modifiedAt'
  }
}

function commentDateForSort(comment: DBComment, sort: CommentSort): Date {
  switch (sort) {
    case CommentSort.CreatedAt:
      return comment.createdAt

    case CommentSort.ModifiedAt:
      return comment.modifiedAt
  }
}

export class MongoDBCommentAdapter implements DBCommentAdapter {
  private comments: Collection<DBComment>
  private locale: string

  constructor(db: Db, locale: string) {
    this.comments = db.collection(CollectionName.Comments)
    this.locale = locale
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

  async getComments({
    filter,
    sort,
    order,
    cursor,
    limit
  }: GetCommentsArgs): Promise<ConnectionResult<Comment>> {
    const metaFilters: FilterQuery<any> = []

    if (filter?.state) {
      metaFilters.push({state: filter.state})
    }

    const limitCount = Math.min(limit.count, MaxResultsPerPage)
    const sortDirection = limit.type === LimitType.First ? order : -order

    const cursorData = cursor.type !== InputCursorType.None ? Cursor.from(cursor.data) : undefined

    const expr =
      order === SortOrder.Ascending
        ? cursor.type === InputCursorType.After
          ? '$gt'
          : '$lt'
        : cursor.type === InputCursorType.After
        ? '$lt'
        : '$gt'

    const sortField = commentSortFieldForSort(sort)
    const cursorFilter = cursorData
      ? {
          $or: [
            {[sortField]: {[expr]: cursorData.date}},
            {_id: {[expr]: cursorData.id}, [sortField]: cursorData.date}
          ]
        }
      : {}

    const [totalCount, comments] = await Promise.all([
      this.comments.countDocuments({}, {
        collation: {locale: this.locale, strength: 2}
      } as MongoCountPreferences), // MongoCountPreferences doesn't include collation

      this.comments
        .aggregate([], {collation: {locale: this.locale, strength: 2}})
        .match(metaFilters.length ? {$and: metaFilters} : {})
        .match(cursorFilter)
        .sort({[sortField]: sortDirection, _id: sortDirection})
        .limit(limitCount + 1)
        .toArray()
    ])

    const nodes = comments.slice(0, limitCount)

    if (limit.type === LimitType.Last) {
      nodes.reverse()
    }

    const hasNextPage =
      limit.type === LimitType.First
        ? comments.length > limitCount
        : cursor.type === InputCursorType.Before

    const hasPreviousPage =
      limit.type === LimitType.Last
        ? comments.length > limitCount
        : cursor.type === InputCursorType.After

    const firstComment = nodes[0]
    const lastComment = nodes[nodes.length - 1]

    const startCursor = firstComment
      ? new Cursor(firstComment._id, commentDateForSort(firstComment, sort)).toString()
      : null

    const endCursor = lastComment
      ? new Cursor(lastComment._id, commentDateForSort(lastComment, sort)).toString()
      : null

    return {
      nodes: comments.map<Comment>(({_id: id, ...comment}) => ({id, ...comment})),
      pageInfo: {
        startCursor,
        endCursor,
        hasNextPage,
        hasPreviousPage
      },
      totalCount
    }
  }

  async getCommentsForItemByID(id: readonly string[]): Promise<PublicComment[]> {
    const [comments] = await Promise.all([
      // TODO: add count
      // TODO: add sort revisions' array by createdAt
      this.comments
        .aggregate([{$sort: {'createdAt.date': -1}}], {
          collation: {locale: this.locale, strength: 2}
        })
        .match({
          $and: [{itemID: id[0]}, {state: CommentState.Approved}]
        })
        .toArray()
    ])

    return comments.map<PublicComment>(({_id: id, revisions, ...comment}) => ({
      id,
      text: revisions[revisions.length - 1].text,
      ...comment
    }))
  }
}
