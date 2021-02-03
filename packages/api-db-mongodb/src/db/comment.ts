import {
  DBCommentAdapter,
  AddPublicCommentArgs,
  UpdatePublicCommentArgs,
  TakeActionOnCommentArgs,
  OptionalComment,
  Comment,
  GetCommentsArgs,
  GetPublicCommentsArgs,
  ConnectionResult,
  CommentState,
  LimitType,
  InputCursorType,
  CommentSort,
  SortOrder,
  PublicComment,
  OptionalPublicComment
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
        .skip(limit.skip ?? 0)
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

  async getPublicCommentsForItemByID(args: GetPublicCommentsArgs): Promise<PublicComment[]> {
    const {id, userID} = args

    const [comments, userUnapprovedComments] = await Promise.all([
      // TODO: add count
      // TODO: add sort revisions' array by createdAt
      this.comments
        .aggregate([{$sort: {modifiedAt: -1}}], {
          collation: {locale: this.locale, strength: 2}
        })
        .match({
          $and: [{itemID: id}, {state: CommentState.Approved, parentID: null}]
        })
        .toArray(),
      this.comments
        .aggregate([{$sort: {'modifiedAt.date': -1}}], {
          collation: {locale: this.locale, strength: 2}
        })
        .match({
          $and: [{itemID: id}, {userID}, {state: {$ne: CommentState.Approved}}]
        })
        .toArray()
    ])

    return [...userUnapprovedComments, ...comments].map<PublicComment>(
      ({_id: id, revisions, ...comment}) => ({
        id,
        text: revisions[revisions.length - 1].text,
        ...comment
      })
    )
  }

  async getCommentById(id: string): Promise<OptionalComment> {
    const value = await this.comments.findOne({_id: id})

    if (!value) return null

    const {_id: outID, ...comment} = value

    return {
      id: outID,
      ...comment
    }
  }

  async getPublicChildrenCommentsByParentId(id: string): Promise<PublicComment[]> {
    const [childrenComments] = await Promise.all([
      this.comments
        .aggregate([{$sort: {modifiedAt: -1}}], {
          collation: {locale: this.locale, strength: 2}
        })
        .match({
          $and: [{parentID: id}, {state: CommentState.Approved}]
        })
        .toArray()
    ])

    return childrenComments.map<PublicComment>(({_id: id, revisions, ...comment}) => ({
      id,
      text: revisions[revisions.length - 1].text,
      ...comment
    }))
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
