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
exports.updateAuthor = exports.createAuthor = exports.deleteAuthorById = void 0;
const permissions_1 = require("../permissions");
const deleteAuthorById = (id, authenticate, author) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanDeleteAuthor, roles);
    return author.delete({
        where: {
            id
        }
    });
};
exports.deleteAuthorById = deleteAuthorById;
const createAuthor = (_a, authenticate, author) => {
    var { links } = _a, input = __rest(_a, ["links"]);
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateAuthor, roles);
    return author.create({
        data: Object.assign(Object.assign({}, input), { links: {
                create: links
            } }),
        include: {
            links: true
        }
    });
};
exports.createAuthor = createAuthor;
const updateAuthor = (id, _a, authenticate, author) => {
    var { links } = _a, input = __rest(_a, ["links"]);
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateAuthor, roles);
    return author.update({
        where: { id },
        data: Object.assign(Object.assign({}, input), { links: {
                deleteMany: {
                    authorId: {
                        equals: id
                    }
                },
                create: links
            } }),
        include: {
            links: true
        }
    });
};
exports.updateAuthor = updateAuthor;
//# sourceMappingURL=author.private-mutation.js.map