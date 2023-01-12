"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserRoles = exports.createUserRoleFilter = exports.createUserRoleOrder = void 0;
const common_1 = require("../../db/common");
const userRole_1 = require("../../db/userRole");
const sort_1 = require("../queries/sort");
const createUserRoleOrder = (field, sortOrder) => {
    switch (field) {
        case userRole_1.UserRoleSort.CreatedAt:
            return {
                createdAt: sortOrder
            };
        case userRole_1.UserRoleSort.ModifiedAt:
            return {
                modifiedAt: sortOrder
            };
    }
};
exports.createUserRoleOrder = createUserRoleOrder;
const createNameFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.name) {
        return {
            name: filter.name
        };
    }
    return {};
};
const createUserRoleFilter = (filter) => ({
    AND: [createNameFilter(filter)]
});
exports.createUserRoleFilter = createUserRoleFilter;
const getUserRoles = async (filter, sortedField, order, cursorId, skip, take, userRole) => {
    const orderBy = (0, exports.createUserRoleOrder)(sortedField, (0, sort_1.getSortOrder)(order));
    const where = (0, exports.createUserRoleFilter)(filter);
    const [totalCount, userroles] = await Promise.all([
        userRole.count({
            where,
            orderBy
        }),
        userRole.findMany({
            where,
            skip,
            take: Math.min(take, common_1.MaxResultsPerPage) + 1,
            orderBy,
            cursor: cursorId ? { id: cursorId } : undefined
        })
    ]);
    const nodes = userroles.slice(0, take);
    const firstUserRole = nodes[0];
    const lastUserRole = nodes[nodes.length - 1];
    const hasPreviousPage = Boolean(skip);
    const hasNextPage = userroles.length > nodes.length;
    return {
        nodes,
        totalCount,
        pageInfo: {
            hasPreviousPage,
            hasNextPage,
            startCursor: firstUserRole === null || firstUserRole === void 0 ? void 0 : firstUserRole.id,
            endCursor: lastUserRole === null || lastUserRole === void 0 ? void 0 : lastUserRole.id
        }
    };
};
exports.getUserRoles = getUserRoles;
//# sourceMappingURL=user-role.queries.js.map