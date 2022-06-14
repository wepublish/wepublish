import {DBPaymentAdapter, OptionalPayment, UpdatePaymentArgs} from '@wepublish/api'
import {Collection, Db} from 'mongodb'
import {CollectionName, DBPayment} from './schema'

export class MongoDBPaymentAdapter implements DBPaymentAdapter {
  private payment: Collection<DBPayment>

  constructor(db: Db) {
    this.payment = db.collection(CollectionName.Payments)
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
