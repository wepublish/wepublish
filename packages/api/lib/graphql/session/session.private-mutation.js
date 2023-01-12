"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeSessionById = void 0;
const revokeSessionById = (id, authenticateUser, session) => {
    const { user } = authenticateUser();
    return session.deleteMany({
        where: {
            id,
            userID: user.id
        }
    });
};
exports.revokeSessionById = revokeSessionById;
//# sourceMappingURL=session.private-mutation.js.map