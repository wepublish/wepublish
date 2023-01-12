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
exports.MongoDBPaymentMethodAdapter = void 0;
const schema_1 = require("./schema");
class MongoDBPaymentMethodAdapter {
    constructor(db) {
        this.paymentMethods = db.collection(schema_1.CollectionName.PaymentMethods);
    }
    async createPaymentMethod({ input }) {
        const { ops } = await this.paymentMethods.insertOne({
            createdAt: new Date(),
            modifiedAt: new Date(),
            name: input.name,
            slug: input.slug,
            description: input.description,
            paymentProviderID: input.paymentProviderID,
            active: input.active
        });
        const _a = ops[0], { _id: id } = _a, data = __rest(_a, ["_id"]);
        return Object.assign({ id }, data);
    }
    async updatePaymentMethod({ id, input }) {
        const { value } = await this.paymentMethods.findOneAndUpdate({ _id: id }, {
            $set: {
                modifiedAt: new Date(),
                name: input.name,
                slug: input.slug,
                description: input.description,
                paymentProviderID: input.paymentProviderID,
                active: input.active
            }
        }, { returnOriginal: false });
        if (!value)
            return null;
        const { _id: outId } = value, data = __rest(value, ["_id"]);
        return Object.assign({ id: outId }, data);
    }
    async getPaymentMethodsByID(ids) {
        const paymentMethods = await this.paymentMethods.find({ _id: { $in: ids } }).toArray();
        const paymentMethodsMap = Object.fromEntries(paymentMethods.map((_a) => {
            var { _id: id } = _a, paymentMethod = __rest(_a, ["_id"]);
            return [id, Object.assign({ id }, paymentMethod)];
        }));
        return ids.map(id => { var _a; return (_a = paymentMethodsMap[id]) !== null && _a !== void 0 ? _a : null; });
    }
    async getPaymentMethodsBySlug(slugs) {
        const paymentMethods = await this.paymentMethods.find({ slug: { $in: slugs } }).toArray();
        const paymentMethodsMap = Object.fromEntries(paymentMethods.map((_a) => {
            var { _id: id, slug } = _a, paymentMethod = __rest(_a, ["_id", "slug"]);
            return [
                slug,
                Object.assign({ id, slug }, paymentMethod)
            ];
        }));
        return slugs.map(slug => { var _a; return (_a = paymentMethodsMap[slug]) !== null && _a !== void 0 ? _a : null; });
    }
    async getPaymentMethods() {
        const paymentMethods = await this.paymentMethods.find().sort({ createAd: -1 }).toArray();
        return paymentMethods.map((_a) => {
            var { _id: id } = _a, data = __rest(_a, ["_id"]);
            return (Object.assign({ id }, data));
        });
    }
    async getActivePaymentMethods() {
        const paymentMethods = await this.paymentMethods
            .find({ active: true })
            .sort({ createdAt: -1 })
            .toArray();
        return paymentMethods.map((_a) => {
            var { _id: id } = _a, data = __rest(_a, ["_id"]);
            return (Object.assign({ id }, data));
        });
    }
    async getActivePaymentMethodsByID(ids) {
        const paymentMethods = await this.paymentMethods.find({ _id: { $in: ids }, active: true }).toArray();
        const paymentMethodsMap = Object.fromEntries(paymentMethods.map((_a) => {
            var { _id: id } = _a, paymentMethod = __rest(_a, ["_id"]);
            return [id, Object.assign({ id }, paymentMethod)];
        }));
        return ids.map(id => { var _a; return (_a = paymentMethodsMap[id]) !== null && _a !== void 0 ? _a : null; });
    }
    async getActivePaymentMethodsBySlug(slugs) {
        const paymentMethods = await this.paymentMethods
            .find({ slug: { $in: slugs }, active: true })
            .toArray();
        const paymentMethodsMap = Object.fromEntries(paymentMethods.map((_a) => {
            var { _id: id, slug } = _a, paymentMethod = __rest(_a, ["_id", "slug"]);
            return [
                slug,
                Object.assign({ id, slug }, paymentMethod)
            ];
        }));
        return slugs.map(slug => { var _a; return (_a = paymentMethodsMap[slug]) !== null && _a !== void 0 ? _a : null; });
    }
    async deletePaymentMethod(id) {
        const { deletedCount } = await this.paymentMethods.deleteOne({ _id: id });
        return deletedCount !== 0 ? id : null;
    }
}
exports.MongoDBPaymentMethodAdapter = MongoDBPaymentMethodAdapter;
//# sourceMappingURL=paymentMethod.js.map