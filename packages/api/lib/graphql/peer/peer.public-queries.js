"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPeerByIdOrSlug = void 0;
const error_1 = require("../../error");
const getPeerByIdOrSlug = async (id, slug, peerClient, peerBySlug) => {
    if ((!id && !slug) || (id && slug)) {
        throw new error_1.UserInputError('You must provide either `id` or `slug`.');
    }
    const peer = id ? await peerClient.load(id) : await peerBySlug.load(slug);
    if (peer === null || peer === void 0 ? void 0 : peer.isDisabled) {
        throw new error_1.DisabledPeerError();
    }
    return peer;
};
exports.getPeerByIdOrSlug = getPeerByIdOrSlug;
//# sourceMappingURL=peer.public-queries.js.map