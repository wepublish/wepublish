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
exports.MongoDBNavigationAdapter = void 0;
const mongodb_1 = require("mongodb");
const schema_1 = require("./schema");
const utility_1 = require("../utility");
class MongoDBNavigationAdapter {
    constructor(db) {
        this.navigations = db.collection(schema_1.CollectionName.Navigations);
    }
    async createNavigation({ input }) {
        try {
            const { ops } = await this.navigations.insertOne({
                createdAt: new Date(),
                modifiedAt: new Date(),
                name: input.name,
                key: input.key,
                links: input.links
            });
            const _a = ops[0], { _id: id } = _a, navigation = __rest(_a, ["_id"]);
            return Object.assign({ id }, navigation);
        }
        catch (err) {
            if (err instanceof mongodb_1.MongoError && err.code === utility_1.MongoErrorCode.DuplicateKey) {
                throw new Error('"key" already exists!');
            }
            throw err;
        }
    }
    async updateNavigation({ id, input }) {
        try {
            const { value } = await this.navigations.findOneAndUpdate({ _id: id }, {
                $set: {
                    modifiedAt: new Date(),
                    name: input.name,
                    key: input.key,
                    links: input.links
                }
            }, { returnOriginal: false });
            if (!value)
                return null;
            const { _id: outID } = value, navigation = __rest(value, ["_id"]);
            return Object.assign({ id: outID }, navigation);
        }
        catch (err) {
            if (err instanceof mongodb_1.MongoError && err.code === utility_1.MongoErrorCode.DuplicateKey) {
                throw new Error('"key" already exists!');
            }
            throw err;
        }
    }
    async deleteNavigation({ id }) {
        const { deletedCount } = await this.navigations.deleteOne({ _id: id });
        return deletedCount !== 0 ? id : null;
    }
    async getNavigations() {
        const navigations = await this.navigations.find().sort({ createdAt: -1 }).toArray();
        return navigations.map((_a) => {
            var { _id: id } = _a, data = __rest(_a, ["_id"]);
            return (Object.assign({ id }, data));
        });
    }
    async getNavigationsByID(ids) {
        const navigations = await this.navigations.find({ _id: { $in: ids } }).toArray();
        const navigationMap = Object.fromEntries(navigations.map((_a) => {
            var { _id: id } = _a, navigation = __rest(_a, ["_id"]);
            return [id, Object.assign({ id }, navigation)];
        }));
        return ids.map(id => { var _a; return (_a = navigationMap[id]) !== null && _a !== void 0 ? _a : null; });
    }
    async getNavigationsByKey(keys) {
        const navigations = await this.navigations.find({ key: { $in: keys } }).toArray();
        const navigationMap = Object.fromEntries(navigations.map((_a) => {
            var { _id: id } = _a, navigation = __rest(_a, ["_id"]);
            return [navigation.key, Object.assign({ id }, navigation)];
        }));
        return keys.map(key => { var _a; return (_a = navigationMap[key]) !== null && _a !== void 0 ? _a : null; });
    }
}
exports.MongoDBNavigationAdapter = MongoDBNavigationAdapter;
//# sourceMappingURL=navigation.js.map