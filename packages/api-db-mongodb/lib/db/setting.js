"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBSettingAdapter = void 0;
const schema_1 = require("./schema");
class MongoDBSettingAdapter {
    constructor(db) {
        this.settings = db.collection(schema_1.CollectionName.Settings);
    }
    async getSetting(name) {
        const setting = await this.settings.findOne({ name: name });
        if (!setting)
            return null;
        return {
            id: setting._id,
            name: setting.name,
            value: setting.value,
            settingRestriction: setting.settingRestriction
        };
    }
    async getSettingList() {
        const settings = await this.settings.find().toArray();
        return settings.map((_a) => {
            var { _id: id } = _a, data = __rest(_a, ["_id"]);
            return (Object.assign({ id }, data));
        });
    }
    async updateSettingList(newSettings) {
        return Promise.all(newSettings.map(async ({ name, value: val }) => {
            const { value } = await this.settings.findOneAndUpdate({ name: name }, {
                $set: {
                    value: val
                }
            }, { returnOriginal: false });
            if (!value)
                return null;
            const { _id: outID } = value, setting = __rest(value, ["_id"]);
            return Object.assign({ id: outID }, setting);
        }));
    }
}
exports.MongoDBSettingAdapter = MongoDBSettingAdapter;
//# sourceMappingURL=setting.js.map