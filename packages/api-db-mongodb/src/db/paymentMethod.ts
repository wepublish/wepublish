import {
  CreatePaymentMethodArgs,
  DBPaymentMethodAdapter,
  OptionalPaymentMethod,
  PaymentMethod,
  UpdatePaymentMethodArgs
} from '@wepublish/api/lib/db/paymentMethod'
import {Collection, Db} from 'mongodb'
import {CollectionName, DBPaymentMethod} from './schema'

export class MongoDBPaymentMethodAdapter implements DBPaymentMethodAdapter {
  private paymentMethods: Collection<DBPaymentMethod>

  constructor(db: Db) {
    this.paymentMethods = db.collection(CollectionName.PaymentMethods)
  }

  async createPaymentMethod({input}: CreatePaymentMethodArgs): Promise<PaymentMethod> {
    const {ops} = await this.paymentMethods.insertOne({
      createdAt: new Date(),
      modifiedAt: new Date(),
      name: input.name,
      description: input.description,
      paymentProviderID: input.paymentProviderID,
      active: input.active
    })

    const {_id: id, ...data} = ops[0]
    return {id, ...data}
  }

  async updatePaymentMethod({id, input}: UpdatePaymentMethodArgs): Promise<OptionalPaymentMethod> {
    const {value} = await this.paymentMethods.findOneAndUpdate(
      {_id: id},
      {
        $set: {
          modifiedAt: new Date(),
          name: input.name,
          description: input.description,
          paymentProviderID: input.paymentProviderID,
          active: input.active
        }
      },
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outId, ...data} = value
    return {id: outId, ...data}
  }

  async getPaymentMethodsByID(ids: readonly string[]): Promise<OptionalPaymentMethod[]> {
    const paymentMethods = await this.paymentMethods.find({_id: {$in: ids}}).toArray()
    const paymentMethodsMap = Object.fromEntries(
      paymentMethods.map(({_id: id, ...paymentMethod}) => [id, {id, ...paymentMethod}])
    )

    return ids.map(id => paymentMethodsMap[id] ?? null)
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const paymentMethods = await this.paymentMethods.find().sort({createAd: -1}).toArray()
    return paymentMethods.map(({_id: id, ...data}) => ({id, ...data}))
  }

  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    const paymentMethods = await this.paymentMethods
      .find({active: true})
      .sort({createAd: -1})
      .toArray()
    return paymentMethods.map(({_id: id, ...data}) => ({id, ...data}))
  }

  async deletePaymentMethod(id: string): Promise<string | null> {
    const {deletedCount} = await this.paymentMethods.deleteOne({_id: id})
    return deletedCount !== 0 ? id : null
  }
}
