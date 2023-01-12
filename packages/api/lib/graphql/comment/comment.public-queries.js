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
exports.getPublicCommentsForItemById = exports.getPublicChildrenCommentsByParentId = void 0;
const client_1 = require("@prisma/client");
const comment_1 = require("../../db/comment");
const ramda_1 = require("ramda");
const getPublicChildrenCommentsByParentId = async (parentId, userId, comment) => {
    const comments = await comment.findMany({
        where: {
            AND: [
                { parentID: parentId },
                { OR: [userId ? { userID: userId } : {}, { state: client_1.CommentState.approved }] }
            ]
        },
        orderBy: {
            modifiedAt: 'desc'
        },
        include: {
            revisions: { orderBy: { createdAt: 'asc' } },
            tags: true
        }
    });
    return comments.map(comment => {
        const revisions = comment.revisions;
        return Object.assign(Object.assign({}, comment), { title: revisions.length ? revisions[revisions.length - 1].title : null, lead: revisions.length ? revisions[revisions.length - 1].lead : null, text: revisions.length ? revisions[revisions.length - 1].text : null });
    });
};
exports.getPublicChildrenCommentsByParentId = getPublicChildrenCommentsByParentId;
const sortCommentsByRating = (orderFn) => (0, ramda_1.sortWith)([
    orderFn(({ calculatedRatings }) => calculatedRatings.reduce((ratingsTotal, calculatedRating) => ratingsTotal + calculatedRating.mean, 0)),
    (0, ramda_1.ascend)(({ createdAt }) => createdAt)
]);
const getPublicCommentsForItemById = async (itemId, userId, sort, order, commentRatingSystemAnswer, comment) => {
    const [answers, comments] = await Promise.all([
        commentRatingSystemAnswer.findMany(),
        comment.findMany({
            where: {
                OR: [
                    { itemID: itemId, state: client_1.CommentState.approved, parentID: null },
                    userId ? { itemID: itemId, userID: userId, parentID: null } : {}
                ]
            },
            include: {
                revisions: { orderBy: { createdAt: 'asc' } },
                ratings: true,
                overriddenRatings: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        })
    ]);
    const commentsWithRating = comments.map((_a) => {
        var { revisions, ratings } = _a, comment = __rest(_a, ["revisions", "ratings"]);
        return (Object.assign(Object.assign({ title: revisions.length ? revisions[revisions.length - 1].title : null, lead: revisions.length ? revisions[revisions.length - 1].lead : null, text: revisions.length ? revisions[revisions.length - 1].text : null }, comment), { calculatedRatings: answers.map(answer => {
                const sortedRatings = ratings
                    .filter(rating => rating.answerId === answer.id)
                    .map(rating => rating.value)
                    .sort((a, b) => a - b);
                const total = sortedRatings.reduce((value, rating) => value + rating, 0);
                const mean = total / Math.max(sortedRatings.length, 1);
                return {
                    answer,
                    count: sortedRatings.length,
                    mean,
                    total
                };
            }) }));
    });
    if (sort === comment_1.PublicCommentSort.Rating) {
        if (order === 1) {
            return sortCommentsByRating(ramda_1.ascend)(commentsWithRating);
        }
        return sortCommentsByRating(ramda_1.descend)(commentsWithRating);
    }
    // no sorting needed as comments already come sorted by creation
    return commentsWithRating;
};
exports.getPublicCommentsForItemById = getPublicCommentsForItemById;
//# sourceMappingURL=comment.public-queries.js.map