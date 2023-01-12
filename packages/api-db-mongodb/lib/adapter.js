"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBAdapter = void 0;
const mongodb_1 = require("mongodb");
const api_1 = require("@wepublish/api");
const migration_1 = require("./migration");
const utility_1 = require("./utility");
const user_1 = require("./db/user");
const peer_1 = require("./db/peer");
const session_1 = require("./db/session");
const author_1 = require("./db/author");
const navigation_1 = require("./db/navigation");
const image_1 = require("./db/image");
const token_1 = require("./db/token");
const defaults_1 = require("./db/defaults");
const comment_1 = require("./db/comment");
const article_1 = require("./db/article");
const page_1 = require("./db/page");
const schema_1 = require("./db/schema");
const userRole_1 = require("./db/userRole");
const memberPlan_1 = require("./db/memberPlan");
const paymentMethod_1 = require("./db/paymentMethod");
const invoice_1 = require("./db/invoice");
const payment_1 = require("./db/payment");
const mailLog_1 = require("./db/mailLog");
const subscription_1 = require("./db/subscription");
const setting_1 = require("./db/setting");
class MongoDBAdapter {
    // Init
    // ====
    constructor({ sessionTTL = defaults_1.DefaultSessionTTL, bcryptHashCostFactor = defaults_1.DefaultBcryptHashCostFactor, locale, client, db }) {
        this.sessionTTL = sessionTTL;
        this.bcryptHashCostFactor = bcryptHashCostFactor;
        this.locale = locale;
        this.client = client;
        this.db = db;
        this.peer = new peer_1.MongoDBPeerAdapter(db);
        this.user = new user_1.MongoDBUserAdapter(db, bcryptHashCostFactor, locale);
        this.userRole = new userRole_1.MongoDBUserRoleAdapter(db, locale);
        this.subscription = new subscription_1.MongoDBSubscriptionAdapter(db, locale);
        this.session = new session_1.MongoDBSessionAdapter(db, this.user, this.userRole, sessionTTL);
        this.token = new token_1.MongoDBTokenAdapter(db);
        this.navigation = new navigation_1.MongoDBNavigationAdapter(db);
        this.comment = new comment_1.MongoDBCommentAdapter(db, locale);
        this.author = new author_1.MongoDBAuthorAdapter(db, locale);
        this.image = new image_1.MongoDBImageAdapter(db, locale);
        this.article = new article_1.MongoDBArticleAdapter(db, locale);
        this.page = new page_1.MongoDBPageAdapter(db, locale);
        this.memberPlan = new memberPlan_1.MongoDBMemberPlanAdapter(db, locale);
        this.paymentMethod = new paymentMethod_1.MongoDBPaymentMethodAdapter(db);
        this.invoice = new invoice_1.MongoDBInvoiceAdapter(db, locale);
        this.payment = new payment_1.MongoDBPaymentAdapter(db, locale);
        this.mailLog = new mailLog_1.MongoDBMailLogAdapter(db, locale);
        this.setting = new setting_1.MongoDBSettingAdapter(db);
    }
    static createMongoClient(url) {
        return mongodb_1.MongoClient.connect(url, {
            pkFactory: {
                createPk() {
                    return (0, utility_1.generateID)();
                }
            },
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    }
    static async connect({ sessionTTL = defaults_1.DefaultSessionTTL, bcryptHashCostFactor = defaults_1.DefaultBcryptHashCostFactor, url, locale }) {
        const client = await this.createMongoClient(url);
        const db = client.db();
        const migrationState = await this.getDBMigrationState(db);
        if ((migrationState === null || migrationState === void 0 ? void 0 : migrationState.version) !== migration_1.LatestMigration.version) {
            throw new Error('Database is not initialized or out of date, call `initialize` to intialize/migrate database.');
        }
        return new MongoDBAdapter({
            sessionTTL,
            bcryptHashCostFactor,
            client,
            db,
            locale
        });
    }
    static async getDBMigrationState(db) {
        const result = await db
            .collection(schema_1.CollectionName.Migrations)
            .findOne({}, { sort: { createdAt: api_1.SortOrder.Descending } });
        return result;
    }
    static async initialize({ sessionTTL = defaults_1.DefaultSessionTTL, bcryptHashCostFactor = defaults_1.DefaultBcryptHashCostFactor, url, locale, seed }) {
        const client = await this.createMongoClient(url);
        const db = client.db();
        const migrationState = await this.getDBMigrationState(db);
        if ((migrationState === null || migrationState === void 0 ? void 0 : migrationState.version) === migration_1.LatestMigration.version) {
            return {};
        }
        const index = migration_1.Migrations.findIndex(migration => migration.version === (migrationState === null || migrationState === void 0 ? void 0 : migrationState.version));
        const remainingMigrations = migration_1.Migrations.slice(index + 1);
        for (const migration of remainingMigrations) {
            await migration.migrate(db, locale);
            await db.collection(schema_1.CollectionName.Migrations).insertOne({
                version: migration.version,
                createdAt: new Date()
            });
        }
        if (!migrationState) {
            const adapter = await this.connect({ sessionTTL, bcryptHashCostFactor, url, locale });
            await (seed === null || seed === void 0 ? void 0 : seed(adapter));
            await adapter.client.close();
        }
        await client.close();
        return {
            migrated: {
                from: migrationState === null || migrationState === void 0 ? void 0 : migrationState.version,
                to: migration_1.LatestMigration.version
            }
        };
    }
}
exports.MongoDBAdapter = MongoDBAdapter;
//# sourceMappingURL=adapter.js.map