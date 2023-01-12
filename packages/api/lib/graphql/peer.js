"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLPeer = exports.GraphQLUpdatePeerInput = exports.GraphQLCreatePeerInput = exports.GraphQLPeerProfile = exports.GraphQLPeerProfileInput = void 0;
const graphql_1 = require("graphql");
const image_1 = require("./image");
const color_1 = require("./color");
const graphql_iso_date_1 = require("graphql-iso-date");
const utility_1 = require("../utility");
const richText_1 = require("./richText");
exports.GraphQLPeerProfileInput = new graphql_1.GraphQLInputObjectType({
    name: 'PeerProfileInput',
    fields: {
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        logoID: { type: graphql_1.GraphQLID },
        themeColor: { type: (0, graphql_1.GraphQLNonNull)(color_1.GraphQLColor) },
        themeFontColor: { type: (0, graphql_1.GraphQLNonNull)(color_1.GraphQLColor) },
        callToActionText: { type: (0, graphql_1.GraphQLNonNull)(richText_1.GraphQLRichText) },
        callToActionURL: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        callToActionImageURL: { type: graphql_1.GraphQLString },
        callToActionImageID: { type: graphql_1.GraphQLID }
    }
});
exports.GraphQLPeerProfile = new graphql_1.GraphQLObjectType({
    name: 'PeerProfile',
    fields: {
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        logo: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)((profile, args, { loaders }, info) => {
                return profile.logoID ? loaders.images.load(profile.logoID) : null;
            })
        },
        themeColor: { type: (0, graphql_1.GraphQLNonNull)(color_1.GraphQLColor) },
        themeFontColor: {
            type: (0, graphql_1.GraphQLNonNull)(color_1.GraphQLColor),
            resolve(profile, args, { loaders }, info) {
                return profile.themeFontColor ? profile.themeFontColor : '#fff';
            }
        },
        hostURL: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        websiteURL: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        callToActionText: { type: (0, graphql_1.GraphQLNonNull)(richText_1.GraphQLRichText) },
        callToActionURL: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        callToActionImageURL: { type: graphql_1.GraphQLString },
        callToActionImage: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)((profile, args, { loaders }, info) => {
                return profile.callToActionImageID ? loaders.images.load(profile.callToActionImageID) : null;
            })
        }
    }
});
exports.GraphQLCreatePeerInput = new graphql_1.GraphQLInputObjectType({
    name: 'CreatePeerInput',
    fields: {
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        slug: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        hostURL: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        token: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLUpdatePeerInput = new graphql_1.GraphQLInputObjectType({
    name: 'UpdatePeerInput',
    fields: {
        name: { type: graphql_1.GraphQLString },
        slug: { type: graphql_1.GraphQLString },
        hostURL: { type: graphql_1.GraphQLString },
        isDisabled: { type: graphql_1.GraphQLBoolean },
        token: { type: graphql_1.GraphQLString }
    }
});
exports.GraphQLPeer = new graphql_1.GraphQLObjectType({
    name: 'Peer',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        slug: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        isDisabled: { type: graphql_1.GraphQLBoolean },
        hostURL: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        profile: {
            type: exports.GraphQLPeerProfile,
            resolve: (0, utility_1.createProxyingResolver)(async (source, args, context, info) => {
                var _a;
                const peerProfile = await (0, utility_1.delegateToPeerSchema)(source.id, true, context, {
                    fieldName: 'peerProfile',
                    info
                });
                // TODO: Improve error handling for invalid tokens WPC-298
                return ((_a = peerProfile === null || peerProfile === void 0 ? void 0 : peerProfile.extensions) === null || _a === void 0 ? void 0 : _a.code) === 'UNAUTHENTICATED' ? null : peerProfile;
            })
        }
    }
});
//# sourceMappingURL=peer.js.map