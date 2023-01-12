"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBPeerAdapter = void 0;
const schema_1 = require("./schema");
class MongoDBPeerAdapter {
    constructor(db) {
        this.peerProfiles = db.collection(schema_1.CollectionName.PeerProfiles);
        this.peers = db.collection(schema_1.CollectionName.Peers);
    }
    async getPeerProfile() {
        const value = await this.peerProfiles.findOne({});
        if (!value) {
            return {
                name: '',
                themeColor: '#000000',
                themeFontColor: '#ffffff',
                callToActionURL: '',
                callToActionText: [],
                callToActionImageID: '',
                callToActionImageURL: ''
            };
        }
        return value;
    }
    async updatePeerProfile(input) {
        const { value } = await this.peerProfiles.findOneAndUpdate({}, {
            $set: {
                name: input.name,
                logoID: input.logoID,
                themeColor: input.themeColor,
                themeFontColor: input.themeFontColor,
                callToActionURL: input.callToActionURL,
                callToActionText: input.callToActionText,
                callToActionImageID: input.callToActionImageID,
                callToActionImageURL: input.callToActionImageURL
            }
        }, {
            upsert: true,
            returnOriginal: false
        });
        return value;
    }
    async createPeer({ name, slug, hostURL, token }) {
        const { ops } = await this.peers.insertOne({
            createdAt: new Date(),
            modifiedAt: new Date(),
            slug,
            name,
            token,
            hostURL,
            isDisabled: false
        });
        const _a = ops[0], { _id: id } = _a, data = __rest(_a, ["_id"]);
        return Object.assign({ id }, data);
    }
    async updatePeer(id, { hostURL, name, slug, token, isDisabled }) {
        const toUpdate = {
            modifiedAt: new Date()
        };
        if (hostURL)
            toUpdate.hostUrl = hostURL;
        if (name)
            toUpdate.name = name;
        if (slug)
            toUpdate.slug = slug;
        token ? (toUpdate.token = token) : (toUpdate.token = '$token');
        if (isDisabled !== undefined)
            toUpdate.isDisabled = isDisabled;
        const { value } = await this.peers.findOneAndUpdate({ _id: id }, [
            {
                $set: toUpdate
            }
        ], { returnOriginal: false });
        if (!value)
            return null;
        const { _id: outID } = value, data = __rest(value, ["_id"]);
        return Object.assign({ id: outID }, data);
    }
    async deletePeer(id) {
        const { deletedCount } = await this.peers.deleteOne({ _id: id });
        return deletedCount !== 0 ? id : null;
    }
    async getPeersByID(ids) {
        const peers = await this.peers.find({ _id: { $in: ids } }).toArray();
        const peerMap = Object.fromEntries(peers.map((_a) => {
            var { _id: id } = _a, peer = __rest(_a, ["_id"]);
            return [id, Object.assign({ id }, peer)];
        }));
        return ids.map(id => { var _a; return (_a = peerMap[id]) !== null && _a !== void 0 ? _a : null; });
    }
    async getPeersBySlug(slugs) {
        const peers = await this.peers.find({ slug: { $in: slugs } }).toArray();
        const peerMap = Object.fromEntries(peers.map((_a) => {
            var { _id: id, slug } = _a, peer = __rest(_a, ["_id", "slug"]);
            return [slug, Object.assign({ id, slug }, peer)];
        }));
        return slugs.map(slug => { var _a; return (_a = peerMap[slug]) !== null && _a !== void 0 ? _a : null; });
    }
    async getPeers() {
        const peers = await this.peers.find().sort({ createdAt: -1 }).toArray();
        return peers.map((_a) => {
            var { _id: id } = _a, data = __rest(_a, ["_id"]);
            return (Object.assign({ id }, data));
        });
    }
}
exports.MongoDBPeerAdapter = MongoDBPeerAdapter;
//# sourceMappingURL=peer.js.map