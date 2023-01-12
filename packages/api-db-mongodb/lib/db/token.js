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
exports.MongoDBTokenAdapter = void 0;
const schema_1 = require("./schema");
const utility_1 = require("../utility");
class MongoDBTokenAdapter {
    constructor(db) {
        this.tokens = db.collection(schema_1.CollectionName.Tokens);
    }
    async createToken(input) {
        const { ops } = await this.tokens.insertOne({
            createdAt: new Date(),
            modifiedAt: new Date(),
            name: input.name,
            token: (0, utility_1.generateToken)(),
            roleIDs: input.roleIDs
        });
        const _a = ops[0], { _id: id } = _a, data = __rest(_a, ["_id"]);
        return Object.assign({ id }, data);
    }
    async getTokens() {
        const tokens = await this.tokens.find().sort({ createdAt: -1 }).toArray();
        return tokens.map((_a) => {
            var { _id: id } = _a, data = __rest(_a, ["_id"]);
            return (Object.assign({ id }, data));
        });
    }
    async deleteToken(id) {
        const { deletedCount } = await this.tokens.deleteOne({ _id: id });
        return deletedCount !== 0 ? id : null;
    }
    async getTokenByString(token) {
        return this.tokens.findOne({ token });
    }
}
exports.MongoDBTokenAdapter = MongoDBTokenAdapter;
//# sourceMappingURL=token.js.map