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
exports.MongoDBPaymentAdapter = void 0;
const api_1 = require("@wepublish/api");
const schema_1 = require("./schema");
const cursor_1 = require("./cursor");
const defaults_1 = require("./defaults");
const utility_1 = require("../utility");
class MongoDBPaymentAdapter {
    constructor(db, locale) {
        this.payment = db.collection(schema_1.CollectionName.Payments);
        this.locale = locale;
    }
    async createPayment({ input }) {
        const { ops } = await this.payment.insertOne({
            createdAt: new Date(),
            modifiedAt: new Date(),
            intentID: input.intentID,
            intentSecret: input.intentSecret,
            intentData: input.intentData,
            invoiceID: input.invoiceID,
            state: input.state,
            paymentMethodID: input.paymentMethodID,
            paymentData: input.paymentData
        });
        const _a = ops[0], { _id: id } = _a, payment = __rest(_a, ["_id"]);
        return Object.assign({ id }, payment);
    }
    async updatePayment({ id, input }) {
        const { value } = await this.payment.findOneAndUpdate({ _id: id }, {
            $set: {
                modifiedAt: new Date(),
                intentID: input.intentID,
                intentData: input.intentData,
                intentSecret: input.intentSecret,
                invoiceID: input.invoiceID,
                state: input.state,
                paymentMethodID: input.paymentMethodID,
                paymentData: input.paymentData
            }
        }, { returnOriginal: false });
        if (!value)
            return null;
        const { _id: outID } = value, payment = __rest(value, ["_id"]);
        return Object.assign({ id: outID }, payment);
    }
    async deletePayment({ id }) {
        const { deletedCount } = await this.payment.deleteOne({ _id: id });
        return deletedCount !== 0 ? id : null;
    }
    async getPaymentsByID(ids) {
        const payments = await this.payment.find({ _id: { $in: ids } }).toArray();
        const paymentMap = Object.fromEntries(payments.map((_a) => {
            var { _id: id } = _a, payment = __rest(_a, ["_id"]);
            return [id, Object.assign({ id }, payment)];
        }));
        return ids.map(id => { var _a; return (_a = paymentMap[id]) !== null && _a !== void 0 ? _a : null; });
    }
    async getPaymentsByInvoiceID(invoiceID) {
        const payments = await this.payment.find({ invoiceID: { $eq: invoiceID } }).toArray();
        return payments.map((_a) => {
            var { _id } = _a, payment = __rest(_a, ["_id"]);
            return (Object.assign({ id: _id }, payment));
        });
    }
    async getPayments({ filter, sort, order, cursor, limit }) {
        const limitCount = Math.min(limit.count, defaults_1.MaxResultsPerPage);
        const sortDirection = limit.type === api_1.LimitType.First ? order : -order;
        const cursorData = cursor.type !== api_1.InputCursorType.None ? cursor_1.Cursor.from(cursor.data) : undefined;
        const expr = order === api_1.SortOrder.Ascending
            ? cursor.type === api_1.InputCursorType.After
                ? '$gt'
                : '$lt'
            : cursor.type === api_1.InputCursorType.After
                ? '$lt'
                : '$gt';
        const sortField = paymentSortFieldForSort(sort);
        const cursorFilter = cursorData
            ? {
                $or: [
                    { [sortField]: { [expr]: cursorData.date } },
                    { _id: { [expr]: cursorData.id }, [sortField]: cursorData.date }
                ]
            }
            : {};
        const textFilter = {};
        // TODO: Rename to search
        if ((filter === null || filter === void 0 ? void 0 : filter.intentID) !== undefined) {
            textFilter.$or = [{ mail: { $regex: (0, utility_1.escapeRegExp)(filter.intentID), $options: 'i' } }];
        }
        const [totalCount, payments] = await Promise.all([
            this.payment.countDocuments(textFilter, {
                collation: { locale: this.locale, strength: 2 }
            }),
            this.payment
                .aggregate([], { collation: { locale: this.locale, strength: 2 } })
                .match(textFilter)
                .match(cursorFilter)
                .sort({ [sortField]: sortDirection, _id: sortDirection })
                .limit(limitCount + 1)
                .toArray()
        ]);
        const nodes = payments.slice(0, limitCount);
        if (limit.type === api_1.LimitType.Last) {
            nodes.reverse();
        }
        const hasNextPage = limit.type === api_1.LimitType.First
            ? payments.length > limitCount
            : cursor.type === api_1.InputCursorType.Before;
        const hasPreviousPage = limit.type === api_1.LimitType.Last
            ? payments.length > limitCount
            : cursor.type === api_1.InputCursorType.After;
        const firstPayment = nodes[0];
        const lastPayment = nodes[nodes.length - 1];
        const startCursor = firstPayment
            ? new cursor_1.Cursor(firstPayment._id, paymentDateForSort(firstPayment, sort)).toString()
            : null;
        const endCursor = lastPayment
            ? new cursor_1.Cursor(lastPayment._id, paymentDateForSort(lastPayment, sort)).toString()
            : null;
        return {
            nodes: nodes.map((_a) => {
                var { _id: id } = _a, payment = __rest(_a, ["_id"]);
                return (Object.assign({ id }, payment));
            }),
            pageInfo: {
                startCursor,
                endCursor,
                hasNextPage,
                hasPreviousPage
            },
            totalCount
        };
    }
}
exports.MongoDBPaymentAdapter = MongoDBPaymentAdapter;
function paymentSortFieldForSort(sort) {
    switch (sort) {
        case api_1.PaymentSort.CreatedAt:
            return 'createdAt';
        case api_1.PaymentSort.ModifiedAt:
            return 'modifiedAt';
    }
}
function paymentDateForSort(payment, sort) {
    switch (sort) {
        case api_1.PaymentSort.CreatedAt:
            return payment.createdAt;
        case api_1.PaymentSort.ModifiedAt:
            return payment.modifiedAt;
    }
}
//# sourceMappingURL=payment.js.map