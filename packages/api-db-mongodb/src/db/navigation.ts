import {DBNavigationAdapter, UpdateNavigationArgs, OptionalNavigation} from '@wepublish/api'
import {Collection, Db, MongoError} from 'mongodb'

import {CollectionName, DBNavigation} from './schema'
import {MongoErrorCode} from '../utility'

export class MongoDBNavigationAdapter implements DBNavigationAdapter {
  private navigations: Collection<DBNavigation>

  constructor(db: Db) {
    this.navigations = db.collection(CollectionName.Navigations)
  }

  async updateNavigation({id, input}: UpdateNavigationArgs): Promise<OptionalNavigation> {
    try {
      const {value} = await this.navigations.findOneAndUpdate(
        {_id: id},
        {
          $set: {
            modifiedAt: new Date(),
            name: input.name,
            key: input.key,
            links: input.links
          }
        },
        {returnOriginal: false}
      )

      if (!value) return null

      const {_id: outID, ...navigation} = value
      return {id: outID, ...navigation}
    } catch (err) {
      if (err instanceof MongoError && err.code === MongoErrorCode.DuplicateKey) {
        throw new Error('"key" already exists!')
      }

      throw err
    }
  }
}
