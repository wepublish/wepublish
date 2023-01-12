"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configuration = void 0;
const oidc_provider_1 = require("oidc-provider");
// copies the default policy, already has login and consent prompt policies
const { Prompt, base: policy } = oidc_provider_1.interactionPolicy;
const interactions = policy();
// create a requestable prompt with no implicit checks
const selectAccount = new Prompt({
    name: 'select_account',
    requestable: true
});
// add to index 0, order goes select_account > login > consent
interactions.add(selectAccount, 0);
exports.configuration = {
    interactions: {
        policy: interactions,
        url(ctx, interaction) {
            return `/interaction/${ctx.oidc.uid}`;
        }
    },
    claims: {
        address: ['address'],
        email: ['email', 'email_verified'],
        phone: ['phone_number', 'phone_number_verified'],
        profile: [
            'birthdate',
            'family_name',
            'gender',
            'given_name',
            'locale',
            'middle_name',
            'name',
            'nickname',
            'picture',
            'preferred_username',
            'profile',
            'updated_at',
            'website',
            'zoneinfo'
        ]
    },
    features: {
        devInteractions: { enabled: false },
        deviceFlow: { enabled: true },
        introspection: { enabled: true },
        revocation: { enabled: true } // defaults to false
    },
    ttl: {
        AccessToken: 1 * 60 * 60,
        AuthorizationCode: 10 * 60,
        IdToken: 1 * 60 * 60,
        DeviceCode: 10 * 60,
        RefreshToken: 1 * 24 * 60 * 60 // 1 day in seconds
    }
};
//# sourceMappingURL=configuration.js.map