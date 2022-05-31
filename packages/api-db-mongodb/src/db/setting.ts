import {
  CreateSettingArgs,
  DBSettingAdapter,
  DeleteSettingArgs,
  OptionalSetting,
  Setting,
  UpdateSettingArgs
} from '@wepublish/api'

import {Collection, Db} from 'mongodb'

import {CollectionName, DBSetting} from './schema'

export class MongoDBSettingAdapter implements DBSettingAdapter {
  private settings: Collection<DBSetting<any>>

  constructor(db: Db) {
    this.settings = db.collection(CollectionName.Settings)
  }

  async createSetting({name, value, settingRestriction}: CreateSettingArgs<any>): Promise<Setting> {
    const {ops} = await this.settings.insertOne({
      name: name,
      value: value,
      settingRestriction: settingRestriction
    })
    const {_id: id, ...setting} = ops[0]
    return {id, ...setting}
  }

  async getSettings(): Promise<Setting[]> {
    const settings = await this.settings.find().toArray()
    return settings.map(({_id: id, ...data}) => ({id, ...data}))
  }

  async getSettingsByName(names: string[]): Promise<OptionalSetting[]> {
    const settings = await this.settings.find({name: {$in: names as string[]}}).toArray()
    const settingsMap = Object.fromEntries(
      settings.map(({_id: id, name, ...setting}) => [{...setting}])
    )
    return names.map(name => (settingsMap[name] as Setting) ?? null)
  }

  async getSettingsByID(ids: string[]): Promise<OptionalSetting[]> {
    const settings = await this.settings.find({_id: {$in: ids}}).toArray()
    const settingMap = Object.fromEntries(
      settings.map(({_id: id, ...setting}) => [id, {id, ...setting}])
    )
    return ids.map(id => settingMap[id] ?? null)
  }

  async updateSetting(args: UpdateSettingArgs): Promise<OptionalSetting> {
    const {id, input} = args
    const {value} = await this.settings.findOneAndUpdate(
      {_id: id},
      {
        $set: {
          name: input.name,
          value: input.value
        }
      },
      {returnOriginal: false}
    )
    if (!value) return null

    const {_id: outID, ...setting} = value
    return {id: outID, ...setting}
  }

  async getSetting(name: string): Promise<OptionalSetting> {
    const setting = await this.settings.findOne({name})
    if (setting) {
      return {
        id: setting._id,
        name: setting.name,
        value: setting.value,
        settingRestriction: setting.settingRestriction
      }
    } else {
      return null
    }
  }

  async deleteSetting({id}: DeleteSettingArgs): Promise<string | null> {
    const {deletedCount} = await this.settings.deleteOne({_id: id})
    return deletedCount !== 0 ? id : null
  }
}
