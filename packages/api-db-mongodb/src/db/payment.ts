import {
  CreatePaymentArgs,
  DBPaymentAdapter,
  OptionalPayment,
  Payment,
  UpdatePaymentArgs
} from '@wepublish/api'
import {Collection, Db} from 'mongodb'
import {CollectionName, DBPayment} from './schema'

export class MongoDBPaymentAdapter implements DBPaymentAdapter {
  private payment: Collection<DBPayment>

  constructor(db: Db) {
    this.payment = db.collection(CollectionName.Payments)
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
}
