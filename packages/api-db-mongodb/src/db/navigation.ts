import {
  DBNavigationAdapter,
  NavigationInput,
  OptionalNavigation,
  Navigation
} from '@dev7ch/wepublish-api'
import {Collection, Db, MongoError} from 'mongodb'

import {CollectionName, DBNavigation} from './schema'
import {MongoErrorCode} from '../utility'

export class MongoDBNavigationAdapter implements DBNavigationAdapter {
  private navigations: Collection<DBNavigation>

  constructor(db: Db) {
    this.navigations = db.collection(CollectionName.Navigations)
  }

  async createNavigation(input: Readonly<NavigationInput>): Promise<OptionalNavigation> {
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

  async updateNavigation(
    id: string,
    input: Readonly<NavigationInput>
  ): Promise<OptionalNavigation> {
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

  async deleteNavigation(id: string): Promise<string | null> {
    const {deletedCount} = await this.navigations.deleteOne({_id: id})
    return deletedCount !== 0 ? id : null
  }

  async getNavigations(): Promise<Navigation[]> {
    const navigations = await this.navigations.find().sort({createdAt: -1}).toArray()
    return navigations.map(({_id: id, ...data}) => ({id, ...data}))
  }

  async getNavigationsByID(ids: readonly string[]): Promise<OptionalNavigation[]> {
    const navigations = await this.navigations.find({_id: {$in: ids}}).toArray()
    const navigationMap = Object.fromEntries(
      navigations.map(({_id: id, ...navigation}) => [id, {id, ...navigation}])
    )

    return ids.map(id => navigationMap[id] ?? null)
  }

  async getNavigationsByKey(keys: readonly string[]): Promise<OptionalNavigation[]> {
    const navigations = await this.navigations.find({key: {$in: keys as string[]}}).toArray()
    const navigationMap = Object.fromEntries(
      navigations.map(({_id: id, ...navigation}) => [navigation.key, {id, ...navigation}])
    )
    return keys.map(key => navigationMap[key] ?? null)
  }
}
