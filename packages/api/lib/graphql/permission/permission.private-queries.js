"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissions = void 0;
const permissions_1 = require("../permissions");
const getPermissions = (authenticate) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetPermissions, roles);
    return permissions_1.AllPermissions;
};
exports.getPermissions = getPermissions;
//# sourceMappingURL=permission.private-queries.js.map