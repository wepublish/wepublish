"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminUserRoles = exports.getUserRoleById = void 0;
const error_1 = require("../../error");
const permissions_1 = require("../permissions");
const user_role_queries_1 = require("./user-role.queries");
const getUserRoleById = (id, authenticate, userRoleLoader) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetUserRole, roles);
    if (id == null) {
        throw new error_1.UserInputError('You must provide `id`');
    }
    return userRoleLoader.load(id);
};
exports.getUserRoleById = getUserRoleById;
const getAdminUserRoles = async (filter, sortedField, order, cursorId, skip, take, authenticate, userRole) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetUserRoles, roles);
    return (0, user_role_queries_1.getUserRoles)(filter, sortedField, order, cursorId, skip, take, userRole);
};
exports.getAdminUserRoles = getAdminUserRoles;
//# sourceMappingURL=user-role.private-queries.js.map