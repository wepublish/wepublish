"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertPeerProfile = void 0;
const permissions_1 = require("../permissions");
const upsertPeerProfile = async (input, hostURL, authenticate, peerProfile) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanUpdatePeerProfile, roles);
    const oldProfile = await peerProfile.findFirst({});
    const data = oldProfile
        ? await peerProfile.update({
            where: {
                id: oldProfile.id
            },
            data: input
        })
        : await peerProfile.create({
            data: input
        });
    return Object.assign(Object.assign({}, data), { hostURL });
};
exports.upsertPeerProfile = upsertPeerProfile;
//# sourceMappingURL=peer-profile.private-mutation.js.map