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
exports.MongoDBArticleAdapter = void 0;
const api_1 = require("@wepublish/api");
const schema_1 = require("./schema");
const defaults_1 = require("./defaults");
const cursor_1 = require("./cursor");
const utility_1 = require("../utility");
class MongoDBArticleAdapter {
    constructor(db, locale) {
        this.articles = db.collection(schema_1.CollectionName.Articles);
        this.locale = locale;
    }
    async createArticle({ input }) {
        const { shared } = input, data = __rest(input, ["shared"]);
        const { ops } = await this.articles.insertOne({
            shared,
            createdAt: new Date(),
            modifiedAt: new Date(),
            draft: Object.assign({ revision: 0, createdAt: new Date() }, data),
            pending: null,
            published: null
        });
        const _a = ops[0], { _id: id } = _a, article = __rest(_a, ["_id"]);
        return Object.assign({ id }, article);
    }
    async updateArticle({ id, input }) {
        const { shared } = input, data = __rest(input
        // TODO: Escape user input with `$literal`, check other adapters aswell.
        , ["shared"]);
        // TODO: Escape user input with `$literal`, check other adapters aswell.
        const { value } = await this.articles.findOneAndUpdate({ _id: id }, [
            {
                $set: {
                    shared,
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
                    'draft.title': data.title,
                    'draft.preTitle': data.preTitle,
                    'draft.lead': data.lead,
                    'draft.seoTitle': data.seoTitle,
                    'draft.slug': data.slug,
                    'draft.imageID': data.imageID,
                    'draft.authorIDs': data.authorIDs,
                    'draft.tags': data.tags,
                    'draft.breaking': data.breaking,
                    'draft.properties': data.properties,
                    'draft.blocks': data.blocks,
                    'draft.hideAuthor': data.hideAuthor,
                    'draft.canonicalUrl': data.canonicalUrl,
                    'draft.socialMediaTitle': data.socialMediaTitle,
                    'draft.socialMediaAuthorIDs': data.socialMediaAuthorIDs,
                    'draft.socialMediaDescription': data.socialMediaDescription,
                    'draft.socialMediaImageID': data.socialMediaImageID
                }
            }
        ], { returnOriginal: false });
        if (!value)
            return null;
        const { _id: outID } = value, article = __rest(value, ["_id"]);
        return Object.assign({ id: outID }, article);
    }
    async deleteArticle({ id }) {
        const { deletedCount } = await this.articles.deleteOne({ _id: id });
        return deletedCount !== 0 ? true : null;
    }
    async publishArticle({ id, publishAt, publishedAt, updatedAt }) {
        publishAt = publishAt !== null && publishAt !== void 0 ? publishAt : new Date();
        if (publishAt > new Date()) {
            const { value } = await this.articles.findOneAndUpdate({ _id: id }, [
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
            const { _id: outID } = value, article = __rest(value, ["_id"]);
            return Object.assign({ id: outID }, article);
        }
        else {
            const { value } = await this.articles.findOneAndUpdate({ _id: id }, [
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
            const { _id: outID } = value, article = __rest(value, ["_id"]);
            return Object.assign({ id: outID }, article);
        }
    }
    async unpublishArticle({ id }) {
        const { value } = await this.articles.findOneAndUpdate({ _id: id }, [
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
        const { _id: outID } = value, article = __rest(value, ["_id"]);
        return Object.assign({ id: outID }, article);
    }
    async getArticlesByID(ids) {
        await this.updatePendingArticles();
        const articles = await this.articles.find({ _id: { $in: ids } }).toArray();
        const articleMap = Object.fromEntries(articles.map((_a) => {
            var { _id: id } = _a, article = __rest(_a, ["_id"]);
            return [id, Object.assign({ id }, article)];
        }));
        return ids.map(id => { var _a; return (_a = articleMap[id]) !== null && _a !== void 0 ? _a : null; });
    }
    // TODO: Deduplicate getImages, getPages, getAuthors
    async getArticles({ filter, sort, order, cursor, limit }) {
        var _a;
        await this.updatePendingArticles();
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
        const sortField = articleSortFieldForSort(sort);
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
        if ((filter === null || filter === void 0 ? void 0 : filter.shared) != undefined) {
            stateFilter['shared'] = { [filter.shared ? '$ne' : '$eq']: false };
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
        if (filter === null || filter === void 0 ? void 0 : filter.authors) {
            // TODO: Only match based on state filter
            metaFilters.push({
                $or: [
                    { 'draft.authorIDs': { $in: filter.authors } },
                    { 'pending.authorIDs': { $in: filter.authors } },
                    { 'published.authorIDs': { $in: filter.authors } }
                ]
            });
        }
        // TODO: Check index usage
        const [totalCount, articles] = await Promise.all([
            this.articles.countDocuments({ $and: [stateFilter, metaFilters.length ? { $and: metaFilters } : {}, textFilter] }, { collation: { locale: this.locale, strength: 2 } }),
            this.articles
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
        const nodes = articles.slice(0, limitCount);
        if (limit.type === api_1.LimitType.Last) {
            nodes.reverse();
        }
        const hasNextPage = limit.type === api_1.LimitType.First
            ? articles.length > limitCount
            : cursor.type === api_1.InputCursorType.Before
                ? true
                : false;
        const hasPreviousPage = limit.type === api_1.LimitType.Last
            ? articles.length > limitCount
            : cursor.type === api_1.InputCursorType.After
                ? true
                : false;
        const firstArticle = nodes[0];
        const lastArticle = nodes[nodes.length - 1];
        const startCursor = firstArticle
            ? new cursor_1.Cursor(firstArticle._id, articleDateForSort(firstArticle, sort)).toString()
            : null;
        const endCursor = lastArticle
            ? new cursor_1.Cursor(lastArticle._id, articleDateForSort(lastArticle, sort)).toString()
            : null;
        return {
            nodes: nodes.map((_a) => {
                var { _id: id } = _a, article = __rest(_a, ["_id"]);
                return (Object.assign({ id }, article));
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
    async getPublishedArticlesByID(ids) {
        await this.updatePendingArticles();
        const articles = await this.articles
            .find({ _id: { $in: ids }, $or: [{ published: { $ne: null } }, { pending: { $ne: null } }] })
            .toArray();
        const articleMap = Object.fromEntries(articles.map(({ _id: id, shared, published, pending }) => [
            id,
            Object.assign({ id, shared }, (published || pending))
        ]));
        return ids.map(id => { var _a; return (_a = articleMap[id]) !== null && _a !== void 0 ? _a : null; });
    }
    async getPublishedArticleBySlug(slug) {
        await this.updatePendingArticles();
        const article = await this.articles.findOne({
            $or: [
                { published: { $ne: null }, 'published.slug': { $eq: slug } },
                { pending: { $ne: null }, 'pending.slug': { $eq: slug } }
            ]
        });
        return (article === null || article === void 0 ? void 0 : article.published) || (article === null || article === void 0 ? void 0 : article.pending)
            ? Object.assign({ id: article._id, shared: article.shared }, (article.published || article.pending))
            : null;
    }
    async getPublishedArticles({ filter, sort, order, cursor, limit }) {
        const { nodes, pageInfo, totalCount } = await this.getArticles({
            filter: Object.assign(Object.assign({}, filter), { published: true }),
            sort,
            order,
            cursor,
            limit
        });
        return {
            nodes: nodes.map(article => (Object.assign({ id: article.id, shared: article.shared }, article.published))),
            pageInfo,
            totalCount
        };
    }
    // TODO: Throttle or cron this function
    async updatePendingArticles() {
        await this.articles.updateMany({ 'pending.publishAt': { $lte: new Date() } }, [
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
exports.MongoDBArticleAdapter = MongoDBArticleAdapter;
function articleSortFieldForSort(sort) {
    switch (sort) {
        case api_1.ArticleSort.CreatedAt:
            return 'createdAt';
        case api_1.ArticleSort.ModifiedAt:
            return 'modifiedAt';
        case api_1.ArticleSort.PublishedAt:
            return 'published.publishedAt';
        case api_1.ArticleSort.UpdatedAt:
            return 'published.updatedAt';
        case api_1.ArticleSort.PublishAt:
            return 'pending.publishAt';
    }
}
function articleDateForSort(article, sort) {
    var _a, _b, _c;
    switch (sort) {
        case api_1.ArticleSort.CreatedAt:
            return article.createdAt;
        case api_1.ArticleSort.ModifiedAt:
            return article.modifiedAt;
        case api_1.ArticleSort.PublishedAt:
            return (_a = article.published) === null || _a === void 0 ? void 0 : _a.publishedAt;
        case api_1.ArticleSort.UpdatedAt:
            return (_b = article.published) === null || _b === void 0 ? void 0 : _b.updatedAt;
        case api_1.ArticleSort.PublishAt:
            return (_c = article.pending) === null || _c === void 0 ? void 0 : _c.publishAt;
    }
}
//# sourceMappingURL=article.js.map