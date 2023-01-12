"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminPages = exports.getPagePreviewLink = exports.getPageById = void 0;
const apollo_server_express_1 = require("apollo-server-express");
const error_1 = require("../../error");
const permissions_1 = require("../permissions");
const page_queries_1 = require("./page.queries");
const getPageById = (id, authenticate, pages) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetPage, roles);
    return pages.load(id);
};
exports.getPageById = getPageById;
const getPagePreviewLink = async (id, hours, authenticate, generateJWT, urlAdapter, pagesLoader) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetPagePreviewLink, roles);
    const page = await pagesLoader.load(id);
    if (!page)
        throw new error_1.NotFound('page', id);
    if (!page.draft)
        throw new apollo_server_express_1.UserInputError('Page needs to have a draft');
    const token = generateJWT({
        id: page.id,
        expiresInMinutes: hours * 60
    });
    return urlAdapter.getPagePreviewURL(token);
};
exports.getPagePreviewLink = getPagePreviewLink;
const getAdminPages = (filter, sortedField, order, cursorId, skip, take, authenticate, page) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetPages, roles);
    return (0, page_queries_1.getPages)(filter, sortedField, order, cursorId, skip, take, page);
};
exports.getAdminPages = getAdminPages;
//# sourceMappingURL=page.private-queries.js.map