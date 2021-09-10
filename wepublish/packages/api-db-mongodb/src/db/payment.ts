import {
  ConnectionResult,
  InputCursorType,
  LimitType,
  SortOrder,
  CreatePaymentArgs,
  DBPaymentAdapter,
  DeletePaymentArgs,
  GetPaymentsArgs,
  OptionalPayment,
  Payment,
  PaymentSort,
  UpdatePaymentArgs
} from '@wepublish/api'

import {Collection, Db, FilterQuery, MongoCountPreferences} from 'mongodb'

import {CollectionName, DBPayment} from './schema'
import {Cursor} from './cursor'
import {MaxResultsPerPage} from './defaults'
import {escapeRegExp} from '../utility'

export class MongoDBPaymentAdapter implements DBPaymentAdapter {
  private payment: Collection<DBPayment>
  private locale: string

  constructor(db: Db, locale: string) {
    this.payment = db.collection(CollectionName.Payments)
    this.locale = locale
  }

  async createPayment({input}: CreatePaymentArgs): Promise<Payment> {
    const {ops} = await this.payment.insertOne({
      createdAt: new Date(),
      modifiedAt: new Date(),
      intentID: input.intentID,
      intentSecret: input.intentSecret,
      intentData: input.intentData,
      invoiceID: input.invoiceID,
      state: input.state,
      paymentMethodID: input.paymentMethodID,
      paymentData: input.paymentData
    })

    const {_id: id, ...payment} = ops[0]
    return {id, ...payment}
  }

  async updatePayment({id, input}: UpdatePaymentArgs): Promise<OptionalPayment> {
    const {value} = await this.payment.findOneAndUpdate(
      {_id: id},
      {
        $set: {
          modifiedAt: new Date(),
          intentID: input.intentID,
          intentData: input.intentData,
          intentSecret: input.intentSecret,
          invoiceID: input.invoiceID,
          state: input.state,
          paymentMethodID: input.paymentMethodID,
          paymentData: input.paymentData
        }
      },
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...payment} = value
    return {id: outID, ...payment}
  }

  async deletePayment({id}: DeletePaymentArgs): Promise<string | null> {
    const {deletedCount} = await this.payment.deleteOne({_id: id})
    return deletedCount !== 0 ? id : null
  }

  async getPaymentsByID(ids: readonly string[]): Promise<OptionalPayment[]> {
    const payments = await this.payment.find({_id: {$in: ids}}).toArray()
    const paymentMap = Object.fromEntries(
      payments.map(({_id: id, ...payment}) => [id, {id, ...payment}])
    )

    return ids.map(id => paymentMap[id] ?? null)
  }

  async getPaymentsByInvoiceID(invoiceID: string): Promise<OptionalPayment[]> {
    const payments = await this.payment.find({invoiceID: {$eq: invoiceID}}).toArray()

    return payments.map(({_id, ...payment}) => ({id: _id, ...payment}))
  }

  async getPayments({
    filter,
    sort,
    order,
    cursor,
    limit
  }: GetPaymentsArgs): Promise<ConnectionResult<Payment>> {
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

    const sortField = paymentSortFieldForSort(sort)
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
    if (filter?.intentID !== undefined) {
      textFilter.$or = [{mail: {$regex: escapeRegExp(filter.intentID), $options: 'i'}}]
    }

    const [totalCount, payments] = await Promise.all([
      this.payment.countDocuments(textFilter, {
        collation: {locale: this.locale, strength: 2}
      } as MongoCountPreferences), // MongoCountPreferences doesn't include collation

      this.payment
        .aggregate([], {collation: {locale: this.locale, strength: 2}})
        .match(textFilter)
        .match(cursorFilter)
        .sort({[sortField]: sortDirection, _id: sortDirection})
        .limit(limitCount + 1)
        .toArray()
    ])

    const nodes = payments.slice(0, limitCount)

    if (limit.type === LimitType.Last) {
      nodes.reverse()
    }

    const hasNextPage =
      limit.type === LimitType.First
        ? payments.length > limitCount
        : cursor.type === InputCursorType.Before

    const hasPreviousPage =
      limit.type === LimitType.Last
        ? payments.length > limitCount
        : cursor.type === InputCursorType.After

    const firstPayment = nodes[0]
    const lastPayment = nodes[nodes.length - 1]

    const startCursor = firstPayment
      ? new Cursor(firstPayment._id, paymentDateForSort(firstPayment, sort)).toString()
      : null

    const endCursor = lastPayment
      ? new Cursor(lastPayment._id, paymentDateForSort(lastPayment, sort)).toString()
      : null

    return {
      nodes: nodes.map<Payment>(({_id: id, ...payment}) => ({id, ...payment})),

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

function paymentSortFieldForSort(sort: PaymentSort) {
  switch (sort) {
    case PaymentSort.CreatedAt:
      return 'createdAt'

    case PaymentSort.ModifiedAt:
      return 'modifiedAt'
  }
}

function paymentDateForSort(payment: DBPayment, sort: PaymentSort): Date {
  switch (sort) {
    case PaymentSort.CreatedAt:
      return payment.createdAt

    case PaymentSort.ModifiedAt:
      return payment.modifiedAt
  }
}
