"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOutgoingPeerRequestToken = void 0;
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const graphql_1 = require("graphql");
const CreateIncomingPeerRequestMutation = (0, graphql_tag_1.default) `
  mutation CreateIncomingPeerRequest($input: PeerRequestInput!) {
    createIncomingPeerRequest(input: $input) {
      token
    }
  }
`;
async function createOutgoingPeerRequestToken(url, hostURL) {
    var _a, _b;
    const response = await (0, cross_fetch_1.default)(`${url}/admin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify({
            query: (0, graphql_1.print)(CreateIncomingPeerRequestMutation),
            variables: {
                input: {
                    hostURL: hostURL
                }
            }
        })
    }).then(r => r.json());
    return (_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.createIncomingPeerRequest) === null || _b === void 0 ? void 0 : _b.token;
}
exports.createOutgoingPeerRequestToken = createOutgoingPeerRequestToken;
//# sourceMappingURL=peering.js.map