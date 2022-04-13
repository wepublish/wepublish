import {
  CreateTempUserArgs,
  DBTempUserAdapter,
  DeleteTempUserArgs,
  OptionalTempUser,
  UpdatePaymentProviderCustomerArgs,
  UpdateTempUserArgs
} from '@wepublish/api'

import {Collection, Db} from 'mongodb'

import {CollectionName, DBTempUser} from './schema'

export class MongoDBTempUserAdapter implements DBTempUserAdapter {
  private tempUsers: Collection<DBTempUser>

  constructor(db: Db) {
    this.tempUsers = db.collection(CollectionName.TempUsers)
  }

  async createTempUser({input}: CreateTempUserArgs): Promise<OptionalTempUser> {
    const {ops} = await this.tempUsers.insertOne({
      createdAt: new Date(),
      modifiedAt: new Date(),
      name: input.name,
      firstName: input.firstName,
      preferredName: input.preferredName,
      email: input.email,
      address: input.address,
      paymentProviderCustomers: []
    })

    const {_id: id, ...data} = ops[0]
    return {id, ...data}
  }

  public async updatePaymentProviderCustomers({
    userID,
    paymentProviderCustomers
  }: UpdatePaymentProviderCustomerArgs): Promise<OptionalTempUser> {
    const {value} = await this.tempUsers.findOneAndUpdate(
      {_id: userID},
      {
        $set: {
          modifiedAt: new Date(),
          paymentProviderCustomers: paymentProviderCustomers
        }
      },
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID} = value
    return this.getTempUserByID(outID)
  }

  async updateTempUser({id, input}: UpdateTempUserArgs): Promise<OptionalTempUser> {
    const {value} = await this.tempUsers.findOneAndUpdate(
      {_id: id},
      {
        $set: {
          modifiedAt: new Date(),
          name: input.name,
          firstName: input.firstName,
          preferredName: input.preferredName,
          email: input.email,
          address: input.address
        }
      },
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...data} = value
    return {id: outID, ...data}
  }

  async deleteTempUser({id}: DeleteTempUserArgs): Promise<string | null> {
    const {deletedCount} = await this.tempUsers.deleteOne({_id: id})
    return deletedCount !== 0 ? id : null
  }

  async getTempUserByID(id: string): Promise<OptionalTempUser> {
    const tempUser = await this.tempUsers.findOne({_id: id})
    return tempUser ? {id: tempUser._id, ...tempUser} : null
  }
}
