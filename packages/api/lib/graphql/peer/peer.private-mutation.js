"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePeer = exports.createPeer = exports.deletePeerById = void 0;
const permissions_1 = require("../permissions");
const deletePeerById = (id, authenticate, peer) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanDeletePeer, roles);
    return peer.delete({
        where: {
            id
        }
    });
};
exports.deletePeerById = deletePeerById;
const createPeer = (input, authenticate, peer) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreatePeer, roles);
    return peer.create({
        data: input
    });
};
exports.createPeer = createPeer;
const updatePeer = (id, input, authenticate, peer) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreatePeer, roles);
    const nonEmptyInputs = Object.fromEntries(Object.entries(input).filter(([, value]) => value || value === false));
    return peer.update({
        where: { id },
        data: nonEmptyInputs
    });
};
exports.updatePeer = updatePeer;
//# sourceMappingURL=peer.private-mutation.js.map