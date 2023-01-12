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
exports.MongoDBCommentAdapter = void 0;
const api_1 = require("@wepublish/api");
const cursor_1 = require("./cursor");
const defaults_1 = require("./defaults");
const schema_1 = require("./schema");
function commentSortFieldForSort(sort) {
    switch (sort) {
        case api_1.CommentSort.CreatedAt:
            return 'createdAt';
        case api_1.CommentSort.ModifiedAt:
            return 'modifiedAt';
    }
}
function commentDateForSort(comment, sort) {
    switch (sort) {
        case api_1.CommentSort.CreatedAt:
            return comment.createdAt;
        case api_1.CommentSort.ModifiedAt:
            return comment.modifiedAt;
    }
}
class MongoDBCommentAdapter {
    constructor(db, locale) {
        this.comments = db.collection(schema_1.CollectionName.Comments);
        this.locale = locale;
    }
    async addPublicComment({ input }) {
        const { text } = input, data = __rest(input, ["text"]);
        const { ops } = await this.comments.insertOne(Object.assign(Object.assign({}, data), { revisions: [
                {
                    text,
                    createdAt: new Date()
                }
            ], createdAt: new Date(), modifiedAt: new Date() }));
        const _a = ops[0], { _id: id } = _a, comment = __rest(_a, ["_id"]);
        return Object.assign(Object.assign({}, comment), { id,
            text });
    }
    async updatePublicComment({ id, text, state }) {
        const { value } = await this.comments.findOneAndUpdate({ _id: id }, {
            $set: {
                state,
                modifiedAt: new Date()
            },
            $addToSet: {
                revisions: {
                    text,
                    createdAt: new Date()
                }
            }
        }, {
            returnOriginal: false
        });
        if (!value)
            return null;
        const { _id: outID } = value, comment = __rest(value, ["_id"]);
        return Object.assign(Object.assign({}, comment), { id: outID, text });
    }
    async getComments({ filter, sort, order, cursor, limit }) {
        var _a;
        const metaFilters = [];
        if (filter === null || filter === void 0 ? void 0 : filter.state) {
            metaFilters.push({ state: filter.state });
        }
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
        const sortField = commentSortFieldForSort(sort);
        const cursorFilter = cursorData
            ? {
                $or: [
                    { [sortField]: { [expr]: cursorData.date } },
                    { _id: { [expr]: cursorData.id }, [sortField]: cursorData.date }
                ]
            }
            : {};
        const [totalCount, comments] = await Promise.all([
            this.comments.countDocuments({}, {
                collation: { locale: this.locale, strength: 2 }
            }),
            this.comments
                .aggregate([
                // sort depending on state value
                {
                    $addFields: {
                        stateSort: {
                            $indexOfArray: [
                                [
                                    api_1.CommentState.PendingApproval,
                                    api_1.CommentState.PendingUserChanges,
                                    api_1.CommentState.Approved,
                                    api_1.CommentState.Rejected
                                ],
                                '$state'
                            ]
                        }
                    }
                },
                {
                    $sort: {
                        stateSort: 1,
                        [sortField]: sortDirection
                    }
                }
            ], { collation: { locale: this.locale, strength: 2 } })
                .match(metaFilters.length ? { $and: metaFilters } : {})
                .match(cursorFilter)
                .skip((_a = limit.skip) !== null && _a !== void 0 ? _a : 0)
                .limit(limitCount + 1)
                .toArray()
        ]);
        const nodes = comments.slice(0, limitCount);
        if (limit.type === api_1.LimitType.Last) {
            nodes.reverse();
        }
        const hasNextPage = limit.type === api_1.LimitType.First
            ? comments.length > limitCount
            : cursor.type === api_1.InputCursorType.Before;
        const hasPreviousPage = limit.type === api_1.LimitType.Last
            ? comments.length > limitCount
            : cursor.type === api_1.InputCursorType.After;
        const firstComment = nodes[0];
        const lastComment = nodes[nodes.length - 1];
        const startCursor = firstComment
            ? new cursor_1.Cursor(firstComment._id, commentDateForSort(firstComment, sort)).toString()
            : null;
        const endCursor = lastComment
            ? new cursor_1.Cursor(lastComment._id, commentDateForSort(lastComment, sort)).toString()
            : null;
        return {
            nodes: comments.map((_a) => {
                var { _id: id } = _a, comment = __rest(_a, ["_id"]);
                return (Object.assign({ id }, comment));
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
    async getPublicCommentsForItemByID(args) {
        const { id, userID } = args;
        let userUnapprovedComments = [];
        const comments = await this.comments
            .aggregate([{ $sort: { modifiedAt: -1 } }], {
            collation: { locale: this.locale, strength: 2 }
        })
            .match({
            $and: [{ itemID: id }, { state: api_1.CommentState.Approved, parentID: null }]
        })
            .toArray();
        if (userID) {
            userUnapprovedComments = await this.comments
                .aggregate([{ $sort: { 'modifiedAt.date': -1 } }], {
                collation: { locale: this.locale, strength: 2 }
            })
                .match({
                $and: [{ itemID: id }, { userID }, { state: { $ne: api_1.CommentState.Approved } }, { parentID: null }]
            })
                .toArray();
        }
        return [...userUnapprovedComments, ...comments].map((_a) => {
            var { _id: id, revisions } = _a, comment = __rest(_a, ["_id", "revisions"]);
            return (Object.assign({ id, text: revisions[revisions.length - 1].text }, comment));
        });
    }
    async getCommentById(id) {
        const value = await this.comments.findOne({ _id: id });
        if (!value)
            return null;
        const { _id: outID } = value, comment = __rest(value, ["_id"]);
        return Object.assign({ id: outID }, comment);
    }
    async getPublicChildrenCommentsByParentId(id, userID) {
        const [childrenComments] = await Promise.all([
            this.comments
                .aggregate([{ $sort: { modifiedAt: -1 } }], {
                collation: { locale: this.locale, strength: 2 }
            })
                .match({
                $and: [{ parentID: id }, { $or: [{ state: api_1.CommentState.Approved }, { userID: userID }] }]
            })
                .toArray()
        ]);
        return childrenComments.map((_a) => {
            var { _id: id, revisions } = _a, comment = __rest(_a, ["_id", "revisions"]);
            return (Object.assign({ id, text: revisions[revisions.length - 1].text }, comment));
        });
    }
    async takeActionOnComment({ id, state, rejectionReason }) {
        const { value } = await this.comments.findOneAndUpdate({ _id: id }, {
            $set: {
                state,
                rejectionReason,
                modifiedAt: new Date()
            }
        }, {
            returnOriginal: false
        });
        if (!value)
            return null;
        const { _id: outID } = value, comment = __rest(value, ["_id"]);
        return Object.assign(Object.assign({}, comment), { id: outID });
    }
}
exports.MongoDBCommentAdapter = MongoDBCommentAdapter;
//# sourceMappingURL=comment.js.map