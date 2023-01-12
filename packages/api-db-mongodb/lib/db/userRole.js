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
exports.MongoDBUserRoleAdapter = void 0;
const api_1 = require("@wepublish/api");
const schema_1 = require("./schema");
const defaults_1 = require("./defaults");
const cursor_1 = require("./cursor");
const utility_1 = require("../utility");
class MongoDBUserRoleAdapter {
    constructor(db, locale) {
        this.userRoles = db.collection(schema_1.CollectionName.UserRoles);
        this.locale = locale;
    }
    async createUserRole({ input }) {
        const { insertedId: id } = await this.userRoles.insertOne({
            createdAt: new Date(),
            modifiedAt: new Date(),
            name: input.name,
            description: input.description || '',
            systemRole: false,
            permissionIDs: input.permissionIDs // Test if they exist
        });
        const userRole = await this.userRoles.findOne({ _id: id });
        if (!userRole) {
            throw new Error('Could not create UserRole');
        }
        return {
            id: userRole._id,
            name: userRole.name,
            description: userRole.description,
            systemRole: userRole.systemRole,
            permissionIDs: userRole.permissionIDs
        };
    }
    async updateUserRole({ id, input }) {
        const userRole = await this.getUserRoleByID(id);
        if (userRole === null || userRole === void 0 ? void 0 : userRole.systemRole) {
            throw new Error('Can not change SystemRoles');
        }
        const { value } = await this.userRoles.findOneAndUpdate({ _id: id }, {
            $set: {
                modifiedAt: new Date(),
                name: input.name,
                description: input.description,
                permissionIDs: input.permissionIDs
            }
        }, { returnOriginal: false });
        if (!value)
            return null;
        const { _id: outID } = value;
        return this.getUserRoleByID(outID);
    }
    async deleteUserRole({ id }) {
        const userRole = await this.getUserRoleByID(id);
        if (userRole === null || userRole === void 0 ? void 0 : userRole.systemRole) {
            throw new Error('Can not delete SystemRoles');
        }
        const { deletedCount } = await this.userRoles.deleteOne({ _id: id });
        return deletedCount !== 0 ? id : null;
    }
    async getUserRole(name) {
        const userRole = await this.userRoles.findOne({ name });
        if (userRole) {
            return {
                id: userRole._id,
                name: userRole.name,
                description: userRole.description,
                systemRole: userRole.systemRole,
                permissionIDs: userRole.permissionIDs
            };
        }
        else {
            return null;
        }
    }
    async getUserRoleByID(id) {
        const userRole = await this.userRoles.findOne({ _id: id });
        if (userRole) {
            return {
                id: userRole._id,
                name: userRole.name,
                description: userRole.description,
                systemRole: userRole.systemRole,
                permissionIDs: userRole.permissionIDs
            };
        }
        else {
            return null;
        }
    }
    async getUserRolesByID(ids) {
        const userRoles = await this.userRoles.find({ _id: { $in: ids } }).toArray();
        return userRoles.map(userRole => ({
            id: userRole._id,
            name: userRole.name,
            description: userRole.description,
            systemRole: userRole.systemRole,
            permissionIDs: userRole.permissionIDs
        }));
    }
    async getNonOptionalUserRolesByID(ids) {
        const roles = await this.getUserRolesByID(ids);
        return roles ? roles.filter(utility_1.isNonNull) : [];
    }
    async getUserRoles({ filter, sort, order, cursor, limit }) {
        const limitCount = Math.min(limit.count, defaults_1.MaxResultsPerPage);
        const sortDirection = limit.type === api_1.LimitType.First ? order : -order;
        const cursorData = cursor.type !== api_1.InputCursorType.None ? cursor_1.Cursor.from(cursor.data) : undefined;
        const expr = order === api_1.SortOrder.Ascending
            ? cursor.type === api_1.InputCursorType.After
                ? '$gt'
                : '$lt'
            : cursor.type === api_1.InputCursorType.After
                ? '$lt'
                : '$gt';
        const sortField = userRoleSortFieldForSort(sort);
        const cursorFilter = cursorData
            ? {
                $or: [
                    { [sortField]: { [expr]: cursorData.date } },
                    { _id: { [expr]: cursorData.id }, [sortField]: cursorData.date }
                ]
            }
            : {};
        let textFilter = {};
        // TODO: Rename to search
        if ((filter === null || filter === void 0 ? void 0 : filter.name) != undefined) {
            textFilter['$or'] = [{ name: { $regex: (0, utility_1.escapeRegExp)(filter.name), $options: 'i' } }];
        }
        const [totalCount, userRoles] = await Promise.all([
            this.userRoles.countDocuments(textFilter, {
                collation: { locale: this.locale, strength: 2 }
            }),
            this.userRoles
                .aggregate([], { collation: { locale: this.locale, strength: 2 } })
                .match(textFilter)
                .match(cursorFilter)
                .sort({ [sortField]: sortDirection, _id: sortDirection })
                .limit(limitCount + 1)
                .toArray()
        ]);
        const nodes = userRoles.slice(0, limitCount);
        if (limit.type === api_1.LimitType.Last) {
            nodes.reverse();
        }
        const hasNextPage = limit.type === api_1.LimitType.First
            ? userRoles.length > limitCount
            : cursor.type === api_1.InputCursorType.Before
                ? true
                : false;
        const hasPreviousPage = limit.type === api_1.LimitType.Last
            ? userRoles.length > limitCount
            : cursor.type === api_1.InputCursorType.After
                ? true
                : false;
        const firstUserRole = nodes[0];
        const lastUserRole = nodes[nodes.length - 1];
        const startCursor = firstUserRole
            ? new cursor_1.Cursor(firstUserRole._id, userRoleDateForSort(firstUserRole, sort)).toString()
            : null;
        const endCursor = lastUserRole
            ? new cursor_1.Cursor(lastUserRole._id, userRoleDateForSort(lastUserRole, sort)).toString()
            : null;
        return {
            nodes: nodes.map((_a) => {
                var { _id: id } = _a, userRole = __rest(_a, ["_id"]);
                return (Object.assign({ id }, userRole));
            }),
            pageInfo: {
                startCursor,
                endCursor,
                hasNextPage,
                hasPreviousPage
            },
            totalCount
        };
    }
}
exports.MongoDBUserRoleAdapter = MongoDBUserRoleAdapter;
function userRoleSortFieldForSort(sort) {
    switch (sort) {
        case api_1.UserRoleSort.CreatedAt:
            return 'createdAt';
        case api_1.UserRoleSort.ModifiedAt:
            return 'modifiedAt';
    }
}
function userRoleDateForSort(userRole, sort) {
    switch (sort) {
        case api_1.UserRoleSort.CreatedAt:
            return userRole.createdAt;
        case api_1.UserRoleSort.ModifiedAt:
            return userRole.modifiedAt;
    }
}
//# sourceMappingURL=userRole.js.map