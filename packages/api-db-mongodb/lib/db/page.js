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
exports.MongoDBPageAdapter = void 0;
const api_1 = require("@wepublish/api");
const schema_1 = require("./schema");
const defaults_1 = require("./defaults");
const cursor_1 = require("./cursor");
const utility_1 = require("../utility");
class MongoDBPageAdapter {
    constructor(db, locale) {
        this.pages = db.collection(schema_1.CollectionName.Pages);
        this.locale = locale;
    }
    async createPage({ input }) {
        const data = __rest(input, []);
        const { ops } = await this.pages.insertOne({
            createdAt: new Date(),
            modifiedAt: new Date(),
            draft: Object.assign({ revision: 0, createdAt: new Date() }, data),
            pending: null,
            published: null
        });
        const _a = ops[0], { _id: id } = _a, page = __rest(_a, ["_id"]);
        return Object.assign({ id }, page);
    }
    async updatePage({ id, input }) {
        const data = __rest(input, []);
        const { value } = await this.pages.findOneAndUpdate({ _id: id }, [
            {
                $set: {
                    modifiedAt: new Date(),
                    'draft.revision': {
                        $ifNull: [
                            '$draft.revision',
                            {
                                $cond: [
                                    { $ne: ['$pending', null] },
                                    { $add: ['$pending.revision', 1] },
                                    {
                                        $cond: [{ $ne: ['$published', null] }, { $add: ['$published.revision', 1] }, 0]
                                    }
                                ]
                            }
                        ]
                    },
                    'draft.createdAt': {
                        $ifNull: ['$draft.createdAt', new Date()]
                    },
                    'draft.slug': data.slug,
                    'draft.title': data.title,
                    'draft.description': data.description,
                    'draft.imageID': data.imageID,
                    'draft.tags': data.tags,
                    'draft.socialMediaTitle': data.socialMediaTitle,
                    'draft.socialMediaDescription': data.socialMediaDescription,
                    'draft.socialMediaImageID': data.socialMediaImageID,
                    'draft.properties': data.properties,
                    'draft.blocks': data.blocks
                }
            }
        ], { returnOriginal: false });
        if (!value)
            return null;
        const { _id: outID } = value, page = __rest(value, ["_id"]);
        return Object.assign({ id: outID }, page);
    }
    async deletePage({ id }) {
        const { deletedCount } = await this.pages.deleteOne({ _id: id });
        return deletedCount !== 0 ? true : null;
    }
    async publishPage({ id, publishAt, publishedAt, updatedAt }) {
        publishAt = publishAt !== null && publishAt !== void 0 ? publishAt : new Date();
        if (publishAt > new Date()) {
            const { value } = await this.pages.findOneAndUpdate({ _id: id }, [
                {
                    $set: {
                        modifiedAt: new Date(),
                        pending: {
                            $cond: [
                                { $ne: ['$draft', null] },
                                '$draft',
                                {
                                    $cond: [
                                        { $ne: ['$pending', null] },
                                        '$pending',
                                        { $cond: [{ $ne: ['$published', null] }, '$published', null] }
                                    ]
                                }
                            ]
                        },
                        draft: null
                    }
                },
                {
                    $set: {
                        'pending.publishAt': publishAt,
                        'pending.publishedAt': publishedAt !== null && publishedAt !== void 0 ? publishedAt : {
                            $cond: [{ $ne: ['$published', null] }, '$published.publishedAt', publishAt]
                        },
                        'pending.updatedAt': updatedAt !== null && updatedAt !== void 0 ? updatedAt : publishAt
                    }
                }
            ], { returnOriginal: false });
            if (!value)
                return null;
            const { _id: outID } = value, page = __rest(value, ["_id"]);
            return Object.assign({ id: outID }, page);
        }
        else {
            const { value } = await this.pages.findOneAndUpdate({ _id: id }, [
                {
                    $set: {
                        tempPublishedAt: '$published.publishedAt'
                    }
                },
                {
                    $set: {
                        published: {
                            $ifNull: ['$draft', { $ifNull: ['$pending', '$published'] }]
                        },
                        pending: null,
                        draft: null
                    }
                },
                {
                    $set: {
                        'published.publishedAt': publishedAt !== null && publishedAt !== void 0 ? publishedAt : {
                            $ifNull: ['$tempPublishedAt', publishAt]
                        },
                        'published.updatedAt': updatedAt !== null && updatedAt !== void 0 ? updatedAt : publishAt
                    }
                },
                {
                    $unset: ['tempPublishedAt', 'published.publishAt']
                }
            ], { returnOriginal: false });
            if (!value)
                return null;
            const { _id: outID } = value, page = __rest(value, ["_id"]);
            return Object.assign({ id: outID }, page);
        }
    }
    async unpublishPage({ id }) {
        const { value } = await this.pages.findOneAndUpdate({ _id: id }, [
            {
                $set: {
                    draft: {
                        $ifNull: ['$draft', { $ifNull: ['$pending', '$published'] }]
                    },
                    pending: null,
                    published: null
                }
            },
            {
                $unset: ['draft.publishAt', 'draft.publishedAt', 'draft.updatedAt']
            }
        ], { returnOriginal: false });
        if (!value)
            return null;
        const { _id: outID } = value, page = __rest(value, ["_id"]);
        return Object.assign({ id: outID }, page);
    }
    async getPagesByID(ids) {
        await this.updatePendingPages();
        const pages = await this.pages.find({ _id: { $in: ids } }).toArray();
        const pageMap = Object.fromEntries(pages.map((_a) => {
            var { _id: id } = _a, page = __rest(_a, ["_id"]);
            return [id, Object.assign({ id }, page)];
        }));
        return ids.map(id => { var _a; return (_a = pageMap[id]) !== null && _a !== void 0 ? _a : null; });
    }
    async getPages({ filter, sort, order, cursor, limit }) {
        var _a;
        await this.updatePendingPages();
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
        const sortField = pageSortFieldForSort(sort);
        const cursorFilter = cursorData
            ? {
                $or: [
                    { [sortField]: { [expr]: cursorData.date } },
                    { _id: { [expr]: cursorData.id }, [sortField]: cursorData.date }
                ]
            }
            : {};
        let stateFilter = {};
        let textFilter = {};
        let metaFilters = [];
        if ((filter === null || filter === void 0 ? void 0 : filter.title) != undefined) {
            // TODO: Only match based on state filter
            textFilter['$or'] = [
                { 'draft.title': { $regex: (0, utility_1.escapeRegExp)(filter.title), $options: 'i' } },
                { 'pending.title': { $regex: (0, utility_1.escapeRegExp)(filter.title), $options: 'i' } },
                { 'published.title': { $regex: (0, utility_1.escapeRegExp)(filter.title), $options: 'i' } }
            ];
        }
        if ((filter === null || filter === void 0 ? void 0 : filter.published) != undefined) {
            stateFilter['published'] = { [filter.published ? '$ne' : '$eq']: null };
        }
        if ((filter === null || filter === void 0 ? void 0 : filter.draft) != undefined) {
            stateFilter['draft'] = { [filter.draft ? '$ne' : '$eq']: null };
        }
        if ((filter === null || filter === void 0 ? void 0 : filter.pending) != undefined) {
            stateFilter['pending'] = { [filter.pending ? '$ne' : '$eq']: null };
        }
        if (filter === null || filter === void 0 ? void 0 : filter.tags) {
            // TODO: Only match based on state filter
            metaFilters.push({
                $or: [
                    { 'draft.tags': { $in: filter.tags } },
                    { 'pending.tags': { $in: filter.tags } },
                    { 'published.tags': { $in: filter.tags } }
                ]
            });
        }
        // TODO: Check index usage
        const [totalCount, pages] = await Promise.all([
            this.pages.countDocuments({ $and: [stateFilter, metaFilters.length ? { $and: metaFilters } : {}, textFilter] }, { collation: { locale: this.locale, strength: 2 } }),
            this.pages
                .aggregate([], { collation: { locale: this.locale, strength: 2 } })
                .match(stateFilter)
                .match(metaFilters.length ? { $and: metaFilters } : {})
                .match(textFilter)
                .match(cursorFilter)
                .sort({ [sortField]: sortDirection, _id: sortDirection })
                .skip((_a = limit.skip) !== null && _a !== void 0 ? _a : 0)
                .limit(limitCount + 1)
                .toArray()
        ]);
        const nodes = pages.slice(0, limitCount);
        if (limit.type === api_1.LimitType.Last) {
            nodes.reverse();
        }
        const hasNextPage = limit.type === api_1.LimitType.First
            ? pages.length > limitCount
            : cursor.type === api_1.InputCursorType.Before
                ? true
                : false;
        const hasPreviousPage = limit.type === api_1.LimitType.Last
            ? pages.length > limitCount
            : cursor.type === api_1.InputCursorType.After
                ? true
                : false;
        const firstPage = nodes[0];
        const lastPage = nodes[nodes.length - 1];
        const startCursor = firstPage
            ? new cursor_1.Cursor(firstPage._id, pageDateForSort(firstPage, sort)).toString()
            : null;
        const endCursor = lastPage
            ? new cursor_1.Cursor(lastPage._id, pageDateForSort(lastPage, sort)).toString()
            : null;
        return {
            nodes: nodes.map((_a) => {
                var { _id: id } = _a, page = __rest(_a, ["_id"]);
                return (Object.assign({ id }, page));
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
    async getPublishedPagesByID(ids) {
        await this.updatePendingPages();
        const pages = await this.pages
            .find({ _id: { $in: ids }, $or: [{ published: { $ne: null } }, { pending: { $ne: null } }] })
            .toArray();
        const pageMap = Object.fromEntries(pages.map(({ _id: id, published, pending }) => [id, Object.assign({ id }, (published || pending))]));
        return ids.map(id => { var _a; return (_a = pageMap[id]) !== null && _a !== void 0 ? _a : null; });
    }
    async getPublishedPagesBySlug(slugs) {
        await this.updatePendingPages();
        const pages = await this.pages
            .find({
            $or: [
                { published: { $ne: null }, 'published.slug': { $in: slugs } },
                { pending: { $ne: null }, 'pending.slug': { $in: slugs } }
            ]
        })
            .toArray();
        const pageMap = Object.fromEntries(pages.map(({ _id: id, published, pending }) => {
            var _a;
            return [
                ((_a = published === null || published === void 0 ? void 0 : published.slug) !== null && _a !== void 0 ? _a : pending === null || pending === void 0 ? void 0 : pending.slug),
                Object.assign({ id }, (published || pending))
            ];
        }));
        return slugs.map(slug => { var _a; return (_a = pageMap[slug]) !== null && _a !== void 0 ? _a : null; });
    }
    async getPublishedPages({ filter, sort, order, cursor, limit }) {
        const { nodes, pageInfo, totalCount } = await this.getPages({
            filter: Object.assign(Object.assign({}, filter), { published: true }),
            sort,
            order,
            cursor,
            limit
        });
        return {
            nodes: nodes.map(page => (Object.assign({ id: page.id }, page.published))),
            pageInfo,
            totalCount
        };
    }
    // TODO: Throttle or cron this function
    async updatePendingPages() {
        await this.pages.updateMany({ 'pending.publishAt': { $lte: new Date() } }, [
            {
                $set: {
                    modifiedAt: new Date(),
                    published: '$pending',
                    pending: null
                }
            }
        ]);
    }
}
exports.MongoDBPageAdapter = MongoDBPageAdapter;
function pageSortFieldForSort(sort) {
    switch (sort) {
        case api_1.PageSort.CreatedAt:
            return 'createdAt';
        case api_1.PageSort.ModifiedAt:
            return 'modifiedAt';
        case api_1.PageSort.PublishedAt:
            return 'published.publishedAt';
        case api_1.PageSort.UpdatedAt:
            return 'published.updatedAt';
        case api_1.PageSort.PublishAt:
            return 'pending.publishAt';
    }
}
function pageDateForSort(page, sort) {
    var _a, _b, _c;
    switch (sort) {
        case api_1.PageSort.CreatedAt:
            return page.createdAt;
        case api_1.PageSort.ModifiedAt:
            return page.modifiedAt;
        case api_1.PageSort.PublishedAt:
            return (_a = page.published) === null || _a === void 0 ? void 0 : _a.publishedAt;
        case api_1.PageSort.UpdatedAt:
            return (_b = page.published) === null || _b === void 0 ? void 0 : _b.updatedAt;
        case api_1.PageSort.PublishAt:
            return (_c = page.pending) === null || _c === void 0 ? void 0 : _c.publishAt;
    }
}
//# sourceMappingURL=page.js.map