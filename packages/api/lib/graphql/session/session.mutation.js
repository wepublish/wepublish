"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOAuth2Session = exports.createJWTSession = exports.createSession = exports.createUserSession = exports.revokeSessionByToken = exports.generateToken = void 0;
const generate_1 = __importDefault(require("nanoid/generate"));
const openid_client_1 = require("openid-client");
const session_1 = require("../../db/session");
const user_1 = require("../../db/user");
const error_1 = require("../../error");
const user_queries_1 = require("../user/user.queries");
const IDAlphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function generateToken() {
    return (0, generate_1.default)(IDAlphabet, 32);
}
exports.generateToken = generateToken;
const revokeSessionByToken = (authenticateUser, sessionClient) => {
    const session = authenticateUser();
    return session
        ? sessionClient.delete({
            where: {
                token: session.token
            }
        })
        : Promise.resolve();
};
exports.revokeSessionByToken = revokeSessionByToken;
const createUserSession = async (user, sessionTTL, sessionClient, userRoleClient) => {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + sessionTTL);
    const { id, createdAt } = await sessionClient.create({
        data: {
            token: token,
            userID: user.id,
            expiresAt
        }
    });
    return {
        type: session_1.SessionType.User,
        id,
        user,
        token,
        createdAt,
        expiresAt,
        roles: await userRoleClient.findMany({
            where: {
                id: {
                    in: user.roleIDs
                }
            }
        })
    };
};
exports.createUserSession = createUserSession;
const createSession = async (email, password, sessionTTL, sessionClient, userClient, userRoleClient) => {
    const user = await (0, user_queries_1.getUserForCredentials)(email, password, userClient);
    if (!user)
        throw new error_1.InvalidCredentialsError();
    if (!user.active)
        throw new error_1.NotActiveError();
    return await (0, exports.createUserSession)(user, sessionTTL, sessionClient, userRoleClient);
};
exports.createSession = createSession;
const createJWTSession = async (jwt, sessionTTL, verifyJWT, sessionClient, userClient, userRoleClient) => {
    const userID = verifyJWT(jwt);
    const user = await userClient.findUnique({
        where: { id: userID },
        select: user_1.unselectPassword
    });
    if (!user)
        throw new error_1.InvalidCredentialsError();
    if (!user.active)
        throw new error_1.NotActiveError();
    return await (0, exports.createUserSession)(user, sessionTTL, sessionClient, userRoleClient);
};
exports.createJWTSession = createJWTSession;
const createOAuth2Session = async (name, code, redirectUri, sessionTTL, oauth2Providers, sessionClient, userClient, userRoleClient) => {
    const provider = oauth2Providers.find(provider => provider.name === name);
    if (!provider)
        throw new error_1.OAuth2ProviderNotFoundError();
    const issuer = await openid_client_1.Issuer.discover(provider.discoverUrl);
    const client = new issuer.Client({
        client_id: provider.clientId,
        client_secret: provider.clientKey,
        redirect_uris: provider.redirectUri,
        response_types: ['code']
    });
    const token = await client.callback(redirectUri, { code });
    if (!token.access_token)
        throw new error_1.InvalidOAuth2TokenError();
    const userInfo = await client.userinfo(token.access_token);
    if (!userInfo.email)
        throw new Error('UserInfo did not return an email');
    const user = await userClient.findUnique({
        where: { email: userInfo.email },
        select: user_1.unselectPassword
    });
    if (!user)
        throw new error_1.UserNotFoundError();
    if (!user.active)
        throw new error_1.NotActiveError();
    return await (0, exports.createUserSession)(user, sessionTTL, sessionClient, userRoleClient);
};
exports.createOAuth2Session = createOAuth2Session;
//# sourceMappingURL=session.mutation.js.map