import {
  DBPaymentMethodAdapter,
  OptionalPaymentMethod,
  UpdatePaymentMethodArgs
} from '@wepublish/api/lib/db/paymentMethod'
import {Collection, Db} from 'mongodb'
import {CollectionName, DBPaymentMethod} from './schema'

export class MongoDBPaymentMethodAdapter implements DBPaymentMethodAdapter {
  private paymentMethods: Collection<DBPaymentMethod>

  constructor(db: Db) {
    this.paymentMethods = db.collection(CollectionName.PaymentMethods)
  }

  async updatePaymentMethod({id, input}: UpdatePaymentMethodArgs): Promise<OptionalPaymentMethod> {
    const {value} = await this.paymentMethods.findOneAndUpdate(
      {_id: id},
      {
        $set: {
          modifiedAt: new Date(),
          name: input.name,
          slug: input.slug,
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
}
