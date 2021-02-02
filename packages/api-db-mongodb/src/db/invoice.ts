import {
  ConnectionResult,
  CreateInvoiceArgs,
  DBInvoiceAdapter,
  DeleteInvoiceArgs,
  GetInvoicesArgs,
  InputCursorType,
  Invoice,
  InvoiceSort,
  LimitType,
  OptionalInvoice,
  SortOrder,
  UpdateInvoiceArgs
} from '@wepublish/api'

import {Collection, Db, FilterQuery, MongoCountPreferences} from 'mongodb'

import {CollectionName, DBInvoice} from './schema'
import {Cursor} from './cursor'
import {MaxResultsPerPage} from './defaults'
import {mapDateFilterComparisonToMongoQueryOperatior} from './utility'

export class MongoDBInvoiceAdapter implements DBInvoiceAdapter {
  private invoices: Collection<DBInvoice>
  private locale: string

  constructor(db: Db, locale: string) {
    this.invoices = db.collection(CollectionName.Invoices)
    this.locale = locale
  }

  async createInvoice({input}: CreateInvoiceArgs): Promise<Invoice> {
    const {ops} = await this.invoices.insertOne({
      createdAt: new Date(),
      modifiedAt: new Date(),
      mail: input.mail,
      dueAt: input.dueAt,
      userID: input.userID,
      description: input.description,
      paidAt: input.paidAt,
      canceledAt: input.canceledAt,
      sentReminderAt: input.sentReminderAt,
      items: input.items
    })

    const {_id: id, ...invoice} = ops[0]
    return {id, ...invoice}
  }

  async updateInvoice({id, input}: UpdateInvoiceArgs): Promise<OptionalInvoice> {
    const {value} = await this.invoices.findOneAndUpdate(
      {_id: id},
      {
        $set: {
          modifiedAt: new Date(),
          mail: input.mail,
          dueAt: input.dueAt,
          userID: input.userID,
          description: input.description,
          paidAt: input.paidAt,
          canceledAt: input.canceledAt,
          sentReminderAt: input.sentReminderAt,
          items: input.items
        }
      },
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...invoice} = value
    return {id: outID, ...invoice}
  }

  async deleteInvoice({id}: DeleteInvoiceArgs): Promise<string | null> {
    const {deletedCount} = await this.invoices.deleteOne({_id: id})
    return deletedCount !== 0 ? id : null
  }

  async getInvoicesByID(ids: readonly string[]): Promise<OptionalInvoice[]> {
    const invoices = await this.invoices.find({_id: {$in: ids}}).toArray()
    const invoiceMap = Object.fromEntries(
      invoices.map(({_id: id, ...invoice}) => [id, {id, ...invoice}])
    )

    return ids.map(id => invoiceMap[id] ?? null)
  }

  async getInvoicesByUserID(userID: string): Promise<OptionalInvoice[]> {
    const invoices = await this.invoices.find({userID}).toArray()

    return invoices.map(({_id: id, ...invoice}) => ({id, ...invoice}))
  }

  async getInvoices({
    filter,
    sort,
    order,
    cursor,
    limit
  }: GetInvoicesArgs): Promise<ConnectionResult<Invoice>> {
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

    const sortField = invoiceSortFieldForSort(sort)
    const cursorFilter = cursorData
      ? {
          $or: [
            {[sortField]: {[expr]: cursorData.date}},
            {_id: {[expr]: cursorData.id}, [sortField]: cursorData.date}
          ]
        }
      : {}

    const textFilter: FilterQuery<any> = {}
    if (filter && JSON.stringify(filter) !== '{}') {
      textFilter.$and = []
    }

    // TODO: Rename to search
    if (filter?.mail !== undefined) {
      textFilter.$and?.push({mail: {$regex: filter.mail, $options: 'i'}})
    }

    if (filter?.paidAt !== undefined) {
      const {comparison, date} = filter.paidAt
      textFilter.$and?.push({
        paidAt: {[mapDateFilterComparisonToMongoQueryOperatior(comparison)]: date}
      })
    }

    if (filter?.canceledAt !== undefined) {
      const {comparison, date} = filter.canceledAt
      textFilter.$and?.push({
        canceledAt: {[mapDateFilterComparisonToMongoQueryOperatior(comparison)]: date}
      })
    }

    if (filter?.userID !== undefined) {
      textFilter.$and?.push({userID: {$eq: filter.userID}})
    }

    const [totalCount, invoices] = await Promise.all([
      this.invoices.countDocuments(textFilter, {
        collation: {locale: this.locale, strength: 2}
      } as MongoCountPreferences), // MongoCountPreferences doesn't include collation

      this.invoices
        .aggregate([], {collation: {locale: this.locale, strength: 2}})
        .match(textFilter)
        .match(cursorFilter)
        .sort({[sortField]: sortDirection, _id: sortDirection})
        .limit(limitCount + 1)
        .toArray()
    ])

    const nodes = invoices.slice(0, limitCount)

    if (limit.type === LimitType.Last) {
      nodes.reverse()
    }

    const hasNextPage =
      limit.type === LimitType.First
        ? invoices.length > limitCount
        : cursor.type === InputCursorType.Before

    const hasPreviousPage =
      limit.type === LimitType.Last
        ? invoices.length > limitCount
        : cursor.type === InputCursorType.After

    const firstInvoice = nodes[0]
    const lastInvoice = nodes[nodes.length - 1]

    const startCursor = firstInvoice
      ? new Cursor(firstInvoice._id, invoiceDateForSort(firstInvoice, sort)).toString()
      : null

    const endCursor = lastInvoice
      ? new Cursor(lastInvoice._id, invoiceDateForSort(lastInvoice, sort)).toString()
      : null

    return {
      nodes: nodes.map<Invoice>(({_id: id, ...invoice}) => ({id, ...invoice})),

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

function invoiceSortFieldForSort(sort: InvoiceSort) {
  switch (sort) {
    case InvoiceSort.CreatedAt:
      return 'createdAt'

    case InvoiceSort.ModifiedAt:
      return 'modifiedAt'

    case InvoiceSort.PaidAt:
      return 'paidAt'
  }
}

// @ts-ignore TODO: fix me
function invoiceDateForSort(invoice: DBInvoice, sort: InvoiceSort): Date {
  switch (sort) {
    case InvoiceSort.CreatedAt:
      return invoice.createdAt

    case InvoiceSort.ModifiedAt:
      return invoice.modifiedAt

    case InvoiceSort.PaidAt:
      if (invoice.paidAt) return invoice.paidAt
  }
}
