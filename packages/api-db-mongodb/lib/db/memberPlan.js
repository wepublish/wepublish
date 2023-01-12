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
exports.MongoDBMemberPlanAdapter = void 0;
const api_1 = require("@wepublish/api");
const schema_1 = require("./schema");
const defaults_1 = require("./defaults");
const cursor_1 = require("./cursor");
const utility_1 = require("../utility");
class MongoDBMemberPlanAdapter {
    constructor(db, locale) {
        this.memberPlans = db.collection(schema_1.CollectionName.MemberPlans);
        this.locale = locale;
    }
    async createMemberPlan({ input }) {
        const { ops } = await this.memberPlans.insertOne({
            createdAt: new Date(),
            modifiedAt: new Date(),
            name: input.name,
            slug: input.slug,
            tags: input.tags ? input.tags : [],
            imageID: input.imageID,
            description: input.description,
            active: input.active,
            amountPerMonthMin: input.amountPerMonthMin,
            availablePaymentMethods: input.availablePaymentMethods
        });
        const _a = ops[0], { _id: id } = _a, memberPlan = __rest(_a, ["_id"]);
        return Object.assign({ id }, memberPlan);
    }
    async updateMemberPlan({ id, input }) {
        const { value } = await this.memberPlans.findOneAndUpdate({ _id: id }, {
            $set: {
                modifiedAt: new Date(),
                name: input.name,
                slug: input.slug,
                tags: input.tags,
                imageID: input.imageID,
                description: input.description,
                active: input.active,
                amountPerMonthMin: input.amountPerMonthMin,
                availablePaymentMethods: input.availablePaymentMethods
            }
        }, { returnOriginal: false });
        if (!value)
            return null;
        const { _id: outID } = value, memberPlan = __rest(value, ["_id"]);
        return Object.assign({ id: outID }, memberPlan);
    }
    async deleteMemberPlan({ id }) {
        const { deletedCount } = await this.memberPlans.deleteOne({ _id: id });
        return deletedCount !== 0 ? id : null;
    }
    async getMemberPlanById(id) {
        const memberPlan = await this.memberPlans.findOne({ _id: id });
        if (memberPlan) {
            const { _id: id } = memberPlan;
            return Object.assign({ id }, memberPlan);
        }
        return null;
    }
    async getMemberPlansByID(ids) {
        const memberPlans = await this.memberPlans.find({ _id: { $in: ids } }).toArray();
        const memberPlanMap = Object.fromEntries(memberPlans.map((_a) => {
            var { _id: id } = _a, memberPlan = __rest(_a, ["_id"]);
            return [id, Object.assign({ id }, memberPlan)];
        }));
        return ids.map(id => { var _a; return (_a = memberPlanMap[id]) !== null && _a !== void 0 ? _a : null; });
    }
    async getMemberPlansBySlug(slugs) {
        const memberPlans = await this.memberPlans.find({ slug: { $in: slugs } }).toArray();
        const memberPlansMap = Object.fromEntries(memberPlans.map((_a) => {
            var { _id: id, slug } = _a, memberPlan = __rest(_a, ["_id", "slug"]);
            return [slug, Object.assign({ id, slug }, memberPlan)];
        }));
        return slugs.map(slug => { var _a; return (_a = memberPlansMap[slug]) !== null && _a !== void 0 ? _a : null; });
    }
    async getMemberPlans({ filter, sort, order, cursor, limit }) {
        var _a, _b, _c;
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
        const sortField = memberPlanSortFieldForSort(sort);
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
        if ((filter === null || filter === void 0 ? void 0 : filter.name) !== undefined) {
            (_a = textFilter.$and) === null || _a === void 0 ? void 0 : _a.push({ name: { $regex: (0, utility_1.escapeRegExp)(filter.name), $options: 'i' } });
        }
        if ((filter === null || filter === void 0 ? void 0 : filter.active) !== undefined) {
            (_b = textFilter.$and) === null || _b === void 0 ? void 0 : _b.push({ active: filter.active });
        }
        if (filter === null || filter === void 0 ? void 0 : filter.tags) {
            (_c = textFilter.$and) === null || _c === void 0 ? void 0 : _c.push({ tags: { $in: filter.tags } });
        }
        const [totalCount, memberPlans] = await Promise.all([
            this.memberPlans.countDocuments(textFilter, {
                collation: { locale: this.locale, strength: 2 }
            }),
            // MongoCountPreferences doesn't include collation
            this.memberPlans
                .aggregate([], { collation: { locale: this.locale, strength: 2 } })
                .match(textFilter)
                .match(cursorFilter)
                .sort({ [sortField]: sortDirection, _id: sortDirection })
                .limit(limitCount + 1)
                .toArray()
        ]);
        const nodes = memberPlans.slice(0, limitCount);
        if (limit.type === api_1.LimitType.Last) {
            nodes.reverse();
        }
        const hasNextPage = limit.type === api_1.LimitType.First
            ? memberPlans.length > limitCount
            : cursor.type === api_1.InputCursorType.Before;
        const hasPreviousPage = limit.type === api_1.LimitType.Last
            ? memberPlans.length > limitCount
            : cursor.type === api_1.InputCursorType.After;
        const firstMemberPlan = nodes[0];
        const lastMemberPlan = nodes[nodes.length - 1];
        const startCursor = firstMemberPlan
            ? new cursor_1.Cursor(firstMemberPlan._id, memberPlanDateForSort(firstMemberPlan, sort)).toString()
            : null;
        const endCursor = lastMemberPlan
            ? new cursor_1.Cursor(lastMemberPlan._id, memberPlanDateForSort(lastMemberPlan, sort)).toString()
            : null;
        return {
            nodes: nodes.map((_a) => {
                var { _id: id } = _a, memberPlan = __rest(_a, ["_id"]);
                return (Object.assign({ id }, memberPlan));
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
    async getActiveMemberPlansByID(ids) {
        const memberPlans = await this.memberPlans.find({ _id: { $in: ids }, active: true }).toArray();
        const memberPlansMap = Object.fromEntries(memberPlans.map((_a) => {
            var { _id: id } = _a, memberPlan = __rest(_a, ["_id"]);
            return [id, Object.assign({ id }, memberPlan)];
        }));
        return ids.map(id => { var _a; return (_a = memberPlansMap[id]) !== null && _a !== void 0 ? _a : null; });
    }
    async getActiveMemberPlansBySlug(slugs) {
        const memberPlans = await this.memberPlans.find({ slug: { $in: slugs }, active: true }).toArray();
        const memberPlansMap = Object.fromEntries(memberPlans.map((_a) => {
            var { _id: id, slug } = _a, memberPlan = __rest(_a, ["_id", "slug"]);
            return [slug, Object.assign({ id, slug }, memberPlan)];
        }));
        return slugs.map(slug => { var _a; return (_a = memberPlansMap[slug]) !== null && _a !== void 0 ? _a : null; });
    }
    async getActiveMemberPlans({ filter, sort, order, cursor, limit }) {
        const { nodes, pageInfo, totalCount } = await this.getMemberPlans({
            filter: Object.assign(Object.assign({}, filter), { active: true }),
            sort,
            order,
            cursor,
            limit
        });
        return {
            nodes,
            pageInfo,
            totalCount
        };
    }
}
exports.MongoDBMemberPlanAdapter = MongoDBMemberPlanAdapter;
function memberPlanSortFieldForSort(sort) {
    switch (sort) {
        case api_1.MemberPlanSort.CreatedAt:
            return 'createdAt';
        case api_1.MemberPlanSort.ModifiedAt:
            return 'modifiedAt';
    }
}
function memberPlanDateForSort(memberPlan, sort) {
    switch (sort) {
        case api_1.MemberPlanSort.CreatedAt:
            return memberPlan.createdAt;
        case api_1.MemberPlanSort.ModifiedAt:
            return memberPlan.modifiedAt;
    }
}
//# sourceMappingURL=memberPlan.js.map