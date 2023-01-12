"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRemotePeerProfile = exports.getAdminPeerProfile = void 0;
const graphql_tools_1 = require("graphql-tools");
const context_1 = require("../../context");
const setting_1 = require("../../db/setting");
const error_1 = require("../../error");
const utility_1 = require("../../utility");
const permissions_1 = require("../permissions");
const peer_profile_queries_1 = require("./peer-profile.queries");
const getAdminPeerProfile = async (hostURL, websiteURL, authenticate, peerProfile) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetPeerProfile, roles);
    return (0, peer_profile_queries_1.getPeerProfile)(hostURL, websiteURL, peerProfile);
};
exports.getAdminPeerProfile = getAdminPeerProfile;
const getRemotePeerProfile = async (hostURL, token, authenticate, info, setting) => {
    var _a, _b, _c;
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreatePeer, roles);
    const link = new URL('/admin', hostURL);
    const peerTimeoutSetting = await setting.findUnique({
        where: {
            name: setting_1.SettingName.PEERING_TIMEOUT_MS
        }
    });
    const peerTimeout = (_a = peerTimeoutSetting === null || peerTimeoutSetting === void 0 ? void 0 : peerTimeoutSetting.value) !== null && _a !== void 0 ? _a : parseInt((_b = process.env.PEERING_TIMEOUT_IN_MS) !== null && _b !== void 0 ? _b : '');
    if (!peerTimeout) {
        throw new Error('No value set for PEERING_TIMEOUT_IN_MS');
    }
    const fetcher = await (0, context_1.createFetcher)(link.toString(), token, peerTimeout);
    const schema = await (0, graphql_tools_1.introspectSchema)(fetcher);
    const remoteExecutableSchema = await (0, graphql_tools_1.makeRemoteExecutableSchema)({
        schema,
        fetcher
    });
    const remoteAnswer = await (0, graphql_tools_1.delegateToSchema)({
        info,
        fieldName: 'peerProfile',
        args: {},
        schema: remoteExecutableSchema,
        transforms: []
    });
    if (((_c = remoteAnswer === null || remoteAnswer === void 0 ? void 0 : remoteAnswer.extensions) === null || _c === void 0 ? void 0 : _c.code) === 'UNAUTHENTICATED') {
        // check for unauthenticated error and throw more specific error.
        // otherwise client doesn't know who (own or remote api) threw the error
        throw new error_1.PeerTokenInvalidError(link.toString());
    }
    else {
        return await (0, utility_1.markResultAsProxied)(remoteAnswer);
    }
};
exports.getRemotePeerProfile = getRemotePeerProfile;
//# sourceMappingURL=peer-profile.private-queries.js.map