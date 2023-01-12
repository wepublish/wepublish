"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRole = exports.createUserRole = exports.deleteUserRoleById = void 0;
const permissions_1 = require("../permissions");
const deleteUserRoleById = async (id, authenticate, userRole) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanDeleteUserRole, roles);
    const role = await userRole.findUnique({
        where: { id }
    });
    if (role === null || role === void 0 ? void 0 : role.systemRole) {
        throw new Error('Can not delete SystemRoles');
    }
    return userRole.delete({
        where: {
            id
        }
    });
};
exports.deleteUserRoleById = deleteUserRoleById;
const createUserRole = (input, authenticate, userRole) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateUserRole, roles);
    return userRole.create({
        data: Object.assign(Object.assign({}, input), { systemRole: false })
    });
};
exports.createUserRole = createUserRole;
const updateUserRole = async (id, input, authenticate, userRole) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateUserRole, roles);
    const role = await userRole.findUnique({
        where: { id }
    });
    if (role === null || role === void 0 ? void 0 : role.systemRole) {
        throw new Error('Can not change SystemRoles');
    }
    return userRole.update({
        where: {
            id
        },
        data: input
    });
};
exports.updateUserRole = updateUserRole;
//# sourceMappingURL=user-role.private-mutation.js.map