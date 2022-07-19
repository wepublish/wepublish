import {DBSettingAdapter, OptionalSetting, UpdateSettingArgs} from '@wepublish/api'
import {Collection, Db} from 'mongodb'
import {CollectionName, DBSetting} from './schema'

export class MongoDBSettingAdapter implements DBSettingAdapter {
  private settings: Collection<DBSetting<unknown>>

  constructor(db: Db) {
    this.settings = db.collection(CollectionName.Settings)
  }

  async updateSettingList(newSettings: UpdateSettingArgs[]): Promise<OptionalSetting[]> {
    return Promise.all(
      newSettings.map(async ({name, value: val}) => {
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
