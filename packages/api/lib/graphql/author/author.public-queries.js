"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicAuthors = void 0;
const author_queries_1 = require("./author.queries");
const getPublicAuthors = async (filter, sortedField, order, cursorId, skip, take, author) => (0, author_queries_1.getAuthors)(filter, sortedField, order, cursorId, skip, take, author);
exports.getPublicAuthors = getPublicAuthors;
//# sourceMappingURL=author.public-queries.js.map