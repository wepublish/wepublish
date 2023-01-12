"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminAuthors = exports.getAuthorByIdOrSlug = void 0;
const error_1 = require("../../error");
const permissions_1 = require("../permissions");
const author_queries_1 = require("./author.queries");
const getAuthorByIdOrSlug = (id, slug, authenticate, authorsByID, authorsBySlug) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetAuthor, roles);
    if ((!id && !slug) || (id && slug)) {
        throw new error_1.UserInputError('You must provide either `id` or `slug`.');
    }
    return id ? authorsByID.load(id) : authorsBySlug.load(slug);
};
exports.getAuthorByIdOrSlug = getAuthorByIdOrSlug;
const getAdminAuthors = async (filter, sortedField, order, cursorId, skip, take, authenticate, author) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetAuthors, roles);
    return (0, author_queries_1.getAuthors)(filter, sortedField, order, cursorId, skip, take, author);
};
exports.getAdminAuthors = getAdminAuthors;
//# sourceMappingURL=author.private-queries.js.map