"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokens = void 0;
const getTokens = (authenticateUser, token) => {
    authenticateUser();
    return token.findMany({
        orderBy: {
            createdAt: 'desc'
        }
    });
};
exports.getTokens = getTokens;
//# sourceMappingURL=token.private-queries.js.map