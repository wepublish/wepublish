import { DBSettingAdapter, OptionalSetting, Setting, SettingName, UpdateSettingArgs } from '@wepublish/api';
import { Db } from 'mongodb';
export declare class MongoDBSettingAdapter implements DBSettingAdapter {
    private settings;
    constructor(db: Db);
    getSetting(name: SettingName): Promise<OptionalSetting>;
    getSettingList(): Promise<Setting[]>;
    updateSettingList(newSettings: UpdateSettingArgs[]): Promise<OptionalSetting[]>;
}
//# sourceMappingURL=setting.d.ts.map