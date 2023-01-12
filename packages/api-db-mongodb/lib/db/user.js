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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBUserAdapter = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const api_1 = require("@wepublish/api");
const mongodb_1 = require("mongodb");
const schema_1 = require("./schema");
const utility_1 = require("../utility");
const defaults_1 = require("./defaults");
const cursor_1 = require("./cursor");
class MongoDBUserAdapter {
    constructor(db, bcryptHashCostFactor, locale) {
        this.users = db.collection(schema_1.CollectionName.Users);
        this.bcryptHashCostFactor = bcryptHashCostFactor;
        this.locale = locale;
    }
    async createUser({ input, password }) {
        try {
            const passwordHash = await bcrypt_1.default.hash(password, this.bcryptHashCostFactor);
            const { insertedId: id } = await this.users.insertOne({
                createdAt: new Date(),
                modifiedAt: new Date(),
                email: input.email,
                emailVerifiedAt: null,
                oauth2Accounts: [],
                name: input.name,
                firstName: input.firstName,
                preferredName: input.preferredName,
                address: input.address,
                active: input.active,
                lastLogin: null,
                properties: input.properties,
                roleIDs: input.roleIDs,
                password: passwordHash,
                paymentProviderCustomers: input.paymentProviderCustomers || []
            });
            return this.getUserByID(id);
        }
        catch (err) {
            if (err instanceof mongodb_1.MongoError && err.code === utility_1.MongoErrorCode.DuplicateKey) {
                throw new Error('Email address already exists!');
            }
            throw err;
        }
    }
    async getUser(email) {
        const user = await this.users.findOne({ email });
        if (user) {
            return {
                id: user._id,
                createdAt: user.createdAt,
                modifiedAt: user.modifiedAt,
                email: user.email,
                emailVerifiedAt: user.emailVerifiedAt,
                oauth2Accounts: user.oauth2Accounts,
                name: user.name,
                firstName: user.firstName,
                preferredName: user.preferredName,
                address: user.address,
                active: user.active,
                lastLogin: user.lastLogin,
                properties: user.properties,
                roleIDs: user.roleIDs,
                paymentProviderCustomers: user.paymentProviderCustomers
            };
        }
        else {
            return null;
        }
    }
    async updateUser({ id, input }) {
        const { value } = await this.users.findOneAndUpdate({ _id: id }, {
            $set: {
                modifiedAt: new Date(),
                name: input.name,
                firstName: input.firstName,
                preferredName: input.preferredName,
                address: input.address,
                active: input.active,
                properties: input.properties,
                email: input.email,
                emailVerifiedAt: input.emailVerifiedAt,
                roleIDs: input.roleIDs
            }
        }, { returnOriginal: false });
        if (!value)
            return null;
        const { _id: outID } = value;
        return this.getUserByID(outID);
    }
    async deleteUser({ id }) {
        const { deletedCount } = await this.users.deleteOne({ _id: id });
        return deletedCount !== 0 ? id : null;
    }
    async resetUserPassword({ id, password }) {
        const { value } = await this.users.findOneAndUpdate({ _id: id }, {
            $set: {
                modifiedAt: new Date(),
                password: await bcrypt_1.default.hash(password, this.bcryptHashCostFactor)
            }
        }, { returnOriginal: false });
        if (!value)
            return null;
        const { _id: outID } = value;
        return this.getUserByID(outID);
    }
    async getUsersByID(ids) {
        const users = await this.users.find({ _id: { $in: ids } }).toArray();
        return users.map(user => {
            return {
                id: user._id,
                createdAt: user.createdAt,
                modifiedAt: user.modifiedAt,
                email: user.email,
                emailVerifiedAt: user.emailVerifiedAt,
                oauth2Accounts: user.oauth2Accounts,
                name: user.name,
                firstName: user.firstName,
                preferredName: user.preferredName,
                address: user.address,
                active: user.active,
                lastLogin: user.lastLogin,
                properties: user.properties,
                roleIDs: user.roleIDs,
                paymentProviderCustomers: user.paymentProviderCustomers
            };
        });
    }
    async getUserForCredentials({ email, password }) {
        const user = await this.users.findOne({ email });
        if (user && (await bcrypt_1.default.compare(password, user.password))) {
            return {
                id: user._id,
                createdAt: user.createdAt,
                modifiedAt: user.modifiedAt,
                email: user.email,
                emailVerifiedAt: user.emailVerifiedAt,
                oauth2Accounts: user.oauth2Accounts,
                name: user.name,
                firstName: user.firstName,
                preferredName: user.preferredName,
                address: user.address,
                active: user.active,
                lastLogin: user.lastLogin,
                properties: user.properties,
                roleIDs: user.roleIDs,
                paymentProviderCustomers: user.paymentProviderCustomers
            };
        }
        return null;
    }
    async getUserByID(id) {
        const user = await this.users.findOne({ _id: id });
        if (user) {
            return {
                id: user._id,
                createdAt: user.createdAt,
                modifiedAt: user.modifiedAt,
                email: user.email,
                emailVerifiedAt: user.emailVerifiedAt,
                oauth2Accounts: user.oauth2Accounts,
                name: user.name,
                firstName: user.firstName,
                preferredName: user.preferredName,
                address: user.address,
                active: user.active,
                lastLogin: user.lastLogin,
                properties: user.properties,
                roleIDs: user.roleIDs,
                paymentProviderCustomers: user.paymentProviderCustomers
            };
        }
        else {
            return null;
        }
    }
    async getUserByOAuth2Account({ provider, providerAccountId }) {
        const user = await this.users.findOne({
            oauth2Accounts: { $elemMatch: { provider, providerAccountId } }
        });
        if (user) {
            return {
                id: user._id,
                createdAt: user.createdAt,
                modifiedAt: user.modifiedAt,
                email: user.email,
                emailVerifiedAt: user.emailVerifiedAt,
                oauth2Accounts: user.oauth2Accounts,
                name: user.name,
                firstName: user.firstName,
                preferredName: user.preferredName,
                address: user.address,
                active: user.active,
                lastLogin: user.lastLogin,
                properties: user.properties,
                roleIDs: user.roleIDs,
                paymentProviderCustomers: user.paymentProviderCustomers
            };
        }
        else {
            return null;
        }
    }
    async getUsers({ filter, sort, order, cursor, limit }) {
        var _a, _b, _c;
        const limitCount = Math.min(limit.count, defaults_1.MaxResultsPerPage);
        const sortDirection = limit.type === api_1.LimitType.First ? order : -order;
        const cursorData = cursor.type !== api_1.InputCursorType.None ? cursor_1.Cursor.from(cursor.data) : undefined;
        const expr = order === api_1.SortOrder.Ascending
            ? cursor.type === api_1.InputCursorType.After
                ? '$gt'
                : '$lt'
            : cursor.type === api_1.InputCursorType.After
                ? '$lt'
                : '$gt';
        const sortField = userSortFieldForSort(sort);
        const cursorFilter = cursorData
            ? {
                $or: [
                    { [sortField]: { [expr]: cursorData.date } },
                    { _id: { [expr]: cursorData.id }, [sortField]: cursorData.date }
                ]
            }
            : {};
        const textFilter = {};
        if (filter && JSON.stringify(filter) !== '{}') {
            textFilter.$and = [];
        }
        // TODO: Rename to search
        if ((filter === null || filter === void 0 ? void 0 : filter.name) !== undefined) {
            (_a = textFilter.$and) === null || _a === void 0 ? void 0 : _a.push({ name: { $regex: (0, utility_1.escapeRegExp)(filter.name), $options: 'i' } });
        }
        if ((filter === null || filter === void 0 ? void 0 : filter.text) !== undefined) {
            const columnsToSearch = [
                'name',
                'firstName',
                'email',
                'address.streetAddress',
                'address.zipCode',
                'address.city'
            ];
            const orConditions = [];
            const search = filter === null || filter === void 0 ? void 0 : filter.text;
            const searchTerms = search.split(' ');
            // iterate user search terms
            for (const searchTerm of searchTerms) {
                // iterate columns to be searched
                for (const column of columnsToSearch) {
                    const orCondition = {};
                    orCondition[column] = {
                        $regex: (0, utility_1.escapeRegExp)(searchTerm),
                        $options: 'im'
                    };
                    orConditions.push(orCondition);
                }
            }
            (_b = textFilter.$and) === null || _b === void 0 ? void 0 : _b.push({
                $or: orConditions
            });
        }
        const [totalCount, users] = await Promise.all([
            this.users.countDocuments(textFilter, {
                collation: { locale: this.locale, strength: 2 }
            }),
            this.users
                .aggregate([], { collation: { locale: this.locale, strength: 2 } })
                .match(textFilter)
                .match(cursorFilter)
                .sort({ [sortField]: sortDirection, _id: sortDirection })
                .skip((_c = limit.skip) !== null && _c !== void 0 ? _c : 0)
                .limit(limitCount + 1)
                .toArray()
        ]);
        const nodes = users.slice(0, limitCount);
        if (limit.type === api_1.LimitType.Last) {
            nodes.reverse();
        }
        const hasNextPage = limit.type === api_1.LimitType.First
            ? users.length > limitCount
            : cursor.type === api_1.InputCursorType.Before;
        const hasPreviousPage = limit.type === api_1.LimitType.Last
            ? users.length > limitCount
            : cursor.type === api_1.InputCursorType.After;
        const firstUser = nodes[0];
        const lastUser = nodes[nodes.length - 1];
        const startCursor = firstUser
            ? new cursor_1.Cursor(firstUser._id, userDateForSort(firstUser, sort)).toString()
            : null;
        const endCursor = lastUser
            ? new cursor_1.Cursor(lastUser._id, userDateForSort(lastUser, sort)).toString()
            : null;
        return {
            nodes: nodes.map((_a) => {
                var { _id: id } = _a, user = __rest(_a, ["_id"]);
                return (Object.assign({ id }, user));
            }),
            pageInfo: {
                startCursor,
                endCursor,
                hasNextPage,
                hasPreviousPage
            },
            totalCount
        };
    }
    async updatePaymentProviderCustomers({ userID, paymentProviderCustomers }) {
        const { value } = await this.users.findOneAndUpdate({ _id: userID }, {
            $set: {
                modifiedAt: new Date(),
                paymentProviderCustomers: paymentProviderCustomers
            }
        }, { returnOriginal: false });
        if (!value)
            return null;
        const { _id: outID } = value;
        return this.getUserByID(outID);
    }
    async addOAuth2Account({ userID, oauth2Account }) {
        const user = await this.users.findOne({ _id: userID });
        if (!user)
            return null;
        const accounts = [...user.oauth2Accounts, oauth2Account];
        const { value } = await this.users.findOneAndUpdate({ _id: userID }, {
            $set: {
                modifiedAt: new Date(),
                oauth2Accounts: accounts
            }
        }, { returnOriginal: false });
        if (!value)
            return null;
        const { _id: outID } = value;
        return this.getUserByID(outID);
    }
    async deleteOAuth2Account({ userID, providerAccountId, provider }) {
        const user = await this.users.findOne({ _id: userID });
        if (!user)
            return null;
        const { value } = await this.users.findOneAndUpdate({ _id: userID }, {
            $set: {
                modifiedAt: new Date(),
                oauth2Accounts: user.oauth2Accounts.filter(account => account.provider !== provider && account.providerAccountId !== providerAccountId)
            }
        }, { returnOriginal: false });
        if (!value)
            return null;
        const { _id: outID } = value;
        return this.getUserByID(outID);
    }
}
exports.MongoDBUserAdapter = MongoDBUserAdapter;
function userSortFieldForSort(sort) {
    switch (sort) {
        case api_1.UserSort.CreatedAt:
            return 'createdAt';
        case api_1.UserSort.ModifiedAt:
            return 'modifiedAt';
        case api_1.UserSort.Name:
            return 'name';
        case api_1.UserSort.FirstName:
            return 'firstName';
    }
}
function userDateForSort(user, sort) {
    switch (sort) {
        case api_1.UserSort.CreatedAt:
            return user.createdAt;
        case api_1.UserSort.ModifiedAt:
            return user.modifiedAt;
        case api_1.UserSort.Name:
            return user.createdAt;
        case api_1.UserSort.FirstName:
            return user.createdAt;
    }
}
//# sourceMappingURL=user.js.map