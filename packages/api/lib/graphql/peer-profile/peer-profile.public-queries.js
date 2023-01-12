"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicPeerProfile = void 0;
const peer_profile_queries_1 = require("./peer-profile.queries");
const getPublicPeerProfile = async (hostURL, websiteURL, peerProfile) => (0, peer_profile_queries_1.getPeerProfile)(hostURL, websiteURL, peerProfile);
exports.getPublicPeerProfile = getPublicPeerProfile;
//# sourceMappingURL=peer-profile.public-queries.js.map