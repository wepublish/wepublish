import {
  DBSettingAdapter,
  OptionalSetting,
  Setting,
  SettingName,
  UpdateSettingArgs
} from '@wepublish/api'

import {Collection, Db} from 'mongodb'

import {CollectionName, DBSetting} from './schema'

export class MongoDBSettingAdapter implements DBSettingAdapter {
  private settings: Collection<DBSetting<any>>

  constructor(db: Db) {
    this.settings = db.collection(CollectionName.Settings)
  }

  async getSetting(name: SettingName): Promise<OptionalSetting> {
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

  async getSettings(): Promise<Setting[]> {
    const settings = await this.settings.find().toArray()
    return settings.map(({_id: id, ...data}) => ({id, ...data}))
  }

  async getSettingsByName(names: SettingName[]): Promise<OptionalSetting[]> {
    const settings = await this.settings.find({name: {$in: names as SettingName[]}}).toArray()
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

  async updateSettingList(args: UpdateSettingArgs[]): Promise<OptionalSetting[]> {
    const settings: OptionalSetting[] = []
    for (const v of args) {
      const {id, value: val} = v

      const {value} = await this.settings.findOneAndUpdate(
        {_id: id},
        {
          $set: {
            value: val
          }
        },
        {returnOriginal: false}
      )
      if (value) {
        const {_id: outID, ...setting} = value
        settings.push({id, ...setting})
      }
    }
    return settings
  }
}
