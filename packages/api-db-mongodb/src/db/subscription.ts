import {
  ConnectionResult,
  CreateSubscriptionArgs,
  CreateSubscriptionPeriodArgs,
  DBSubscriptionAdapter,
  DeleteSubscriptionArgs,
  DeleteSubscriptionPeriodArgs,
  GetSubscriptionArgs,
  InputCursorType,
  LimitType,
  OptionalSubscription,
  SortOrder,
  Subscription,
  SubscriptionSort,
  UpdateSubscriptionArgs
} from '@wepublish/api'

import {Collection, Db, FilterQuery, MongoCountPreferences} from 'mongodb'

import {CollectionName, DBSubscription} from './schema'
import {MaxResultsPerPage} from './defaults'
import {Cursor} from './cursor'
import nanoid from 'nanoid'
import {mapDateFilterComparisonToMongoQueryOperatior} from './utility'

export class MongoDBSubscriptionAdapter implements DBSubscriptionAdapter {
  private subscriptions: Collection<DBSubscription>
  private locale: string

  constructor(db: Db, locale: string) {
    this.subscriptions = db.collection(CollectionName.Subscriptions)
    this.locale = locale
  }

  async createSubscription({input}: CreateSubscriptionArgs): Promise<OptionalSubscription> {
    const {ops} = await this.subscriptions.insertOne({
      createdAt: new Date(),
      modifiedAt: new Date(),
      userID: input.userID,
      memberPlanID: input.memberPlanID,
      paymentMethodID: input.paymentMethodID,
      monthlyAmount: input.monthlyAmount,
      autoRenew: input.autoRenew,
      startsAt: input.startsAt,
      paymentPeriodicity: input.paymentPeriodicity,
      properties: input.properties,
      deactivation: input.deactivation,
      paidUntil: input.paidUntil,
      periods: []
    })

    const {_id: id, ...data} = ops[0]
    return {id, ...data}
  }

  async updateSubscription({id, input}: UpdateSubscriptionArgs): Promise<OptionalSubscription> {
    const {value} = await this.subscriptions.findOneAndUpdate(
      {_id: id},
      {
        $set: {
          modifiedAt: new Date(),
          userID: input.userID,
          memberPlanID: input.memberPlanID,
          paymentMethodID: input.paymentMethodID,
          monthlyAmount: input.monthlyAmount,
          autoRenew: input.autoRenew,
          startsAt: input.startsAt,
          paymentPeriodicity: input.paymentPeriodicity,
          properties: input.properties,
          deactivation: input.deactivation,
          paidUntil: input.paidUntil
        }
      },
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...data} = value
    return {id: outID, ...data}
  }

  async updateUserID(subscriptionID: string, userID: string): Promise<OptionalSubscription> {
    const {value} = await this.subscriptions.findOneAndUpdate(
      {_id: subscriptionID},
      {
        $set: {
          modifiedAt: new Date(),
          userID
        }
      }
    )
    if (!value) return null
    return await this.subscriptions.findOne({_id: subscriptionID})
  }

  async deleteSubscription({id}: DeleteSubscriptionArgs): Promise<string | null> {
    const {deletedCount} = await this.subscriptions.deleteOne({_id: id})
    return deletedCount !== 0 ? id : null
  }

  async addSubscriptionPeriod({
    subscriptionID,
    input
  }: CreateSubscriptionPeriodArgs): Promise<OptionalSubscription> {
    const subscription = await this.subscriptions.findOne({_id: subscriptionID})
    if (!subscription) return null
    const {periods = []} = subscription

    periods.push({
      id: nanoid(),
      createdAt: new Date(),
      amount: input.amount,
      paymentPeriodicity: input.paymentPeriodicity,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      invoiceID: input.invoiceID
    })

    const {value} = await this.subscriptions.findOneAndUpdate(
      {_id: subscriptionID},
      {
        $set: {
          modifiedAt: new Date(),
          periods: periods
        }
      },
      {returnOriginal: false}
    )
    if (!value) return null

    const {_id: id, ...data} = value
    return {id, ...data}
  }

  async deleteSubscriptionPeriod({
    subscriptionID,
    periodID
  }: DeleteSubscriptionPeriodArgs): Promise<OptionalSubscription> {
    const subscription = await this.subscriptions.findOne({_id: subscriptionID})
    if (!subscription) return null
    const {periods = []} = subscription

    const updatedPeriods = periods.filter(period => period.id !== periodID)

    const {value} = await this.subscriptions.findOneAndUpdate(
      {_id: subscriptionID},
      {
        $set: {
          modifiedAt: new Date(),
          periods: updatedPeriods
        }
      },
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: id, ...data} = value
    return {id, ...data}
  }

  async getSubscriptionByID(id: string): Promise<OptionalSubscription> {
    const subscription = await this.subscriptions.findOne({_id: id})
    return subscription ? {id: subscription._id, ...subscription} : null
  }

  async getSubscriptionsByID(ids: readonly string[]): Promise<OptionalSubscription[]> {
    const subscriptions = await this.subscriptions.find({_id: {$in: ids}}).toArray()
    const subscriptionMap = Object.fromEntries(
      subscriptions.map(({_id: id, ...data}) => [id, {id, ...data}])
    )

    return ids.map(id => subscriptionMap[id] ?? null)
  }

  async getSubscriptionsByUserID(userID: string): Promise<OptionalSubscription[]> {
    const subscriptions = await this.subscriptions.find({userID: {$eq: userID}}).toArray()
    return subscriptions.map(({_id: id, ...data}) => ({id, ...data}))
  }

  async getSubscriptions({
    filter,
    sort,
    order,
    cursor,
    limit
  }: GetSubscriptionArgs): Promise<ConnectionResult<Subscription>> {
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

    const sortField = subscriptionSortFieldForSort(sort)
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

    if (filter?.startsAtFrom) {
      const {comparison, date} = filter.startsAtFrom
      textFilter.$and?.push({
        startsAt: {[mapDateFilterComparisonToMongoQueryOperatior(comparison)]: date}
      })
    }

    if (filter?.startsAtTo) {
      const {comparison, date} = filter.startsAtTo
      textFilter.$and?.push({
        startsAt: {[mapDateFilterComparisonToMongoQueryOperatior(comparison)]: date}
      })
    }

    if (filter?.paidUntilFrom) {
      const {comparison, date} = filter.paidUntilFrom
      textFilter.$and?.push({
        paidUntil: {
          [mapDateFilterComparisonToMongoQueryOperatior(comparison)]: date
        }
      })
    }

    if (filter?.paidUntilTo) {
      const {comparison, date} = filter.paidUntilTo
      textFilter.$and?.push({
        paidUntil: {
          [mapDateFilterComparisonToMongoQueryOperatior(comparison)]: date
        }
      })
    }

    if (filter?.deactivationDate !== undefined) {
      const {comparison, date} = filter.deactivationDate

      if (date === null) {
        textFilter.$and?.push({deactivation: {$eq: null}})
      } else {
        textFilter.$and?.push({
          'deactivation.date': {
            [mapDateFilterComparisonToMongoQueryOperatior(comparison)]: date
          }
        })
      }
    }

    if (filter?.deactivationDateFrom !== undefined) {
      const {comparison, date} = filter.deactivationDateFrom

      textFilter.$and?.push({
        'deactivation.date': {
          [mapDateFilterComparisonToMongoQueryOperatior(comparison)]: date
        }
      })
    }

    if (filter?.deactivationDateTo !== undefined) {
      const {comparison, date} = filter.deactivationDateTo

      textFilter.$and?.push({
        'deactivation.date': {
          [mapDateFilterComparisonToMongoQueryOperatior(comparison)]: date
        }
      })
    }

    if (filter?.deactivationReason !== undefined) {
      const reason = filter.deactivationReason

      textFilter.$and?.push({
        'deactivation.reason': reason
      })
    }

    if (filter?.autoRenew !== undefined) {
      textFilter.$and?.push({autoRenew: {$eq: filter.autoRenew}})
    }

    if (filter?.paymentPeriodicity) {
      textFilter.$and?.push({paymentPeriodicity: {$eq: filter.paymentPeriodicity}})
    }

    if (filter?.paymentMethodID) {
      textFilter.$and?.push({paymentMethodID: {$eq: filter.paymentMethodID}})
    }

    if (filter?.memberPlanID) {
      textFilter.$and?.push({memberPlanID: {$eq: filter.memberPlanID}})
    }

    // if (filter?.userHasAddress === true) {
    //   textFilter.$and?.push({'user.address.zipCode': {$exists: true}})
    // }

    const [totalCount, subscriptions] = await Promise.all([
      this.subscriptions.countDocuments(textFilter, {
        collation: {locale: this.locale, strength: 2}
      } as MongoCountPreferences), // MongoCountPreferences doesn't include collation

      this.subscriptions
        .aggregate([], {collation: {locale: this.locale, strength: 2}})
        // how to get related user address?
        // .lookup({
        //   from: 'DBUser',
        //   localField: 'userID',
        //   foreignField: '_id',
        //   as: 'user'
        // })
        .match(textFilter)
        .match(cursorFilter)
        .sort({[sortField]: sortDirection, _id: sortDirection})
        .skip(limit.skip ?? 0)
        .limit(limitCount + 1)
        .toArray()
    ])

    const nodes = subscriptions.slice(0, limitCount)

    if (limit.type === LimitType.Last) {
      nodes.reverse()
    }

    const hasNextPage =
      limit.type === LimitType.First
        ? subscriptions.length > limitCount
        : cursor.type === InputCursorType.Before

    const hasPreviousPage =
      limit.type === LimitType.Last
        ? subscriptions.length > limitCount
        : cursor.type === InputCursorType.After

    const firstUser = nodes[0]
    const lastUser = nodes[nodes.length - 1]

    const startCursor = firstUser
      ? new Cursor(firstUser._id, subscriptionDateForSort(firstUser, sort)).toString()
      : null

    const endCursor = lastUser
      ? new Cursor(lastUser._id, subscriptionDateForSort(lastUser, sort)).toString()
      : null

    return {
      nodes: nodes.map<Subscription>(({_id: id, ...data}) => ({id, ...data})),

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

function subscriptionSortFieldForSort(sort: SubscriptionSort) {
  switch (sort) {
    case SubscriptionSort.CreatedAt:
      return 'createdAt'

    case SubscriptionSort.ModifiedAt:
      return 'modifiedAt'
  }
}

function subscriptionDateForSort(subscription: DBSubscription, sort: SubscriptionSort): Date {
  switch (sort) {
    case SubscriptionSort.CreatedAt:
      return subscription.createdAt

    case SubscriptionSort.ModifiedAt:
      return subscription.modifiedAt
  }
}
