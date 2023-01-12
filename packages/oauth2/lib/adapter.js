"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBAdapter = void 0;
const mongodb_1 = require("mongodb");
const snakeCase_1 = __importDefault(require("lodash/snakeCase"));
const migrations_1 = require("./migrations");
const schema_1 = require("./schema");
var SortOrder;
(function (SortOrder) {
    SortOrder[SortOrder["Ascending"] = 1] = "Ascending";
    SortOrder[SortOrder["Descending"] = -1] = "Descending";
})(SortOrder || (SortOrder = {}));
class MongoDBAdapter {
    constructor(name) {
        this.name = (0, snakeCase_1.default)(name);
    }
    // NOTE: the payload for Session model may contain client_id as keys, make sure you do not use
    //   dots (".") in your client_id value charset.
    async upsert(_id, payload, expiresIn) {
        let expiresAt;
        if (expiresIn) {
            expiresAt = new Date(Date.now() + expiresIn * 1000);
        }
        await this.coll(this.name).updateOne({ _id }, { $set: Object.assign({ payload }, (expiresAt ? { expiresAt } : undefined)) }, { upsert: true });
    }
    async find(_id) {
        const result = await this.coll(this.name)
            .find({ _id }
        //{ payload: 1 },
        )
            .limit(1)
            .next();
        if (!result)
            return undefined;
        return result.payload;
    }
    async findByUserCode(userCode) {
        const result = await this.coll(this.name)
            .find({ 'payload.userCode': userCode }
        //  { payload: 1 },
        )
            .limit(1)
            .next();
        if (!result)
            return undefined;
        return result.payload;
    }
    async findByUid(uid) {
        const result = await this.coll(this.name)
            .find({ 'payload.uid': uid }
        //  { payload: 1 },
        )
            .limit(1)
            .next();
        if (!result)
            return undefined;
        return result.payload;
    }
    async destroy(_id) {
        await this.coll(this.name).deleteOne({ _id });
    }
    async revokeByGrantId(grantId) {
        await this.coll(this.name).deleteMany({ 'payload.grantId': grantId });
    }
    async consume(_id) {
        await this.coll(this.name).findOneAndUpdate({ _id }, { $set: { 'payload.consumed': Math.floor(Date.now() / 1000) } });
    }
    coll(name) {
        return MongoDBAdapter.client.collection(name);
    }
    // This is not part of the required or supported API, all initialization should happen before
    // you pass the adapter to `new Provider`
    static async connect(url) {
        const connection = await mongodb_1.MongoClient.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        this.client = connection.db();
        const migrationState = await this.getDBMigrationState(this.client);
        if ((migrationState === null || migrationState === void 0 ? void 0 : migrationState.version) !== migrations_1.LatestMigration.version) {
            throw new Error('Database is not initialized or out of date, call `initialize` to intialize/migrate database.');
        }
    }
    static async getDBMigrationState(db) {
        const result = await db
            .collection(schema_1.CollectionName.Migrations)
            .findOne({}, { sort: { createdAt: SortOrder.Descending } });
        return result;
    }
    static async initialize(url, locale) {
        const client = await mongodb_1.MongoClient.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        const db = client.db();
        const migrationState = await this.getDBMigrationState(db);
        if ((migrationState === null || migrationState === void 0 ? void 0 : migrationState.version) === migrations_1.LatestMigration.version) {
            return {};
        }
        const index = migrations_1.Migrations.findIndex(migration => migration.version === (migrationState === null || migrationState === void 0 ? void 0 : migrationState.version));
        const remainingMigrations = migrations_1.Migrations.slice(index + 1);
        for (const migration of remainingMigrations) {
            await migration.migrate(db, locale);
            await db.collection(schema_1.CollectionName.Migrations).insertOne({
                version: migration.version,
                createdAt: new Date()
            });
        }
        return {
            migrated: {
                from: migrationState === null || migrationState === void 0 ? void 0 : migrationState.version,
                to: migrations_1.LatestMigration.version
            }
        };
    }
}
exports.MongoDBAdapter = MongoDBAdapter;
MongoDBAdapter.DefaultSessionTTL = 1000 * 60 * 60 * 24 * 7; // 1w
MongoDBAdapter.DefaultBcryptHashCostFactor = 11;
MongoDBAdapter.MaxResultsPerPage = 100;
MongoDBAdapter.DatabaseName = 'oauth2';
//# sourceMappingURL=adapter.js.map