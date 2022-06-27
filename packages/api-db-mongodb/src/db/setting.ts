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
  private settings: Collection<DBSetting<unknown>>

  constructor(db: Db) {
    this.settings = db.collection(CollectionName.Settings)
  }

  async getSetting(name: SettingName): Promise<OptionalSetting> {
    const setting = await this.settings.findOne({name})
    if (!setting) return null
    return {
      id: setting._id,
      name: setting.name,
      value: setting.value,
      settingRestriction: setting.settingRestriction
    }
  }

  async getSettingList(): Promise<Setting[]> {
    const settings = await this.settings.find().toArray()
    return settings.map(({_id: id, ...data}) => ({id, ...data}))
  }

  async updateSettingList(args: UpdateSettingArgs[]): Promise<OptionalSetting[]> {
    return Promise.all(
      args.map(async ({name, value: val}) => {
        const {value} = await this.settings.findOneAndUpdate(
          {name: name},
          {
            $set: {
              value: val
            }
          },
          {returnOriginal: false}
        )
        if (!value) return null
        const {_id: outID, ...setting} = value
        return {id: outID, ...setting}
      })
    )
  }
}
