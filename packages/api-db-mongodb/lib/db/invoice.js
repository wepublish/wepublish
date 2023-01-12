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
exports.MongoDBInvoiceAdapter = void 0;
const api_1 = require("@wepublish/api");
const schema_1 = require("./schema");
const cursor_1 = require("./cursor");
const defaults_1 = require("./defaults");
const utility_1 = require("./utility");
const utility_2 = require("../utility");
class MongoDBInvoiceAdapter {
    constructor(db, locale) {
        this.invoices = db.collection(schema_1.CollectionName.Invoices);
        this.locale = locale;
    }
    async createInvoice({ input }) {
        const { ops } = await this.invoices.insertOne({
            createdAt: new Date(),
            modifiedAt: new Date(),
            mail: input.mail,
            dueAt: input.dueAt,
            subscriptionID: input.subscriptionID,
            description: input.description,
            paidAt: input.paidAt,
            canceledAt: input.canceledAt,
            sentReminderAt: input.sentReminderAt,
            items: input.items
        });
        const _a = ops[0], { _id: id } = _a, invoice = __rest(_a, ["_id"]);
        return Object.assign({ id }, invoice);
    }
    async updateInvoice({ id, input }) {
        const { value } = await this.invoices.findOneAndUpdate({ _id: id }, {
            $set: {
                modifiedAt: new Date(),
                mail: input.mail,
                dueAt: input.dueAt,
                subscriptionID: input.subscriptionID,
                description: input.description,
                paidAt: input.paidAt,
                canceledAt: input.canceledAt,
                sentReminderAt: input.sentReminderAt,
                items: input.items,
                manuallySetAsPaidByUserId: input.manuallySetAsPaidByUserId
            }
        }, { returnOriginal: false });
        if (!value)
            return null;
        const { _id: outID } = value, invoice = __rest(value, ["_id"]);
        return Object.assign({ id: outID }, invoice);
    }
    async deleteInvoice({ id }) {
        const { deletedCount } = await this.invoices.deleteOne({ _id: id });
        return deletedCount !== 0 ? id : null;
    }
    async getInvoiceByID(id) {
        const invoice = await this.invoices.findOne({ _id: id });
        return invoice ? Object.assign({ id: invoice._id }, invoice) : null;
    }
    async getInvoicesByID(ids) {
        const invoices = await this.invoices.find({ _id: { $in: ids } }).toArray();
        const invoiceMap = Object.fromEntries(invoices.map((_a) => {
            var { _id: id } = _a, invoice = __rest(_a, ["_id"]);
            return [id, Object.assign({ id }, invoice)];
        }));
        return ids.map(id => { var _a; return (_a = invoiceMap[id]) !== null && _a !== void 0 ? _a : null; });
    }
    async getInvoicesBySubscriptionID(subscriptionID) {
        const invoices = await this.invoices.find({ subscriptionID }).toArray();
        return invoices.map((_a) => {
            var { _id: id } = _a, invoice = __rest(_a, ["_id"]);
            return (Object.assign({ id }, invoice));
        });
    }
    async getInvoices({ filter, sort, order, cursor, limit }) {
        var _a, _b, _c, _d, _e, _f;
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
        const sortField = invoiceSortFieldForSort(sort);
        const cursorFilter = cursorData
            ? {
                $or: [
                    { [sortField]: { [expr]: cursorData.date } },
                    { _id: { [expr]: cursorData.id }, [sortField]: cursorData.date }
                ]
            }
            : {};
        const textFilter = {};
        if (filter && JSON.stringify(filter) !== '{}') {
            textFilter.$and = [];
        }
        // TODO: Rename to search
        if ((filter === null || filter === void 0 ? void 0 : filter.mail) !== undefined) {
            (_a = textFilter.$and) === null || _a === void 0 ? void 0 : _a.push({ mail: { $regex: (0, utility_2.escapeRegExp)(filter.mail), $options: 'i' } });
        }
        if ((filter === null || filter === void 0 ? void 0 : filter.paidAt) !== undefined) {
            const { comparison, date } = filter.paidAt;
            (_b = textFilter.$and) === null || _b === void 0 ? void 0 : _b.push({
                paidAt: { [(0, utility_1.mapDateFilterComparisonToMongoQueryOperatior)(comparison)]: date }
            });
        }
        if ((filter === null || filter === void 0 ? void 0 : filter.canceledAt) !== undefined) {
            const { comparison, date } = filter.canceledAt;
            (_c = textFilter.$and) === null || _c === void 0 ? void 0 : _c.push({
                canceledAt: { [(0, utility_1.mapDateFilterComparisonToMongoQueryOperatior)(comparison)]: date }
            });
        }
        if ((filter === null || filter === void 0 ? void 0 : filter.userID) !== undefined) {
            (_d = textFilter.$and) === null || _d === void 0 ? void 0 : _d.push({ userID: { $eq: filter.userID } });
        }
        if ((filter === null || filter === void 0 ? void 0 : filter.subscriptionID) !== undefined) {
            (_e = textFilter.$and) === null || _e === void 0 ? void 0 : _e.push({ subscriptionID: { $eq: filter.subscriptionID } });
        }
        const [totalCount, invoices] = await Promise.all([
            this.invoices.countDocuments(textFilter, {
                collation: { locale: this.locale, strength: 2 }
            }),
            this.invoices
                .aggregate([], { collation: { locale: this.locale, strength: 2 } })
                .match(textFilter)
                .match(cursorFilter)
                .sort({ [sortField]: sortDirection, _id: sortDirection })
                .skip((_f = limit.skip) !== null && _f !== void 0 ? _f : 0)
                .limit(limitCount + 1)
                .toArray()
        ]);
        const nodes = invoices.slice(0, limitCount);
        if (limit.type === api_1.LimitType.Last) {
            nodes.reverse();
        }
        const hasNextPage = limit.type === api_1.LimitType.First
            ? invoices.length > limitCount
            : cursor.type === api_1.InputCursorType.Before;
        const hasPreviousPage = limit.type === api_1.LimitType.Last
            ? invoices.length > limitCount
            : cursor.type === api_1.InputCursorType.After;
        const firstInvoice = nodes[0];
        const lastInvoice = nodes[nodes.length - 1];
        const startCursor = firstInvoice
            ? new cursor_1.Cursor(firstInvoice._id, invoiceDateForSort(firstInvoice, sort)).toString()
            : null;
        const endCursor = lastInvoice
            ? new cursor_1.Cursor(lastInvoice._id, invoiceDateForSort(lastInvoice, sort)).toString()
            : null;
        return {
            nodes: nodes.map((_a) => {
                var { _id: id } = _a, invoice = __rest(_a, ["_id"]);
                return (Object.assign({ id }, invoice));
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
exports.MongoDBInvoiceAdapter = MongoDBInvoiceAdapter;
function invoiceSortFieldForSort(sort) {
    switch (sort) {
        case api_1.InvoiceSort.CreatedAt:
            return 'createdAt';
        case api_1.InvoiceSort.ModifiedAt:
            return 'modifiedAt';
        case api_1.InvoiceSort.PaidAt:
            return 'paidAt';
    }
}
function invoiceDateForSort(invoice, sort) {
    switch (sort) {
        case api_1.InvoiceSort.CreatedAt:
            return invoice.createdAt;
        case api_1.InvoiceSort.ModifiedAt:
            return invoice.modifiedAt;
        case api_1.InvoiceSort.PaidAt:
            return invoice.paidAt ? invoice.paidAt : invoice.createdAt;
        default:
            return invoice.createdAt;
    }
}
//# sourceMappingURL=invoice.js.map