import {
  CreateMailLogArgs,
  DBMailLogAdapter,
  MailLog,
  OptionalMailLog,
  UpdateMailLogArgs
} from '@wepublish/api'
import {Collection, Db} from 'mongodb'
import {CollectionName, DBMailLog} from './schema'

export class MongoDBMailLogAdapter implements DBMailLogAdapter {
  private mailLog: Collection<DBMailLog>

  constructor(db: Db) {
    this.mailLog = db.collection(CollectionName.MailLog)
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
}
