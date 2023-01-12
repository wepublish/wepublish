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
exports.MongoDBAuthorAdapter = void 0;
const api_1 = require("@wepublish/api");
const schema_1 = require("./schema");
const cursor_1 = require("./cursor");
const defaults_1 = require("./defaults");
const utility_1 = require("../utility");
class MongoDBAuthorAdapter {
    constructor(db, locale) {
        this.authors = db.collection(schema_1.CollectionName.Authors);
        this.locale = locale;
    }
    async createAuthor({ input }) {
        const { ops } = await this.authors.insertOne({
            createdAt: new Date(),
            modifiedAt: new Date(),
            name: input.name,
            slug: input.slug,
            jobTitle: input.jobTitle,
            imageID: input.imageID,
            links: input.links,
            bio: input.bio
        });
        const _a = ops[0], { _id: id } = _a, author = __rest(_a, ["_id"]);
        return Object.assign({ id }, author);
    }
    async updateAuthor({ id, input }) {
        const { value } = await this.authors.findOneAndUpdate({ _id: id }, {
            $set: {
                modifiedAt: new Date(),
                name: input.name,
                slug: input.slug,
                jobTitle: input.jobTitle,
                imageID: input.imageID,
                links: input.links,
                bio: input.bio
            }
        }, { returnOriginal: false });
        if (!value)
            return null;
        const { _id: outID } = value, author = __rest(value, ["_id"]);
        return Object.assign({ id: outID }, author);
    }
    async deleteAuthor({ id }) {
        const { deletedCount } = await this.authors.deleteOne({ _id: id });
        return deletedCount !== 0 ? id : null;
    }
    async getAuthorsByID(ids) {
        const authors = await this.authors.find({ _id: { $in: ids } }).toArray();
        const authorMap = Object.fromEntries(authors.map((_a) => {
            var { _id: id } = _a, author = __rest(_a, ["_id"]);
            return [id, Object.assign({ id }, author)];
        }));
        return ids.map(id => { var _a; return (_a = authorMap[id]) !== null && _a !== void 0 ? _a : null; });
    }
    async getAuthorsBySlug(slugs) {
        const authors = await this.authors.find({ slug: { $in: slugs } }).toArray();
        const authorMap = Object.fromEntries(authors.map((_a) => {
            var { _id: id, slug } = _a, author = __rest(_a, ["_id", "slug"]);
            return [slug, Object.assign({ id, slug }, author)];
        }));
        return slugs.map(slug => { var _a; return (_a = authorMap[slug]) !== null && _a !== void 0 ? _a : null; });
    }
    async getAuthors({ filter, sort, order, cursor, limit }) {
        var _a;
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
        const sortField = authorSortFieldForSort(sort);
        const cursorFilter = cursorData
            ? {
                $or: [
                    { [sortField]: { [expr]: cursorData.date } },
                    { _id: { [expr]: cursorData.id }, [sortField]: cursorData.date }
                ]
            }
            : {};
        let textFilter = {};
        // TODO: Rename to search
        if ((filter === null || filter === void 0 ? void 0 : filter.name) != undefined) {
            textFilter['$or'] = [{ name: { $regex: (0, utility_1.escapeRegExp)(filter.name), $options: 'i' } }];
        }
        const [totalCount, authors] = await Promise.all([
            this.authors.countDocuments(textFilter, {
                collation: { locale: this.locale, strength: 2 }
            }),
            this.authors
                .aggregate([], { collation: { locale: this.locale, strength: 2 } })
                .match(textFilter)
                .match(cursorFilter)
                .sort({ [sortField]: sortDirection, _id: sortDirection })
                .skip((_a = limit.skip) !== null && _a !== void 0 ? _a : 0)
                .limit(limitCount + 1)
                .toArray()
        ]);
        const nodes = authors.slice(0, limitCount);
        if (limit.type === api_1.LimitType.Last) {
            nodes.reverse();
        }
        const hasNextPage = limit.type === api_1.LimitType.First
            ? authors.length > limitCount
            : cursor.type === api_1.InputCursorType.Before
                ? true
                : false;
        const hasPreviousPage = limit.type === api_1.LimitType.Last
            ? authors.length > limitCount
            : cursor.type === api_1.InputCursorType.After
                ? true
                : false;
        const firstAuthor = nodes[0];
        const lastAuthor = nodes[nodes.length - 1];
        const startCursor = firstAuthor
            ? new cursor_1.Cursor(firstAuthor._id, authorDateForSort(firstAuthor, sort)).toString()
            : null;
        const endCursor = lastAuthor
            ? new cursor_1.Cursor(lastAuthor._id, authorDateForSort(lastAuthor, sort)).toString()
            : null;
        return {
            nodes: nodes.map((_a) => {
                var { _id: id } = _a, author = __rest(_a, ["_id"]);
                return (Object.assign({ id }, author));
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
exports.MongoDBAuthorAdapter = MongoDBAuthorAdapter;
function authorSortFieldForSort(sort) {
    switch (sort) {
        case api_1.AuthorSort.CreatedAt:
            return 'createdAt';
        case api_1.AuthorSort.ModifiedAt:
            return 'modifiedAt';
        case api_1.AuthorSort.Name:
            return 'name';
    }
}
function authorDateForSort(author, sort) {
    switch (sort) {
        case api_1.AuthorSort.CreatedAt:
            return author.createdAt;
        case api_1.AuthorSort.ModifiedAt:
            return author.modifiedAt;
        case api_1.AuthorSort.Name:
            return author.createdAt;
    }
}
//# sourceMappingURL=author.js.map