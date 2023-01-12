"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionsForUser = void 0;
const session_1 = require("../../db/session");
const getSessionsForUser = async (authenticateUser, session, userRole) => {
    const { user } = authenticateUser();
    const [sessions, roles] = await Promise.all([
        session.findMany({
            where: {
                userID: user.id
            }
        }),
        userRole.findMany({
            where: {
                id: {
                    in: user.roleIDs
                }
            }
        })
    ]);
    return sessions.map(session => (Object.assign(Object.assign({}, session), { type: session_1.SessionType.User, user,
        roles })));
};
exports.getSessionsForUser = getSessionsForUser;
//# sourceMappingURL=session.private-queries.js.map