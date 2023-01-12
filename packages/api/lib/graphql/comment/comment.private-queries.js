"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminComments = exports.getComment = void 0;
const permissions_1 = require("../permissions");
const comment_queries_1 = require("./comment.queries");
const getComment = (commentId, authenticate, comment) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetComments, roles);
    return comment.findUnique({
        where: {
            id: commentId
        },
        include: {
            overriddenRatings: true,
            revisions: { orderBy: { createdAt: 'asc' } }
        }
    });
};
exports.getComment = getComment;
const getAdminComments = async (filter, sortedField, order, cursorId, skip, take, authenticate, comment) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetComments, roles);
    return (0, comment_queries_1.getComments)(filter, sortedField, order, cursorId, skip, take, comment);
};
exports.getAdminComments = getAdminComments;
//# sourceMappingURL=comment.private-queries.js.map