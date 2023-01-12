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
exports.MongoDBImageAdapter = void 0;
const api_1 = require("@wepublish/api");
const schema_1 = require("./schema");
const defaults_1 = require("./defaults");
const cursor_1 = require("./cursor");
const utility_1 = require("../utility");
class MongoDBImageAdapter {
    constructor(db, locale) {
        this.images = db.collection(schema_1.CollectionName.Images);
        this.locale = locale;
    }
    async createImage({ id, input }) {
        const { ops } = await this.images.insertOne({
            _id: id,
            createdAt: new Date(),
            modifiedAt: new Date(),
            fileSize: input.fileSize,
            extension: input.extension,
            mimeType: input.mimeType,
            format: input.format,
            width: input.width,
            height: input.height,
            filename: input.filename,
            title: input.title,
            description: input.description,
            tags: input.tags,
            source: input.source,
            link: input.link,
            license: input.license,
            focalPoint: input.focalPoint
        });
        const _a = ops[0], { _id: outID } = _a, image = __rest(_a, ["_id"]);
        return Object.assign({ id: outID }, image);
    }
    async updateImage({ id, input }) {
        const { value } = await this.images.findOneAndUpdate({ _id: id }, [
            {
                $set: {
                    modifiedAt: new Date(),
                    filename: input.filename,
                    title: input.title,
                    description: input.description,
                    tags: input.tags,
                    source: input.source,
                    link: input.link,
                    license: input.license,
                    focalPoint: input.focalPoint
                }
            }
        ], { returnOriginal: false });
        if (!value)
            return null;
        const { _id: outID } = value, image = __rest(value, ["_id"]);
        return Object.assign({ id: outID }, image);
    }
    async deleteImage({ id }) {
        const { deletedCount } = await this.images.deleteOne({ _id: id });
        return deletedCount !== 0 ? true : null;
    }
    async getImagesByID(ids) {
        const images = await this.images.find({ _id: { $in: ids } }).toArray();
        const imageMap = Object.fromEntries(images.map((_a) => {
            var { _id: id } = _a, article = __rest(_a, ["_id"]);
            return [id, Object.assign({ id }, article)];
        }));
        return ids.map(id => { var _a; return (_a = imageMap[id]) !== null && _a !== void 0 ? _a : null; });
    }
    async getImages({ filter, sort, order, cursor, limit }) {
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
        const sortField = imageSortFieldForSort(sort);
        const cursorFilter = cursorData
            ? {
                $or: [
                    { [sortField]: { [expr]: cursorData.date } },
                    { _id: { [expr]: cursorData.id }, [sortField]: cursorData.date }
                ]
            }
            : {};
        let textFilter = {};
        let metaFilters = [];
        // TODO: Rename to search
        if ((filter === null || filter === void 0 ? void 0 : filter.title) != undefined) {
            textFilter['$or'] = [
                { title: { $regex: (0, utility_1.escapeRegExp)(filter.title), $options: 'i' } },
                { filename: { $regex: (0, utility_1.escapeRegExp)(filter.title), $options: 'i' } }
            ];
        }
        if (filter === null || filter === void 0 ? void 0 : filter.tags) {
            metaFilters.push({ tags: { $in: filter.tags } });
        }
        const [totalCount, images] = await Promise.all([
            this.images.countDocuments({ $and: [metaFilters.length ? { $and: metaFilters } : {}, textFilter] }, { collation: { locale: this.locale, strength: 2 } }),
            this.images
                .aggregate([], { collation: { locale: this.locale, strength: 2 } })
                .match(metaFilters.length ? { $and: metaFilters } : {})
                .match(textFilter)
                .match(cursorFilter)
                .sort({ [sortField]: sortDirection, _id: sortDirection })
                .skip((_a = limit.skip) !== null && _a !== void 0 ? _a : 0)
                .limit(limitCount + 1)
                .toArray()
        ]);
        const nodes = images.slice(0, limitCount);
        if (limit.type === api_1.LimitType.Last) {
            nodes.reverse();
        }
        const hasNextPage = limit.type === api_1.LimitType.First
            ? images.length > limitCount
            : cursor.type === api_1.InputCursorType.Before
                ? true
                : false;
        const hasPreviousPage = limit.type === api_1.LimitType.Last
            ? images.length > limitCount
            : cursor.type === api_1.InputCursorType.After
                ? true
                : false;
        const firstImage = nodes[0];
        const lastImage = nodes[nodes.length - 1];
        const startCursor = firstImage
            ? new cursor_1.Cursor(firstImage._id, imageDateForSort(firstImage, sort)).toString()
            : null;
        const endCursor = lastImage
            ? new cursor_1.Cursor(lastImage._id, imageDateForSort(lastImage, sort)).toString()
            : null;
        return {
            nodes: nodes.map((_a) => {
                var { _id: id } = _a, image = __rest(_a, ["_id"]);
                return (Object.assign({ id }, image));
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
exports.MongoDBImageAdapter = MongoDBImageAdapter;
function imageSortFieldForSort(sort) {
    switch (sort) {
        case api_1.ImageSort.CreatedAt:
            return 'createdAt';
        case api_1.ImageSort.ModifiedAt:
            return 'modifiedAt';
    }
}
function imageDateForSort(image, sort) {
    switch (sort) {
        case api_1.ImageSort.CreatedAt:
            return image.createdAt;
        case api_1.ImageSort.ModifiedAt:
            return image.modifiedAt;
    }
}
//# sourceMappingURL=image.js.map