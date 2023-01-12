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
exports.MongoDBMailLogAdapter = void 0;
const api_1 = require("@wepublish/api");
const schema_1 = require("./schema");
const cursor_1 = require("./cursor");
const defaults_1 = require("./defaults");
const utility_1 = require("../utility");
class MongoDBMailLogAdapter {
    constructor(db, locale) {
        this.mailLog = db.collection(schema_1.CollectionName.MailLog);
        this.locale = locale;
    }
    async createMailLog({ input }) {
        const { ops } = await this.mailLog.insertOne({
            createdAt: new Date(),
            modifiedAt: new Date(),
            recipient: input.recipient,
            subject: input.subject,
            state: input.state,
            mailProviderID: input.mailProviderID,
            mailData: input.mailData
        });
        const _a = ops[0], { _id: id } = _a, mailLog = __rest(_a, ["_id"]);
        return Object.assign({ id }, mailLog);
    }
    async updateMailLog({ id, input }) {
        const { value } = await this.mailLog.findOneAndUpdate({ _id: id }, {
            $set: {
                modifiedAt: new Date(),
                recipient: input.recipient,
                subject: input.subject,
                state: input.state,
                mailProviderID: input.mailProviderID,
                mailData: input.mailData
            }
        }, { returnOriginal: false });
        if (!value)
            return null;
        const { _id: outID } = value, mailLog = __rest(value, ["_id"]);
        return Object.assign({ id: outID }, mailLog);
    }
    async deleteMailLog({ id }) {
        const { deletedCount } = await this.mailLog.deleteOne({ _id: id });
        return deletedCount !== 0 ? id : null;
    }
    async getMailLogsByID(ids) {
        const mailLogs = await this.mailLog.find({ _id: { $in: ids } }).toArray();
        const mailLogMap = Object.fromEntries(mailLogs.map((_a) => {
            var { _id: id } = _a, mailLog = __rest(_a, ["_id"]);
            return [id, Object.assign({ id }, mailLog)];
        }));
        return ids.map(id => { var _a; return (_a = mailLogMap[id]) !== null && _a !== void 0 ? _a : null; });
    }
    async getMailLogs({ filter, sort, order, cursor, limit }) {
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
        const sortField = mailLogSortFieldForSort(sort);
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
        if ((filter === null || filter === void 0 ? void 0 : filter.subject) !== undefined) {
            textFilter.$or = [{ subject: { $regex: (0, utility_1.escapeRegExp)(filter.subject), $options: 'i' } }];
        }
        const [totalCount, mailLogs] = await Promise.all([
            this.mailLog.countDocuments(textFilter, {
                collation: { locale: this.locale, strength: 2 }
            }),
            this.mailLog
                .aggregate([], { collation: { locale: this.locale, strength: 2 } })
                .match(textFilter)
                .match(cursorFilter)
                .sort({ [sortField]: sortDirection, _id: sortDirection })
                .limit(limitCount + 1)
                .toArray()
        ]);
        const nodes = mailLogs.slice(0, limitCount);
        if (limit.type === api_1.LimitType.Last) {
            nodes.reverse();
        }
        const hasNextPage = limit.type === api_1.LimitType.First
            ? mailLogs.length > limitCount
            : cursor.type === api_1.InputCursorType.Before;
        const hasPreviousPage = limit.type === api_1.LimitType.Last
            ? mailLogs.length > limitCount
            : cursor.type === api_1.InputCursorType.After;
        const firstMailLog = nodes[0];
        const lastMailLog = nodes[nodes.length - 1];
        const startCursor = firstMailLog
            ? new cursor_1.Cursor(firstMailLog._id, mailLogDateForSort(firstMailLog, sort)).toString()
            : null;
        const endCursor = lastMailLog
            ? new cursor_1.Cursor(lastMailLog._id, mailLogDateForSort(lastMailLog, sort)).toString()
            : null;
        return {
            nodes: nodes.map((_a) => {
                var { _id: id } = _a, mailLog = __rest(_a, ["_id"]);
                return (Object.assign({ id }, mailLog));
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
exports.MongoDBMailLogAdapter = MongoDBMailLogAdapter;
function mailLogSortFieldForSort(sort) {
    switch (sort) {
        case api_1.MailLogSort.CreatedAt:
            return 'createdAt';
        case api_1.MailLogSort.ModifiedAt:
            return 'modifiedAt';
    }
}
function mailLogDateForSort(mailLog, sort) {
    switch (sort) {
        case api_1.MailLogSort.CreatedAt:
            return mailLog.createdAt;
        case api_1.MailLogSort.ModifiedAt:
            return mailLog.modifiedAt;
    }
}
//# sourceMappingURL=mailLog.js.map