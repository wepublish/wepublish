import {
  CreateSubscriptionArgs,
  CreateSubscriptionPeriodArgs,
  DBSubscriptionAdapter,
  DeleteSubscriptionPeriodArgs,
  OptionalSubscription,
  UpdateSubscriptionArgs
} from '@wepublish/api'
import {Collection, Db} from 'mongodb'
import nanoid from 'nanoid'
import {CollectionName, DBSubscription} from './schema'

export class MongoDBSubscriptionAdapter implements DBSubscriptionAdapter {
  private subscriptions: Collection<DBSubscription>

  constructor(db: Db) {
    this.subscriptions = db.collection(CollectionName.Subscriptions)
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
}
