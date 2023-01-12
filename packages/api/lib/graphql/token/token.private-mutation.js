"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToken = exports.deleteTokenById = void 0;
const permissions_1 = require("../permissions");
const session_mutation_1 = require("../session/session.mutation");
const deleteTokenById = (id, authenticate, token) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanDeleteToken, roles);
    return token.delete({
        where: {
            id
        }
    });
};
exports.deleteTokenById = deleteTokenById;
const createToken = (input, authenticate, token) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateToken, roles);
    return token.create({
        data: Object.assign(Object.assign({}, input), { token: (0, session_mutation_1.generateToken)() })
    });
};
exports.createToken = createToken;
//# sourceMappingURL=token.private-mutation.js.map