import {
  CreateInvoiceArgs,
  DBInvoiceAdapter,
  Invoice,
  OptionalInvoice,
  UpdateInvoiceArgs
} from '@wepublish/api'
import {Collection, Db} from 'mongodb'
import {CollectionName, DBInvoice} from './schema'

export class MongoDBInvoiceAdapter implements DBInvoiceAdapter {
  private invoices: Collection<DBInvoice>

  constructor(db: Db) {
    this.invoices = db.collection(CollectionName.Invoices)
  }

  async createInvoice({input}: CreateInvoiceArgs): Promise<Invoice> {
    const {ops} = await this.invoices.insertOne({
      createdAt: new Date(),
      modifiedAt: new Date(),
      mail: input.mail,
      dueAt: input.dueAt,
      subscriptionID: input.subscriptionID,
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
          subscriptionID: input.subscriptionID,
          description: input.description,
          paidAt: input.paidAt,
          canceledAt: input.canceledAt,
          sentReminderAt: input.sentReminderAt,
          items: input.items,
          manuallySetAsPaidByUserId: input.manuallySetAsPaidByUserId
        }
      },
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...invoice} = value
    return {id: outID, ...invoice}
  }
}
