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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBSubscriptionAdapter = void 0;
const api_1 = require("@wepublish/api");
const schema_1 = require("./schema");
const defaults_1 = require("./defaults");
const cursor_1 = require("./cursor");
const nanoid_1 = __importDefault(require("nanoid"));
const utility_1 = require("./utility");
class MongoDBSubscriptionAdapter {
    constructor(db, locale) {
        this.subscriptions = db.collection(schema_1.CollectionName.Subscriptions);
        this.locale = locale;
    }
    async createSubscription({ input }) {
        const { ops } = await this.subscriptions.insertOne({
            createdAt: new Date(),
            modifiedAt: new Date(),
            userID: input.userID,
            memberPlanID: input.memberPlanID,
            paymentMethodID: input.paymentMethodID,
            monthlyAmount: input.monthlyAmount,
            autoRenew: input.autoRenew,
            startsAt: input.startsAt,
            paymentPeriodicity: input.paymentPeriodicity,
            properties: input.properties,
            deactivation: input.deactivation,
            paidUntil: input.paidUntil,
            periods: []
        });
        const _a = ops[0], { _id: id } = _a, data = __rest(_a, ["_id"]);
        return Object.assign({ id }, data);
    }
    async updateSubscription({ id, input }) {
        const { value } = await this.subscriptions.findOneAndUpdate({ _id: id }, {
            $set: {
                modifiedAt: new Date(),
                userID: input.userID,
                memberPlanID: input.memberPlanID,
                paymentMethodID: input.paymentMethodID,
                monthlyAmount: input.monthlyAmount,
                autoRenew: input.autoRenew,
                startsAt: input.startsAt,
                paymentPeriodicity: input.paymentPeriodicity,
                properties: input.properties,
                deactivation: input.deactivation,
                paidUntil: input.paidUntil
            }
        }, { returnOriginal: false });
        if (!value)
            return null;
        const { _id: outID } = value, data = __rest(value, ["_id"]);
        return Object.assign({ id: outID }, data);
    }
    async updateUserID(subscriptionID, userID) {
        const { value } = await this.subscriptions.findOneAndUpdate({ _id: subscriptionID }, {
            $set: {
                modifiedAt: new Date(),
                userID
            }
        });
        if (!value)
            return null;
        return await this.subscriptions.findOne({ _id: subscriptionID });
    }
    async deleteSubscription({ id }) {
        const { deletedCount } = await this.subscriptions.deleteOne({ _id: id });
        return deletedCount !== 0 ? id : null;
    }
    async addSubscriptionPeriod({ subscriptionID, input }) {
        const subscription = await this.subscriptions.findOne({ _id: subscriptionID });
        if (!subscription)
            return null;
        const { periods = [] } = subscription;
        periods.push({
            id: (0, nanoid_1.default)(),
            createdAt: new Date(),
            amount: input.amount,
            paymentPeriodicity: input.paymentPeriodicity,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            invoiceID: input.invoiceID
        });
        const { value } = await this.subscriptions.findOneAndUpdate({ _id: subscriptionID }, {
            $set: {
                modifiedAt: new Date(),
                periods: periods
            }
        }, { returnOriginal: false });
        if (!value)
            return null;
        const { _id: id } = value, data = __rest(value, ["_id"]);
        return Object.assign({ id }, data);
    }
    async deleteSubscriptionPeriod({ subscriptionID, periodID }) {
        const subscription = await this.subscriptions.findOne({ _id: subscriptionID });
        if (!subscription)
            return null;
        const { periods = [] } = subscription;
        const updatedPeriods = periods.filter(period => period.id !== periodID);
        const { value } = await this.subscriptions.findOneAndUpdate({ _id: subscriptionID }, {
            $set: {
                modifiedAt: new Date(),
                periods: updatedPeriods
            }
        }, { returnOriginal: false });
        if (!value)
            return null;
        const { _id: id } = value, data = __rest(value, ["_id"]);
        return Object.assign({ id }, data);
    }
    async getSubscriptionByID(id) {
        const subscription = await this.subscriptions.findOne({ _id: id });
        return subscription ? Object.assign({ id: subscription._id }, subscription) : null;
    }
    async getSubscriptionsByID(ids) {
        const subscriptions = await this.subscriptions.find({ _id: { $in: ids } }).toArray();
        const subscriptionMap = Object.fromEntries(subscriptions.map((_a) => {
            var { _id: id } = _a, data = __rest(_a, ["_id"]);
            return [id, Object.assign({ id }, data)];
        }));
        return ids.map(id => { var _a; return (_a = subscriptionMap[id]) !== null && _a !== void 0 ? _a : null; });
    }
    async getSubscriptionsByUserID(userID) {
        const subscriptions = await this.subscriptions.find({ userID: { $eq: userID } }).toArray();
        return subscriptions.map((_a) => {
            var { _id: id } = _a, data = __rest(_a, ["_id"]);
            return (Object.assign({ id }, data));
        });
    }
    async getSubscriptions({ filter, joins, sort, order, cursor, limit }) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
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
        const sortField = subscriptionSortFieldForSort(sort);
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
        // support for old filters https://github.com/wepublish/wepublish/issues/601 -->
        if ((filter === null || filter === void 0 ? void 0 : filter.startsAt) !== undefined) {
            const { comparison, date } = filter.startsAt;
            (_a = textFilter.$and) === null || _a === void 0 ? void 0 : _a.push({
                startsAt: { [(0, utility_1.mapDateFilterComparisonToMongoQueryOperatior)(comparison)]: date }
            });
        }
        if ((filter === null || filter === void 0 ? void 0 : filter.paidUntil) !== undefined) {
            const { comparison, date } = filter.paidUntil;
            (_b = textFilter.$and) === null || _b === void 0 ? void 0 : _b.push({
                paidUntil: {
                    [(0, utility_1.mapDateFilterComparisonToMongoQueryOperatior)(comparison)]: date
                }
            });
        }
        // <-- support for old filters
        if (filter === null || filter === void 0 ? void 0 : filter.startsAtFrom) {
            const { comparison, date } = filter.startsAtFrom;
            (_c = textFilter.$and) === null || _c === void 0 ? void 0 : _c.push({
                startsAt: { [(0, utility_1.mapDateFilterComparisonToMongoQueryOperatior)(comparison)]: date }
            });
        }
        if (filter === null || filter === void 0 ? void 0 : filter.startsAtTo) {
            const { comparison, date } = filter.startsAtTo;
            (_d = textFilter.$and) === null || _d === void 0 ? void 0 : _d.push({
                startsAt: { [(0, utility_1.mapDateFilterComparisonToMongoQueryOperatior)(comparison)]: date }
            });
        }
        if (filter === null || filter === void 0 ? void 0 : filter.paidUntilFrom) {
            const { comparison, date } = filter.paidUntilFrom;
            (_e = textFilter.$and) === null || _e === void 0 ? void 0 : _e.push({
                paidUntil: {
                    [(0, utility_1.mapDateFilterComparisonToMongoQueryOperatior)(comparison)]: date
                }
            });
        }
        if (filter === null || filter === void 0 ? void 0 : filter.paidUntilTo) {
            const { comparison, date } = filter.paidUntilTo;
            (_f = textFilter.$and) === null || _f === void 0 ? void 0 : _f.push({
                paidUntil: {
                    [(0, utility_1.mapDateFilterComparisonToMongoQueryOperatior)(comparison)]: date
                }
            });
        }
        if ((filter === null || filter === void 0 ? void 0 : filter.deactivationDate) !== undefined) {
            const { comparison, date } = filter.deactivationDate;
            if (date === null) {
                (_g = textFilter.$and) === null || _g === void 0 ? void 0 : _g.push({ deactivation: { $eq: null } });
            }
            else {
                (_h = textFilter.$and) === null || _h === void 0 ? void 0 : _h.push({
                    'deactivation.date': {
                        [(0, utility_1.mapDateFilterComparisonToMongoQueryOperatior)(comparison)]: date
                    }
                });
            }
        }
        if ((filter === null || filter === void 0 ? void 0 : filter.deactivationDateFrom) !== undefined) {
            const { comparison, date } = filter.deactivationDateFrom;
            (_j = textFilter.$and) === null || _j === void 0 ? void 0 : _j.push({
                'deactivation.date': {
                    [(0, utility_1.mapDateFilterComparisonToMongoQueryOperatior)(comparison)]: date
                }
            });
        }
        if ((filter === null || filter === void 0 ? void 0 : filter.deactivationDateTo) !== undefined) {
            const { comparison, date } = filter.deactivationDateTo;
            (_k = textFilter.$and) === null || _k === void 0 ? void 0 : _k.push({
                'deactivation.date': {
                    [(0, utility_1.mapDateFilterComparisonToMongoQueryOperatior)(comparison)]: date
                }
            });
        }
        if ((filter === null || filter === void 0 ? void 0 : filter.deactivationReason) !== undefined) {
            const reason = filter.deactivationReason;
            (_l = textFilter.$and) === null || _l === void 0 ? void 0 : _l.push({
                'deactivation.reason': reason
            });
        }
        if ((filter === null || filter === void 0 ? void 0 : filter.autoRenew) !== undefined) {
            (_m = textFilter.$and) === null || _m === void 0 ? void 0 : _m.push({ autoRenew: { $eq: filter.autoRenew } });
        }
        if (filter === null || filter === void 0 ? void 0 : filter.paymentPeriodicity) {
            (_o = textFilter.$and) === null || _o === void 0 ? void 0 : _o.push({ paymentPeriodicity: { $eq: filter.paymentPeriodicity } });
        }
        if (filter === null || filter === void 0 ? void 0 : filter.paymentMethodID) {
            (_p = textFilter.$and) === null || _p === void 0 ? void 0 : _p.push({ paymentMethodID: { $eq: filter.paymentMethodID } });
        }
        if (filter === null || filter === void 0 ? void 0 : filter.memberPlanID) {
            (_q = textFilter.$and) === null || _q === void 0 ? void 0 : _q.push({ memberPlanID: { $eq: filter.memberPlanID } });
        }
        if (filter === null || filter === void 0 ? void 0 : filter.userID) {
            (_r = textFilter.$and) === null || _r === void 0 ? void 0 : _r.push({ userID: { $eq: filter.userID } });
        }
        // join related collections
        let preparedJoins = [];
        // member plan join
        if (joins === null || joins === void 0 ? void 0 : joins.joinMemberPlan) {
            preparedJoins = [
                {
                    $lookup: {
                        from: schema_1.CollectionName.MemberPlans,
                        localField: 'memberPlanID',
                        foreignField: '_id',
                        as: 'memberPlan'
                    }
                },
                { $unwind: '$memberPlan' }
            ];
        }
        // payment method join
        if (joins === null || joins === void 0 ? void 0 : joins.joinPaymentMethod) {
            preparedJoins = [
                ...preparedJoins,
                {
                    $lookup: {
                        from: schema_1.CollectionName.PaymentMethods,
                        localField: 'paymentMethodID',
                        foreignField: '_id',
                        as: 'paymentMethod'
                    }
                },
                { $unwind: '$paymentMethod' }
            ];
        }
        // user join
        if (joins === null || joins === void 0 ? void 0 : joins.joinUser) {
            preparedJoins = [
                ...preparedJoins,
                {
                    $lookup: {
                        from: schema_1.CollectionName.Users,
                        localField: 'userID',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' }
            ];
        }
        const [totalCount, subscriptions] = await Promise.all([
            this.subscriptions.countDocuments(textFilter, {
                collation: { locale: this.locale, strength: 2 }
            }),
            this.subscriptions
                .aggregate([...preparedJoins], { collation: { locale: this.locale, strength: 2 } })
                .match(textFilter)
                .match(cursorFilter)
                .sort({ [sortField]: sortDirection, _id: sortDirection })
                .skip((_s = limit.skip) !== null && _s !== void 0 ? _s : 0)
                .limit(limitCount + 1)
                .toArray()
        ]);
        const nodes = subscriptions.slice(0, limitCount);
        if (limit.type === api_1.LimitType.Last) {
            nodes.reverse();
        }
        const hasNextPage = limit.type === api_1.LimitType.First
            ? subscriptions.length > limitCount
            : cursor.type === api_1.InputCursorType.Before;
        const hasPreviousPage = limit.type === api_1.LimitType.Last
            ? subscriptions.length > limitCount
            : cursor.type === api_1.InputCursorType.After;
        const firstUser = nodes[0];
        const lastUser = nodes[nodes.length - 1];
        const startCursor = firstUser
            ? new cursor_1.Cursor(firstUser._id, subscriptionDateForSort(firstUser, sort)).toString()
            : null;
        const endCursor = lastUser
            ? new cursor_1.Cursor(lastUser._id, subscriptionDateForSort(lastUser, sort)).toString()
            : null;
        return {
            nodes: nodes.map((_a) => {
                var { _id: id } = _a, data = __rest(_a, ["_id"]);
                return (Object.assign({ id }, data));
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
exports.MongoDBSubscriptionAdapter = MongoDBSubscriptionAdapter;
function subscriptionSortFieldForSort(sort) {
    switch (sort) {
        case api_1.SubscriptionSort.CreatedAt:
            return 'createdAt';
        case api_1.SubscriptionSort.ModifiedAt:
            return 'modifiedAt';
    }
}
function subscriptionDateForSort(subscription, sort) {
    switch (sort) {
        case api_1.SubscriptionSort.CreatedAt:
            return subscription.createdAt;
        case api_1.SubscriptionSort.ModifiedAt:
            return subscription.modifiedAt;
    }
}
//# sourceMappingURL=subscription.js.map