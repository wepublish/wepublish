"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPeerProfile = void 0;
const getPeerProfile = async (hostURL, websiteURL, peerProfile) => {
    var _a;
    // @TODO: move fallback to seed
    const profile = (_a = (await peerProfile.findFirst({}))) !== null && _a !== void 0 ? _a : {
        name: '',
        themeColor: '#000000',
        themeFontColor: '#ffffff',
        callToActionURL: '',
        callToActionText: [],
        callToActionImageID: '',
        callToActionImageURL: ''
    };
    return Object.assign(Object.assign({}, profile), { hostURL, websiteURL });
};
exports.getPeerProfile = getPeerProfile;
//# sourceMappingURL=peer-profile.queries.js.map