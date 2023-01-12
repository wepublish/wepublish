"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminUsers = exports.getUserById = exports.getMe = void 0;
const session_1 = require("../../db/session");
const permissions_1 = require("../permissions");
const error_1 = require("../../error");
const user_1 = require("../../db/user");
const user_queries_1 = require("./user.queries");
const getMe = (authenticate) => {
    const session = authenticate();
    return (session === null || session === void 0 ? void 0 : session.type) === session_1.SessionType.User ? session.user : null;
};
exports.getMe = getMe;
const getUserById = (id, authenticate, user) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetUser, roles);
    if (!id) {
        throw new error_1.UserInputError('You must provide `id`');
    }
    return user.findUnique({
        where: {
            id
        },
        select: user_1.unselectPassword
    });
};
exports.getUserById = getUserById;
const getAdminUsers = async (filter, sortedField, order, cursorId, skip, take, authenticate, user) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetUsers, roles);
    return (0, user_queries_1.getUsers)(filter, sortedField, order, cursorId, skip, take, user);
};
exports.getAdminUsers = getAdminUsers;
//# sourceMappingURL=user.private-queries.js.map