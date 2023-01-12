"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNavigations = exports.getNavigationByIdOrKey = void 0;
const error_1 = require("../../error");
const permissions_1 = require("../permissions");
const getNavigationByIdOrKey = (id, key, authenticate, navigationByID, navigationByKey) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetNavigation, roles);
    if ((!id && !key) || (id && key)) {
        throw new error_1.UserInputError('You must provide either `id` or `key`.');
    }
    return id ? navigationByID.load(id) : navigationByKey.load(key);
};
exports.getNavigationByIdOrKey = getNavigationByIdOrKey;
const getNavigations = (authenticate, navigation) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetNavigations, roles);
    return navigation.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            links: true
        }
    });
};
exports.getNavigations = getNavigations;
//# sourceMappingURL=navigation.private-queries.js.map