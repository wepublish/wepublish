"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLUserRoleSort = exports.GraphQLUserRoleFilter = exports.GraphQLUserRoleInput = exports.GraphQLUserRoleConnection = exports.GraphQLUserRole = exports.GraphQLPermission = void 0;
const graphql_1 = require("graphql");
const permissions_1 = require("./permissions");
const common_1 = require("./common");
const userRole_1 = require("../db/userRole");
exports.GraphQLPermission = new graphql_1.GraphQLObjectType({
    name: 'Permission',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        description: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        deprecated: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) }
    }
});
exports.GraphQLUserRole = new graphql_1.GraphQLObjectType({
    name: 'UserRole',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        description: { type: graphql_1.GraphQLString },
        systemRole: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        permissions: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPermission))),
            resolve({ id, permissionIDs }) {
                switch (id) {
                    case 'admin':
                        return permissions_1.AllPermissions;
                    case 'editor':
                        return permissions_1.EditorPermissions;
                    case 'peer':
                        return permissions_1.PeerPermissions;
                    default:
                        return permissions_1.AllPermissions.filter(permission => permissionIDs.includes(permission.id));
                }
            }
        }
    }
});
exports.GraphQLUserRoleConnection = new graphql_1.GraphQLObjectType({
    name: 'UserRoleConnection',
    fields: {
        nodes: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLUserRole))) },
        pageInfo: { type: (0, graphql_1.GraphQLNonNull)(common_1.GraphQLPageInfo) },
        totalCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
exports.GraphQLUserRoleInput = new graphql_1.GraphQLInputObjectType({
    name: 'UserRoleInput',
    fields: {
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        description: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        permissionIDs: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString)) }
    }
});
exports.GraphQLUserRoleFilter = new graphql_1.GraphQLInputObjectType({
    name: 'UserRoleFilter',
    fields: {
        name: { type: graphql_1.GraphQLString }
    }
});
exports.GraphQLUserRoleSort = new graphql_1.GraphQLEnumType({
    name: 'UserRoleSort',
    values: {
        CREATED_AT: { value: userRole_1.UserRoleSort.CreatedAt },
        MODIFIED_AT: { value: userRole_1.UserRoleSort.ModifiedAt }
    }
});
//# sourceMappingURL=userRole.js.map