"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBSessionAdapter = void 0;
const api_1 = require("@wepublish/api");
const schema_1 = require("./schema");
const utility_1 = require("../utility");
class MongoDBSessionAdapter {
    constructor(db, user, userRole, sessionTTL) {
        this.sessions = db.collection(schema_1.CollectionName.Sessions);
        this.tokens = db.collection(schema_1.CollectionName.Tokens);
        this.user = user;
        this.userRole = userRole;
        this.sessionTTL = sessionTTL;
    }
    async createUserSession(user) {
        const token = (0, utility_1.generateToken)();
        const createdAt = new Date();
        const expiresAt = new Date(Date.now() + this.sessionTTL);
        const { insertedId: id } = await this.sessions.insertOne({
            token: token,
            userID: user.id,
            createdAt,
            expiresAt
        });
        return {
            type: api_1.SessionType.User,
            id,
            user,
            token,
            createdAt,
            expiresAt,
            roles: await this.userRole.getNonOptionalUserRolesByID(user.roleIDs)
        };
    }
    async deleteUserSessionByToken(token) {
        const { deletedCount } = await this.sessions.deleteOne({ token });
        return deletedCount === 1;
    }
    async getSessionByToken(token) {
        const [tokenMatch, session] = await Promise.all([
            this.tokens.findOne({ token }),
            this.sessions.findOne({ token })
        ]);
        if (tokenMatch) {
            return {
                type: api_1.SessionType.Token,
                id: tokenMatch._id,
                name: tokenMatch.name,
                token: tokenMatch.token,
                roles: await this.userRole.getNonOptionalUserRolesByID(tokenMatch.roleIDs)
            };
        }
        else if (session) {
            const user = await this.user.getUserByID(session.userID);
            if (!user)
                return null;
            return {
                type: api_1.SessionType.User,
                id: session._id,
                token: session.token,
                createdAt: session.createdAt,
                expiresAt: session.expiresAt,
                user,
                roles: await this.userRole.getNonOptionalUserRolesByID(user.roleIDs)
            };
        }
        return null;
    }
    async extendUserSessionByToken(token) {
        const { value } = await this.sessions.findOneAndUpdate({ token }, {
            $set: {
                expiresAt: new Date(Date.now() + this.sessionTTL)
            }
        }, { returnOriginal: false });
        if (!value)
            return null;
        const user = await this.user.getUserByID(value.userID);
        if (!user)
            return null;
        return {
            type: api_1.SessionType.User,
            id: value._id,
            token: value.token,
            createdAt: value.createdAt,
            expiresAt: value.expiresAt,
            user,
            roles: await this.userRole.getNonOptionalUserRolesByID(user.roleIDs)
        };
    }
    async deleteUserSessionByID(user, id) {
        const { deletedCount } = await this.sessions.deleteOne({ _id: id, userID: user.id });
        return deletedCount === 1;
    }
    async getUserSessions(user) {
        const sessions = await this.sessions.find({ userID: user.id }).toArray();
        const roles = await this.userRole.getNonOptionalUserRolesByID(user.roleIDs);
        return sessions.map(session => ({
            type: api_1.SessionType.User,
            id: session._id,
            token: session.token,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            user,
            roles
        }));
    }
    async getSessionByID(user, id) {
        const session = await this.sessions.findOne({ _id: id, userID: user.id });
        if (!session)
            return null;
        return {
            type: api_1.SessionType.User,
            id: session._id,
            token: session.token,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            user: user,
            roles: await this.userRole.getNonOptionalUserRolesByID(user.roleIDs)
        };
    }
}
exports.MongoDBSessionAdapter = MongoDBSessionAdapter;
//# sourceMappingURL=session.js.map