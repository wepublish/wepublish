import {
  ConnectionResult,
  InputCursorType,
  SortOrder,
  LimitType,
  CreateMailLogArgs,
  DBMailLogAdapter,
  MailLog,
  OptionalMailLog,
  UpdateMailLogArgs,
  DeleteMailLogArgs,
  GetMailLogsArgs,
  MailLogSort
} from '@wepublish/api'

import {Collection, Db, MongoCountPreferences, FilterQuery} from 'mongodb'

import {CollectionName, DBMailLog} from './schema'
import {Cursor} from './cursor'
import {MaxResultsPerPage} from './defaults'
import {escapeRegExp} from '../utility'

export class MongoDBMailLogAdapter implements DBMailLogAdapter {
  private mailLog: Collection<DBMailLog>
  private locale: string

  constructor(db: Db, locale: string) {
    this.mailLog = db.collection(CollectionName.MailLog)
    this.locale = locale
  }

  async createMailLog({input}: CreateMailLogArgs): Promise<MailLog> {
    const {ops} = await this.mailLog.insertOne({
      createdAt: new Date(),
      modifiedAt: new Date(),
      recipient: input.recipient,
      subject: input.subject,
      state: input.state,
      mailProviderID: input.mailProviderID,
      mailData: input.mailData
    })

    const {_id: id, ...mailLog} = ops[0]
    return {id, ...mailLog}
  }

  async updateMailLog({id, input}: UpdateMailLogArgs): Promise<OptionalMailLog> {
    const {value} = await this.mailLog.findOneAndUpdate(
      {_id: id},
      {
        $set: {
          modifiedAt: new Date(),
          recipient: input.recipient,
          subject: input.subject,
          state: input.state,
          mailProviderID: input.mailProviderID,
          mailData: input.mailData
        }
      },
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...mailLog} = value
    return {id: outID, ...mailLog}
  }

  async deleteMailLog({id}: DeleteMailLogArgs): Promise<string | null> {
    const {deletedCount} = await this.mailLog.deleteOne({_id: id})
    return deletedCount !== 0 ? id : null
  }

  async getMailLogsByID(ids: readonly string[]): Promise<OptionalMailLog[]> {
    const mailLogs = await this.mailLog.find({_id: {$in: ids}}).toArray()
    const mailLogMap = Object.fromEntries(
      mailLogs.map(({_id: id, ...mailLog}) => [id, {id, ...mailLog}])
    )

    return ids.map(id => mailLogMap[id] ?? null)
  }

  async getMailLogs({
    filter,
    sort,
    order,
    cursor,
    limit
  }: GetMailLogsArgs): Promise<ConnectionResult<MailLog>> {
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

    const sortField = mailLogSortFieldForSort(sort)
    const cursorFilter = cursorData
      ? {
          $or: [
            {[sortField]: {[expr]: cursorData.date}},
            {_id: {[expr]: cursorData.id}, [sortField]: cursorData.date}
          ]
        }
      : {}

    const textFilter: FilterQuery<any> = {}

    // TODO: Rename to search
    if (filter?.subject !== undefined) {
      textFilter.$or = [{subject: {$regex: escapeRegExp(filter.subject), $options: 'i'}}]
    }

    const [totalCount, mailLogs] = await Promise.all([
      this.mailLog.countDocuments(textFilter, {
        collation: {locale: this.locale, strength: 2}
      } as MongoCountPreferences), // MongoCountPreferences doesn't include collation

      this.mailLog
        .aggregate([], {collation: {locale: this.locale, strength: 2}})
        .match(textFilter)
        .match(cursorFilter)
        .sort({[sortField]: sortDirection, _id: sortDirection})
        .limit(limitCount + 1)
        .toArray()
    ])

    const nodes = mailLogs.slice(0, limitCount)

    if (limit.type === LimitType.Last) {
      nodes.reverse()
    }

    const hasNextPage =
      limit.type === LimitType.First
        ? mailLogs.length > limitCount
        : cursor.type === InputCursorType.Before

    const hasPreviousPage =
      limit.type === LimitType.Last
        ? mailLogs.length > limitCount
        : cursor.type === InputCursorType.After

    const firstMailLog = nodes[0]
    const lastMailLog = nodes[nodes.length - 1]

    const startCursor = firstMailLog
      ? new Cursor(firstMailLog._id, mailLogDateForSort(firstMailLog, sort)).toString()
      : null

    const endCursor = lastMailLog
      ? new Cursor(lastMailLog._id, mailLogDateForSort(lastMailLog, sort)).toString()
      : null

    return {
      nodes: nodes.map<MailLog>(({_id: id, ...mailLog}) => ({id, ...mailLog})),

      pageInfo: {
        startCursor,
        endCursor,
        hasNextPage,
        hasPreviousPage
      },

      totalCount
    }
  }
}

function mailLogSortFieldForSort(sort: MailLogSort) {
  switch (sort) {
    case MailLogSort.CreatedAt:
      return 'createdAt'

    case MailLogSort.ModifiedAt:
      return 'modifiedAt'
  }
}

function mailLogDateForSort(mailLog: DBMailLog, sort: MailLogSort): Date {
  switch (sort) {
    case MailLogSort.CreatedAt:
      return mailLog.createdAt

    case MailLogSort.ModifiedAt:
      return mailLog.modifiedAt
  }
}
