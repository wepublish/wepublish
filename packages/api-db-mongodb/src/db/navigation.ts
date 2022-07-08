import {
  DBNavigationAdapter,
  UpdateNavigationArgs,
  OptionalNavigation,
  Navigation,
  CreateNavigationArgs
} from '@wepublish/api'
import {Collection, Db, MongoError} from 'mongodb'

import {CollectionName, DBNavigation} from './schema'
import {MongoErrorCode} from '../utility'

export class MongoDBNavigationAdapter implements DBNavigationAdapter {
  private navigations: Collection<DBNavigation>

  constructor(db: Db) {
    this.navigations = db.collection(CollectionName.Navigations)
  }

  async createNavigation({input}: CreateNavigationArgs): Promise<Navigation> {
    try {
      const {ops} = await this.navigations.insertOne({
        createdAt: new Date(),
        modifiedAt: new Date(),
        name: input.name,
        key: input.key,
        links: input.links
      })
      const {_id: id, ...navigation} = ops[0]
      return {id, ...navigation}
    } catch (err) {
      if (err instanceof MongoError && err.code === MongoErrorCode.DuplicateKey) {
        throw new Error('"key" already exists!')
      }

      throw err
    }
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
