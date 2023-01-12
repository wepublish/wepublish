"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPeers = exports.getPeerById = void 0;
const permissions_1 = require("../permissions");
const error_1 = require("../../error");
const getPeerById = async (id, authenticate, peerClient) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetPeer, roles);
    const peer = await peerClient.load(id);
    if (peer === null || peer === void 0 ? void 0 : peer.isDisabled) {
        throw new error_1.DisabledPeerError();
    }
    return peer;
};
exports.getPeerById = getPeerById;
const getPeers = async (authenticate, peer) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetPeers, roles);
    return peer.findMany({
        orderBy: {
            createdAt: 'desc'
        }
    });
};
exports.getPeers = getPeers;
//# sourceMappingURL=peer.private-queries.js.map