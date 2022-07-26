import {DBMailLogAdapter, OptionalMailLog, UpdateMailLogArgs} from '@wepublish/api'
import {Collection, Db} from 'mongodb'
import {CollectionName, DBMailLog} from './schema'

export class MongoDBMailLogAdapter implements DBMailLogAdapter {
  private mailLog: Collection<DBMailLog>

  constructor(db: Db) {
    this.mailLog = db.collection(CollectionName.MailLog)
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
