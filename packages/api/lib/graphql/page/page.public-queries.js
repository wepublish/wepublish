"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublishedPages = void 0;
const page_queries_1 = require("./page.queries");
const getPublishedPages = async (filter, sortedField, order, cursorId, skip, take, page) => {
    const data = await (0, page_queries_1.getPages)(Object.assign(Object.assign({}, filter), { published: true }), sortedField, order, cursorId, skip, take, page);
    return Object.assign(Object.assign({}, data), { nodes: data.nodes.map(({ id, published }) => (Object.assign(Object.assign({}, published), { id }))) });
};
exports.getPublishedPages = getPublishedPages;
//# sourceMappingURL=page.public-queries.js.map